import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db-sqlite'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const pegawaiId = request.nextUrl.searchParams.get('pegawaiId')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const jenis = request.nextUrl.searchParams.get('jenis') || 'jabatan'

    try {
      const conditions: string[] = []
      const params: unknown[] = []

      if (pegawaiId) {
        conditions.push('r.pegawaiId = ?')
        params.push(pegawaiId)
      }
      if (sekolahId) {
        conditions.push('p.sekolahId = ?')
        params.push(sekolahId)
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

      let data: unknown[] = []

      if (jenis === 'jabatan') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik, p.jenisPegawai as p_jenisPegawai
           FROM RiwayatJabatan r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tmtJabatan DESC`,
          params
        )
      } else if (jenis === 'mutasi') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatMutasi r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tanggalMutasi DESC`,
          params
        )
      } else if (jenis === 'pelatihan') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatPelatihan r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tahunPelatihan DESC`,
          params
        )
      } else if (jenis === 'pendidikan') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatPendidikan r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tahunLulus DESC`,
          params
        )
      } else if (jenis === 'pangkat') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatPangkat r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tmtPangkat DESC`,
          params
        )
      } else {
        data = []
      }

      const result = data.map((r: Record<string, unknown>) => {
        const { p_nama, p_nip, p_nik } = r
        return {
          ...r,
          pegawai: p_nama ? { nama: p_nama, nip: p_nip, nik: p_nik } : null,
        }
      })

      return NextResponse.json({ success: true, data: result })
    } catch (dbError) {
      console.warn('Riwayat GET: DB query failed:', dbError)
      return NextResponse.json({ success: true, data: [] })
    }
  } catch (error) {
    console.error('Riwayat GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jenis, pegawaiId, userId } = body

    if (!jenis || !pegawaiId) {
      return NextResponse.json(
        { success: false, error: 'Parameter jenis dan pegawaiId wajib diisi' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    if (jenis === 'jabatan') {
      const { jabatan, unitKerja, tmtJabatan, nomorSk } = body
      if (!jabatan) {
        return NextResponse.json({ success: false, error: 'Jabatan wajib diisi' }, { status: 400 })
      }
      execute(
        `INSERT INTO RiwayatJabatan (id, pegawaiId, jabatan, unitKerja, tmtJabatan, nomorSk, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, pegawaiId, jabatan, unitKerja || null, tmtJabatan || null, nomorSk || null, now, now]
      )
    } else if (jenis === 'mutasi') {
      const { sekolahAsal, sekolahTujuan, tanggalMutasi, nomorSk, keterangan } = body
      execute(
        `INSERT INTO RiwayatMutasi (id, pegawaiId, sekolahAsal, sekolahTujuan, tanggalMutasi, nomorSk, keterangan, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, pegawaiId, sekolahAsal || null, sekolahTujuan || null, tanggalMutasi || null, nomorSk || null, keterangan || null, now, now]
      )
    } else if (jenis === 'pelatihan') {
      const { namaPelatihan, penyelenggara, tahunPelatihan, nomorSertifikat } = body
      if (!namaPelatihan) {
        return NextResponse.json({ success: false, error: 'Nama pelatihan wajib diisi' }, { status: 400 })
      }
      execute(
        `INSERT INTO RiwayatPelatihan (id, pegawaiId, namaPelatihan, penyelenggara, tahunPelatihan, nomorSertifikat, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, pegawaiId, namaPelatihan, penyelenggara || null, tahunPelatihan || null, nomorSertifikat || null, now, now]
      )
    } else if (jenis === 'pendidikan') {
      const { jenjang, jurusan, namaSekolahKampus, tahunLulus, nomorIjazah } = body
      execute(
        `INSERT INTO RiwayatPendidikan (id, pegawaiId, jenjang, jurusan, namaSekolahKampus, tahunLulus, nomorIjazah, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, pegawaiId, jenjang || null, jurusan || null, namaSekolahKampus || null, tahunLulus || null, nomorIjazah || null, now, now]
      )
    } else if (jenis === 'pangkat') {
      const { pangkat, golongan, tmtPangkat, nomorSk } = body
      execute(
        `INSERT INTO RiwayatPangkat (id, pegawaiId, pangkat, golongan, tmtPangkat, nomorSk, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, pegawaiId, pangkat || null, golongan || null, tmtPangkat || null, nomorSk || null, now, now]
      )
    } else {
      return NextResponse.json(
        { success: false, error: 'Jenis riwayat tidak valid' },
        { status: 400 }
      )
    }

    // Log activity
    if (userId) {
      execute(
        `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt) VALUES (?, ?, 'tambah', 'pegawai', ?, ?)`,
        [crypto.randomUUID(), userId, `Menambahkan riwayat ${jenis}`, now]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Riwayat berhasil ditambahkan',
      data: { id },
    })
  } catch (error) {
    console.error('Riwayat POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
