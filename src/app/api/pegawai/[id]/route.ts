import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db-turso'

interface SekolahRow {
  id: string
  npsn: string
  namaSekolah: string
  jenjang: string
  kecamatan: string
  desa: string | null
  alamat: string | null
  kepalaSekolah: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface PegawaiRow {
  id: string
  sekolahId: string
  nik: string
  nip: string | null
  nuptk: string | null
  nama: string
  tempatLahir: string | null
  tanggalLahir: string | null
  jenisKelamin: string | null
  agama: string | null
  alamat: string | null
  noHp: string | null
  email: string | null
  foto: string | null
  jabatan: string | null
  jenisPegawai: string | null
  statusKepegawaian: string | null
  statusPegawai: string
  pangkat: string | null
  golongan: string | null
  pendidikanTerakhir: string | null
  jurusan: string | null
  sertifikasi: string | null
  nomorSertifikat: string | null
  bidangSertifikasi: string | null
  tahunSertifikasi: string | null
  nrg: string | null
  statusTpg: string | null
  tmtTugas: string | null
  tmtSekolah: string | null
  tmtJabatan: string | null
  tmtPangkat: string | null
  masaKerjaTahun: number
  masaKerjaBulan: number
  tahunPensiun: number | null
  statusBup: string | null
  keteranganBup: string | null
  createdAt: string
  updatedAt: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    try {
      const pegawai = await queryOne<PegawaiRow>(
        'SELECT * FROM Pegawai WHERE id = ?',
        [id]
      )

      if (!pegawai) {
        return NextResponse.json(
          { success: false, error: 'Pegawai tidak ditemukan' },
          { status: 404 }
        )
      }

      const sekolah = await queryOne<SekolahRow>(
        'SELECT * FROM Sekolah WHERE id = ?',
        [pegawai.sekolahId]
      )

      const riwayatPendidikan = await query(
        'SELECT * FROM RiwayatPendidikan WHERE pegawaiId = ? ORDER BY tahunLulus DESC',
        [id]
      )

      const riwayatJabatan = await query(
        'SELECT * FROM RiwayatJabatan WHERE pegawaiId = ? ORDER BY tmtJabatan DESC',
        [id]
      )

      const riwayatPangkat = await query(
        'SELECT * FROM RiwayatPangkat WHERE pegawaiId = ? ORDER BY tmtPangkat DESC',
        [id]
      )

      const riwayatSertifikasi = await query(
        'SELECT * FROM RiwayatSertifikasi WHERE pegawaiId = ? ORDER BY tahunSertifikasi DESC',
        [id]
      )

      const riwayatMutasi = await query(
        'SELECT * FROM RiwayatMutasi WHERE pegawaiId = ? ORDER BY tanggalMutasi DESC',
        [id]
      )

      const riwayatPelatihan = await query(
        'SELECT * FROM RiwayatPelatihan WHERE pegawaiId = ? ORDER BY tahunPelatihan DESC',
        [id]
      )

      const dokumenPegawai = await query(
        'SELECT * FROM DokumenPegawai WHERE pegawaiId = ? ORDER BY uploadedAt DESC',
        [id]
      )

      const result = {
        ...pegawai,
        sekolah,
        riwayatPendidikan,
        riwayatJabatan,
        riwayatPangkat,
        riwayatSertifikasi,
        riwayatMutasi,
        riwayatPelatihan,
        dokumenPegawai,
      }

      return NextResponse.json({
        success: true,
        data: result,
      })
    } catch (dbError) {
      console.warn('Pegawai GET [id]: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: null,
      })
    }
  } catch (error) {
    console.error('Pegawai GET [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      sekolahId,
      nik,
      nip,
      nuptk,
      nama,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      agama,
      alamat,
      noHp,
      email,
      foto,
      jabatan,
      jenisPegawai,
      statusKepegawaian,
      statusPegawai,
      pangkat,
      golongan,
      pendidikanTerakhir,
      jurusan,
      sertifikasi,
      nomorSertifikat,
      bidangSertifikasi,
      tahunSertifikasi,
      nrg,
      statusTpg,
      tmtTugas,
      tmtSekolah,
      tmtJabatan,
      tmtPangkat,
      masaKerjaTahun,
      masaKerjaBulan,
      keteranganBup,
      userId,
    } = body

    try {
      // Check if pegawai exists
      const existing = await queryOne<PegawaiRow>(
        'SELECT * FROM Pegawai WHERE id = ?',
        [id]
      )
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Pegawai tidak ditemukan' },
          { status: 404 }
        )
      }

      // Validate NIK unique (excluding current)
      if (nik && nik !== existing.nik) {
        const existingNik = await queryOne<{ id: string }>(
          'SELECT id FROM Pegawai WHERE nik = ?',
          [nik]
        )
        if (existingNik) {
          return NextResponse.json(
            { success: false, error: 'NIK sudah terdaftar' },
            { status: 409 }
          )
        }
      }

      // Validate NIP unique if provided (excluding current)
      if (nip && nip !== existing.nip) {
        const existingNip = await queryOne<{ id: string }>(
          'SELECT id FROM Pegawai WHERE nip = ?',
          [nip]
        )
        if (existingNip) {
          return NextResponse.json(
            { success: false, error: 'NIP sudah terdaftar' },
            { status: 409 }
          )
        }
      }

      // Auto-calculate tahunPensiun if tanggalLahir or jenisPegawai changed
      let tahunPensiun = existing.tahunPensiun
      let statusBup = existing.statusBup
      const effectiveTanggalLahir = tanggalLahir !== undefined ? tanggalLahir : existing.tanggalLahir
      const effectiveJenisPegawai = jenisPegawai !== undefined ? jenisPegawai : existing.jenisPegawai

      if (effectiveTanggalLahir) {
        const birthDate = new Date(effectiveTanggalLahir)
        const retirementAge = effectiveJenisPegawai === 'Guru' ? 60 : 58
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

      // Build dynamic UPDATE SET clause
      const setClauses: string[] = []
      const setParams: unknown[] = []

      if (sekolahId !== undefined) { setClauses.push('sekolahId = ?'); setParams.push(sekolahId) }
      if (nik !== undefined) { setClauses.push('nik = ?'); setParams.push(nik) }
      if (nip !== undefined) { setClauses.push('nip = ?'); setParams.push(nip || null) }
      if (nuptk !== undefined) { setClauses.push('nuptk = ?'); setParams.push(nuptk || null) }
      if (nama !== undefined) { setClauses.push('nama = ?'); setParams.push(nama) }
      if (tempatLahir !== undefined) { setClauses.push('tempatLahir = ?'); setParams.push(tempatLahir || null) }
      if (tanggalLahir !== undefined) { setClauses.push('tanggalLahir = ?'); setParams.push(tanggalLahir || null) }
      if (jenisKelamin !== undefined) { setClauses.push('jenisKelamin = ?'); setParams.push(jenisKelamin || null) }
      if (agama !== undefined) { setClauses.push('agama = ?'); setParams.push(agama || null) }
      if (alamat !== undefined) { setClauses.push('alamat = ?'); setParams.push(alamat || null) }
      if (noHp !== undefined) { setClauses.push('noHp = ?'); setParams.push(noHp || null) }
      if (email !== undefined) { setClauses.push('email = ?'); setParams.push(email || null) }
      if (foto !== undefined) { setClauses.push('foto = ?'); setParams.push(foto || null) }
      if (jabatan !== undefined) { setClauses.push('jabatan = ?'); setParams.push(jabatan || null) }
      if (jenisPegawai !== undefined) { setClauses.push('jenisPegawai = ?'); setParams.push(jenisPegawai || null) }
      if (statusKepegawaian !== undefined) { setClauses.push('statusKepegawaian = ?'); setParams.push(statusKepegawaian || null) }
      if (statusPegawai !== undefined) { setClauses.push('statusPegawai = ?'); setParams.push(statusPegawai) }
      if (pangkat !== undefined) { setClauses.push('pangkat = ?'); setParams.push(pangkat || null) }
      if (golongan !== undefined) { setClauses.push('golongan = ?'); setParams.push(golongan || null) }
      if (pendidikanTerakhir !== undefined) { setClauses.push('pendidikanTerakhir = ?'); setParams.push(pendidikanTerakhir || null) }
      if (jurusan !== undefined) { setClauses.push('jurusan = ?'); setParams.push(jurusan || null) }
      if (sertifikasi !== undefined) { setClauses.push('sertifikasi = ?'); setParams.push(sertifikasi || null) }
      if (nomorSertifikat !== undefined) { setClauses.push('nomorSertifikat = ?'); setParams.push(nomorSertifikat || null) }
      if (bidangSertifikasi !== undefined) { setClauses.push('bidangSertifikasi = ?'); setParams.push(bidangSertifikasi || null) }
      if (tahunSertifikasi !== undefined) { setClauses.push('tahunSertifikasi = ?'); setParams.push(tahunSertifikasi || null) }
      if (nrg !== undefined) { setClauses.push('nrg = ?'); setParams.push(nrg || null) }
      if (statusTpg !== undefined) { setClauses.push('statusTpg = ?'); setParams.push(statusTpg || null) }
      if (tmtTugas !== undefined) { setClauses.push('tmtTugas = ?'); setParams.push(tmtTugas || null) }
      if (tmtSekolah !== undefined) { setClauses.push('tmtSekolah = ?'); setParams.push(tmtSekolah || null) }
      if (tmtJabatan !== undefined) { setClauses.push('tmtJabatan = ?'); setParams.push(tmtJabatan || null) }
      if (tmtPangkat !== undefined) { setClauses.push('tmtPangkat = ?'); setParams.push(tmtPangkat || null) }
      if (masaKerjaTahun !== undefined) { setClauses.push('masaKerjaTahun = ?'); setParams.push(masaKerjaTahun) }
      if (masaKerjaBulan !== undefined) { setClauses.push('masaKerjaBulan = ?'); setParams.push(masaKerjaBulan) }

      // Always update these computed fields
      setClauses.push('tahunPensiun = ?'); setParams.push(tahunPensiun)
      setClauses.push('statusBup = ?'); setParams.push(statusBup)

      if (keteranganBup !== undefined) { setClauses.push('keteranganBup = ?'); setParams.push(keteranganBup || null) }

      setClauses.push("updatedAt = datetime('now')")

      await execute(
        `UPDATE Pegawai SET ${setClauses.join(', ')} WHERE id = ?`,
        [...setParams, id]
      )

      // Fetch updated record with sekolah
      const updatedPegawai = await queryOne<PegawaiRow>(
        'SELECT * FROM Pegawai WHERE id = ?',
        [id]
      )

      const updatedSekolah = updatedPegawai ? await queryOne<{
        id: string
        namaSekolah: string
        npsn: string
        jenjang: string
      }>(
        'SELECT id, namaSekolah, npsn, jenjang FROM Sekolah WHERE id = ?',
        [updatedPegawai.sekolahId]
      ) : null

      const pegawaiResult = updatedPegawai ? {
        ...updatedPegawai,
        sekolah: updatedSekolah,
      } : null

      // Create log aktivitas
      if (userId && updatedPegawai) {
        const logIdResult = await queryOne<{ id: string }>(
          "SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) as id"
        )
        await execute(
          `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt)
           VALUES (?, ?, 'edit', 'pegawai', ?, datetime('now'))`,
          [logIdResult!.id, userId, `Mengedit data pegawai: ${updatedPegawai.nama} (NIK: ${updatedPegawai.nik})`]
        )
      }

      return NextResponse.json({
        success: true,
        data: pegawaiResult,
      })
    } catch (dbError) {
      console.warn('Pegawai PUT [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Pegawai PUT [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.nextUrl.searchParams.get('userId')

    try {
      const existing = await queryOne<PegawaiRow>(
        'SELECT * FROM Pegawai WHERE id = ?',
        [id]
      )
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Pegawai tidak ditemukan' },
          { status: 404 }
        )
      }

      // Soft delete - set statusPegawai to tidak_aktif
      await execute(
        "UPDATE Pegawai SET statusPegawai = 'tidak_aktif', updatedAt = datetime('now') WHERE id = ?",
        [id]
      )

      const pegawai = await queryOne<PegawaiRow>(
        'SELECT * FROM Pegawai WHERE id = ?',
        [id]
      )

      // Create log aktivitas
      if (userId) {
        const logIdResult = await queryOne<{ id: string }>(
          "SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) as id"
        )
        await execute(
          `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt)
           VALUES (?, ?, 'hapus', 'pegawai', ?, datetime('now'))`,
          [logIdResult!.id, userId, `Menonaktifkan pegawai: ${existing.nama} (NIK: ${existing.nik})`]
        )
      }

      return NextResponse.json({
        success: true,
        data: pegawai,
      })
    } catch (dbError) {
      console.warn('Pegawai DELETE [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Pegawai DELETE [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
