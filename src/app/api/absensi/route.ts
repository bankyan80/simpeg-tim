import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, count } from '@/lib/db-turso'

interface AbsensiRow {
  id: string
  tanggal: string
  pegawaiId: string
  nip: string | null
  namaPegawai: string
  unitKerja: string
  statusPegawai: string | null
  jamMasuk: string | null
  jamKeluar: string | null
  keterangan: string | null
  sekolahId: string
  inputBy: string
  statusValidasi: string
  validatedBy: string | null
  createdAt: string
  updatedAt: string
  p_id: string | null
  p_nama: string | null
  p_nik: string | null
  p_nip: string | null
  p_jenisPegawai: string | null
  p_statusKepegawaian: string | null
  s_id: string | null
  s_namaSekolah: string | null
  s_npsn: string | null
  s_jenjang: string | null
}

function transformAbsensiRow(row: AbsensiRow) {
  return {
    id: row.id,
    tanggal: row.tanggal,
    pegawaiId: row.pegawaiId,
    nip: row.nip,
    namaPegawai: row.namaPegawai,
    unitKerja: row.unitKerja,
    statusPegawai: row.statusPegawai,
    jamMasuk: row.jamMasuk,
    jamKeluar: row.jamKeluar,
    keterangan: row.keterangan,
    sekolahId: row.sekolahId,
    inputBy: row.inputBy,
    statusValidasi: row.statusValidasi,
    validatedBy: row.validatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pegawai: row.p_id ? {
      id: row.p_id,
      nama: row.p_nama,
      nik: row.p_nik,
      nip: row.p_nip,
      jenisPegawai: row.p_jenisPegawai,
      statusKepegawaian: row.p_statusKepegawaian,
    } : null,
    sekolah: row.s_id ? {
      id: row.s_id,
      namaSekolah: row.s_namaSekolah,
      npsn: row.s_npsn,
      jenjang: row.s_jenjang,
    } : null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const tanggal = request.nextUrl.searchParams.get('tanggal')
    const bulan = request.nextUrl.searchParams.get('bulan')
    const tahun = request.nextUrl.searchParams.get('tahun')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const pegawaiId = request.nextUrl.searchParams.get('pegawaiId')
    const statusPegawai = request.nextUrl.searchParams.get('statusPegawai')
    const keterangan = request.nextUrl.searchParams.get('keterangan')
    const search = request.nextUrl.searchParams.get('search')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

    const conditions: string[] = []
    const params: unknown[] = []

    if (tanggal) {
      conditions.push("date(a.tanggal) = date(?)")
      params.push(tanggal)
    } else if (bulan && tahun) {
      conditions.push("strftime('%Y-%m', a.tanggal) = ?")
      params.push(`${tahun}-${String(bulan).padStart(2, '0')}`)
    } else if (tahun) {
      conditions.push("strftime('%Y', a.tanggal) = ?")
      params.push(tahun)
    }

    if (sekolahId) {
      conditions.push('a.sekolahId = ?')
      params.push(sekolahId)
    }

    if (pegawaiId) {
      conditions.push('a.pegawaiId = ?')
      params.push(pegawaiId)
    }

    if (statusPegawai) {
      conditions.push('a.statusPegawai = ?')
      params.push(statusPegawai)
    }

    if (keterangan) {
      conditions.push('a.keterangan = ?')
      params.push(keterangan)
    }

    if (search) {
      conditions.push('(a.namaPegawai LIKE ? OR a.nip LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const skip = (page - 1) * limit

    try {
      const absensiRows = await query<AbsensiRow>(
        `SELECT
          a.id, a.tanggal, a.pegawaiId, a.nip, a.namaPegawai, a.unitKerja,
          a.statusPegawai, a.jamMasuk, a.jamKeluar, a.keterangan,
          a.sekolahId, a.inputBy, a.statusValidasi, a.validatedBy,
          a.createdAt, a.updatedAt,
          p.id as p_id, p.nama as p_nama, p.nik as p_nik, p.nip as p_nip,
          p.jenisPegawai as p_jenisPegawai, p.statusKepegawaian as p_statusKepegawaian,
          s.id as s_id, s.namaSekolah as s_namaSekolah, s.npsn as s_npsn, s.jenjang as s_jenjang
        FROM AbsensiPegawai a
        LEFT JOIN Pegawai p ON a.pegawaiId = p.id
        LEFT JOIN Sekolah s ON a.sekolahId = s.id
        ${whereClause}
        ORDER BY a.tanggal DESC, a.namaPegawai ASC
        LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      )

      const total = await count('AbsensiPegawai', conditions.length > 0 ? conditions.join(' AND ').replace(/a\./g, '') : undefined, conditions.length > 0 ? params : undefined)

      const absensi = absensiRows.map(transformAbsensiRow)

      return NextResponse.json({
        success: true,
        data: absensi,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (dbError) {
      console.warn('Absensi GET: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      })
    }
  } catch (error) {
    console.error('Absensi GET error:', error)
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
      tanggal,
      pegawaiId,
      jamMasuk,
      jamKeluar,
      keterangan,
      sekolahId,
      inputBy,
      userId,
    } = body

    if (!tanggal || !pegawaiId || !sekolahId || !inputBy) {
      return NextResponse.json(
        { success: false, error: 'Tanggal, pegawai, sekolah, dan inputBy wajib diisi' },
        { status: 400 }
      )
    }

    // Validate: if keterangan is Hadir/Terlambat, jamMasuk is required
    if ((keterangan === 'Hadir' || keterangan === 'Terlambat') && !jamMasuk) {
      return NextResponse.json(
        { success: false, error: 'Jam masuk wajib diisi untuk keterangan Hadir/Terlambat' },
        { status: 400 }
      )
    }

    try {
      // Validate: one pegawai can only have one absensi per tanggal
      const existingAbsensi = await queryOne<{ id: string }>(
        "SELECT id FROM AbsensiPegawai WHERE pegawaiId = ? AND date(tanggal) = date(?)",
        [pegawaiId, tanggal]
      )

      if (existingAbsensi) {
        return NextResponse.json(
          { success: false, error: 'Pegawai sudah memiliki data absensi pada tanggal tersebut' },
          { status: 409 }
        )
      }

      // Get pegawai data to auto-fill fields
      const pegawai = await queryOne<{
        id: string
        nama: string
        nip: string | null
        statusKepegawaian: string | null
        sekolahId: string
        sekolah_namaSekolah: string
      }>(
        `SELECT p.id, p.nama, p.nip, p.statusKepegawaian, p.sekolahId,
                s.namaSekolah as sekolah_namaSekolah
         FROM Pegawai p
         LEFT JOIN Sekolah s ON p.sekolahId = s.id
         WHERE p.id = ?`,
        [pegawaiId]
      )

      if (!pegawai) {
        return NextResponse.json(
          { success: false, error: 'Pegawai tidak ditemukan' },
          { status: 404 }
        )
      }

      const idResult = await queryOne<{ id: string }>(
        "SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) as id"
      )
      const id = idResult!.id

      await execute(
        `INSERT INTO AbsensiPegawai (id, tanggal, pegawaiId, nip, namaPegawai, unitKerja, statusPegawai, jamMasuk, jamKeluar, keterangan, sekolahId, inputBy, statusValidasi, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'), datetime('now'))`,
        [
          id,
          tanggal,
          pegawaiId,
          pegawai.nip || null,
          pegawai.nama,
          pegawai.sekolah_namaSekolah,
          pegawai.statusKepegawaian,
          jamMasuk || null,
          jamKeluar || null,
          keterangan || null,
          sekolahId,
          inputBy,
        ]
      )

      const row = await queryOne<AbsensiRow>(
        `SELECT
          a.id, a.tanggal, a.pegawaiId, a.nip, a.namaPegawai, a.unitKerja,
          a.statusPegawai, a.jamMasuk, a.jamKeluar, a.keterangan,
          a.sekolahId, a.inputBy, a.statusValidasi, a.validatedBy,
          a.createdAt, a.updatedAt,
          p.id as p_id, p.nama as p_nama, p.nik as p_nik, p.nip as p_nip,
          p.jenisPegawai as p_jenisPegawai, p.statusKepegawaian as p_statusKepegawaian,
          s.id as s_id, s.namaSekolah as s_namaSekolah, s.npsn as s_npsn, s.jenjang as s_jenjang
        FROM AbsensiPegawai a
        LEFT JOIN Pegawai p ON a.pegawaiId = p.id
        LEFT JOIN Sekolah s ON a.sekolahId = s.id
        WHERE a.id = ?`,
        [id]
      )

      const absensi = row ? transformAbsensiRow(row) : {
        id, tanggal, pegawaiId, namaPegawai: pegawai.nama,
        unitKerja: pegawai.sekolah_namaSekolah, sekolahId, inputBy,
        statusValidasi: 'pending',
      }

      // Create log aktivitas
      if (userId) {
        const logIdResult = await queryOne<{ id: string }>(
          "SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) as id"
        )
        await execute(
          `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt)
           VALUES (?, ?, 'tambah', 'absensi', ?, datetime('now'))`,
          [logIdResult!.id, userId, `Menambah absensi: ${pegawai.nama} tanggal ${tanggal}`]
        )
      }

      return NextResponse.json({
        success: true,
        data: absensi,
      }, { status: 201 })
    } catch (dbError) {
      console.warn('Absensi POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Absensi POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
