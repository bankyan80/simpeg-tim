import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, count, execute } from '@/lib/db-turso'

export async function GET(request: NextRequest) {
  try {
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const npsn = request.nextUrl.searchParams.get('npsn')
    const statusKepegawaian = request.nextUrl.searchParams.get('statusKepegawaian')
    const jenisPegawai = request.nextUrl.searchParams.get('jenisPegawai')
    const statusPegawai = request.nextUrl.searchParams.get('statusPegawai')
    const search = request.nextUrl.searchParams.get('search')
    const statusBup = request.nextUrl.searchParams.get('statusBup')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

    try {
      const conditions: string[] = []
      const params: unknown[] = []

      // Resolve NPSN to sekolahId
      let effectiveSekolahId = sekolahId
      if (npsn && !sekolahId) {
        const sekolah = await queryOne<{ id: string }>('SELECT id FROM Sekolah WHERE npsn = ?', [npsn])
        if (sekolah) {
          effectiveSekolahId = sekolah.id
        }
      }

      if (effectiveSekolahId) {
        conditions.push('p.sekolahId = ?')
        params.push(effectiveSekolahId)
      }

      if (statusKepegawaian) {
        conditions.push('p.statusKepegawaian = ?')
        params.push(statusKepegawaian)
      }

      if (jenisPegawai) {
        conditions.push('p.jenisPegawai = ?')
        params.push(jenisPegawai)
      }

      if (statusPegawai) {
        conditions.push('p.statusPegawai = ?')
        params.push(statusPegawai)
      }

      if (statusBup) {
        conditions.push('p.statusBup = ?')
        params.push(statusBup)
      }

      if (request.nextUrl.searchParams.get('tahunPensiun')) {
        const tahunPensiun = parseInt(request.nextUrl.searchParams.get('tahunPensiun')!)
        conditions.push('p.tahunPensiun = ?')
        params.push(tahunPensiun)
      }

      if (search) {
        conditions.push('(p.nama LIKE ? OR p.nik LIKE ? OR p.nip LIKE ? OR p.nuptk LIKE ? OR p.jabatan LIKE ?)')
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
      const skip = (page - 1) * limit

      const pegawai = await query(
        `SELECT p.*, s.id as s_id, s.namaSekolah as s_namaSekolah, s.npsn as s_npsn, s.jenjang as s_jenjang
         FROM Pegawai p
         LEFT JOIN Sekolah s ON p.sekolahId = s.id
         ${whereClause}
         ORDER BY p.nama ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      )

      // Transform to match Prisma include format
      const data = pegawai.map((p: Record<string, unknown>) => {
        const { s_id, s_namaSekolah, s_npsn, s_jenjang, ...rest } = p
        return {
          ...rest,
          sekolah: s_id ? {
            id: s_id,
            namaSekolah: s_namaSekolah,
            npsn: s_npsn,
            jenjang: s_jenjang,
          } : null,
        }
      })

      const totalResult = await queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM Pegawai p ${whereClause}`, params)
      const total = totalResult?.cnt ?? 0

      return NextResponse.json({
        success: true,
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (dbError) {
      console.warn('Pegawai GET: DB query failed, returning empty:', dbError)
    }

    // Fallback: return empty data
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    })
  } catch (error) {
    console.error('Pegawai GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sekolahId, nik, nip, nuptk, nama, tempatLahir, tanggalLahir,
      jenisKelamin, agama, alamat, noHp, email, jabatan,
      jenisPegawai, statusKepegawaian, pangkat, golongan,
      pendidikanTerakhir, jurusan, sertifikasi, nomorSertifikat,
      bidangSertifikasi, tahunSertifikasi, nrg, statusTpg,
      tmtTugas, tmtSekolah, tmtJabatan, tmtPangkat,
      masaKerjaTahun, masaKerjaBulan, keteranganBup, userId,
    } = body

    if (!sekolahId || !nik || !nama) {
      return NextResponse.json(
        { success: false, error: 'Sekolah, NIK, dan nama wajib diisi' },
        { status: 400 }
      )
    }

    try {
      // Validate NIK unique
      const existingNik = await queryOne('SELECT id FROM Pegawai WHERE nik = ?', [nik])
      if (existingNik) {
        return NextResponse.json(
          { success: false, error: 'NIK sudah terdaftar' },
          { status: 409 }
        )
      }

      // Validate NIP unique if provided
      if (nip) {
        const existingNip = await queryOne('SELECT id FROM Pegawai WHERE nip = ?', [nip])
        if (existingNip) {
          return NextResponse.json(
            { success: false, error: 'NIP sudah terdaftar' },
            { status: 409 }
          )
        }
      }

      // Auto-calculate tahunPensiun
      let tahunPensiun: number | null = null
      let statusBup: string | null = null
      if (tanggalLahir) {
        const birthDate = new Date(tanggalLahir)
        const retirementAge = jenisPegawai === 'Guru' ? 60 : 58
        tahunPensiun = birthDate.getFullYear() + retirementAge

        const currentYear = new Date().getFullYear()
        if (tahunPensiun < currentYear) {
          statusBup = 'sudah_pensiun'
        } else if (tahunPensiun <= currentYear + 1) {
          statusBup = 'akan_pensiun'
        } else {
          statusBup = 'aktif'
        }
      }

      await execute(
        `INSERT INTO Pegawai (id, sekolahId, nik, nip, nuptk, nama, tempatLahir, tanggalLahir, jenisKelamin, agama, alamat, noHp, email, jabatan, jenisPegawai, statusKepegawaian, statusPegawai, pangkat, golongan, pendidikanTerakhir, jurusan, sertifikasi, nomorSertifikat, bidangSertifikasi, tahunSertifikasi, nrg, statusTpg, tmtTugas, tmtSekolah, tmtJabatan, tmtPangkat, masaKerjaTahun, masaKerjaBulan, tahunPensiun, statusBup, keteranganBup, createdAt, updatedAt)
         VALUES (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          sekolahId, nik, nip || null, nuptk || null, nama,
          tempatLahir || null, tanggalLahir || null, jenisKelamin || null,
          agama || null, alamat || null, noHp || null, email || null,
          jabatan || null, jenisPegawai || null, statusKepegawaian || null,
          pangkat || null, golongan || null, pendidikanTerakhir || null,
          jurusan || null, sertifikasi || null, nomorSertifikat || null,
          bidangSertifikasi || null, tahunSertifikasi || null, nrg || null,
          statusTpg || null, tmtTugas || null, tmtSekolah || null,
          tmtJabatan || null, tmtPangkat || null,
          masaKerjaTahun || 0, masaKerjaBulan || 0,
          tahunPensiun, statusBup, keteranganBup || null,
        ]
      )

      // Get the created pegawai with sekolah info
      const newPegawai = await queryOne<Record<string, unknown>>('SELECT p.*, s.id as s_id, s.namaSekolah as s_namaSekolah, s.npsn as s_npsn, s.jenjang as s_jenjang FROM Pegawai p LEFT JOIN Sekolah s ON p.sekolahId = s.id WHERE p.nik = ?', [nik])

      // Create log aktivitas
      if (userId) {
        await execute(
          `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt) VALUES (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))), ?, 'tambah', 'pegawai', ?, datetime('now'))`,
          [userId, `Menambah pegawai baru: ${nama} (NIK: ${nik})`]
        )
      }

      if (newPegawai) {
        const { s_id, s_namaSekolah, s_npsn, s_jenjang, ...rest } = newPegawai
        return NextResponse.json({
          success: true,
          data: {
            ...rest,
            sekolah: s_id ? { id: s_id, namaSekolah: s_namaSekolah, npsn: s_npsn, jenjang: s_jenjang } : null,
          },
        }, { status: 201 })
      }

      return NextResponse.json({
        success: true,
        data: { nik, nama, sekolahId },
      }, { status: 201 })
    } catch (dbError) {
      console.error('Pegawai POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Pegawai POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
