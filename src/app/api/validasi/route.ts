import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute, count } from '@/lib/db-turso'

interface ValidasiRow {
  id: string
  pegawaiId: string | null
  sekolahId: string | null
  jenisPengajuan: string | null
  statusValidasi: string
  catatanAdmin: string | null
  dataPerubahan: string | null
  tanggalPengajuan: string
  tanggalValidasi: string | null
  createdAt: string
  updatedAt: string
  p_id: string | null
  p_nama: string | null
  p_nik: string | null
  p_nip: string | null
  p_jenisPegawai: string | null
  p_statusKepegawaian: string | null
  p_statusPegawai: string | null
  ps_id: string | null
  ps_namaSekolah: string | null
  ps_npsn: string | null
  s_id: string | null
  s_namaSekolah: string | null
  s_npsn: string | null
  s_jenjang: string | null
}

function transformValidasiRow(row: ValidasiRow) {
  return {
    id: row.id,
    pegawaiId: row.pegawaiId,
    sekolahId: row.sekolahId,
    jenisPengajuan: row.jenisPengajuan,
    statusValidasi: row.statusValidasi,
    catatanAdmin: row.catatanAdmin,
    dataPerubahan: row.dataPerubahan,
    tanggalPengajuan: row.tanggalPengajuan,
    tanggalValidasi: row.tanggalValidasi,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pegawai: row.p_id ? {
      id: row.p_id,
      nama: row.p_nama,
      nik: row.p_nik,
      nip: row.p_nip,
      jenisPegawai: row.p_jenisPegawai,
      statusKepegawaian: row.p_statusKepegawaian,
      statusPegawai: row.p_statusPegawai,
      sekolah: row.ps_id ? {
        id: row.ps_id,
        namaSekolah: row.ps_namaSekolah,
        npsn: row.ps_npsn,
      } : null,
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
    const statusValidasi = request.nextUrl.searchParams.get('statusValidasi')
    const jenisPengajuan = request.nextUrl.searchParams.get('jenisPengajuan')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

    const conditions: string[] = []
    const params: unknown[] = []

    if (statusValidasi) {
      if (statusValidasi.includes(',')) {
        const statuses = statusValidasi.split(',')
        const placeholders = statuses.map(() => '?').join(',')
        conditions.push(`v.statusValidasi IN (${placeholders})`)
        params.push(...statuses)
      } else {
        conditions.push('v.statusValidasi = ?')
        params.push(statusValidasi)
      }
    }

    if (jenisPengajuan) {
      conditions.push('v.jenisPengajuan = ?')
      params.push(jenisPengajuan)
    }

    if (sekolahId) {
      conditions.push('v.sekolahId = ?')
      params.push(sekolahId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const skip = (page - 1) * limit

    try {
      const validasiRows = await query<ValidasiRow>(
        `SELECT
          v.id, v.pegawaiId, v.sekolahId, v.jenisPengajuan, v.statusValidasi,
          v.catatanAdmin, v.dataPerubahan, v.tanggalPengajuan, v.tanggalValidasi,
          v.createdAt, v.updatedAt,
          p.id as p_id, p.nama as p_nama, p.nik as p_nik, p.nip as p_nip,
          p.jenisPegawai as p_jenisPegawai, p.statusKepegawaian as p_statusKepegawaian,
          p.statusPegawai as p_statusPegawai,
          ps.id as ps_id, ps.namaSekolah as ps_namaSekolah, ps.npsn as ps_npsn,
          s.id as s_id, s.namaSekolah as s_namaSekolah, s.npsn as s_npsn, s.jenjang as s_jenjang
        FROM ValidasiData v
        LEFT JOIN Pegawai p ON v.pegawaiId = p.id
        LEFT JOIN Sekolah ps ON p.sekolahId = ps.id
        LEFT JOIN Sekolah s ON v.sekolahId = s.id
        ${whereClause}
        ORDER BY v.tanggalPengajuan DESC
        LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      )

      const total = await count('ValidasiData', conditions.length > 0 ? conditions.join(' AND ').replace(/v\./g, '') : undefined, conditions.length > 0 ? params : undefined)

      const validasi = validasiRows.map(transformValidasiRow)

      return NextResponse.json({
        success: true,
        data: validasi,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (dbError) {
      console.warn('Validasi GET: DB query failed, using fallback:', dbError)
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
    console.error('Validasi GET error:', error)
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
      pegawaiId,
      sekolahId,
      jenisPengajuan,
      dataPerubahan,
    } = body

    if (!jenisPengajuan) {
      return NextResponse.json(
        { success: false, error: 'Jenis pengajuan wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const idResult = await queryOne<{ id: string }>(
        "SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) as id"
      )
      const id = idResult!.id

      await execute(
        `INSERT INTO ValidasiData (id, pegawaiId, sekolahId, jenisPengajuan, statusValidasi, dataPerubahan, tanggalPengajuan, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'), datetime('now'))`,
        [id, pegawaiId || null, sekolahId || null, jenisPengajuan, dataPerubahan ? JSON.stringify(dataPerubahan) : null]
      )

      const row = await queryOne<ValidasiRow>(
        `SELECT
          v.id, v.pegawaiId, v.sekolahId, v.jenisPengajuan, v.statusValidasi,
          v.catatanAdmin, v.dataPerubahan, v.tanggalPengajuan, v.tanggalValidasi,
          v.createdAt, v.updatedAt,
          p.id as p_id, p.nama as p_nama, p.nik as p_nik, p.nip as p_nip,
          p.jenisPegawai as p_jenisPegawai, p.statusKepegawaian as p_statusKepegawaian,
          p.statusPegawai as p_statusPegawai,
          ps.id as ps_id, ps.namaSekolah as ps_namaSekolah, ps.npsn as ps_npsn,
          s.id as s_id, s.namaSekolah as s_namaSekolah, s.npsn as s_npsn, s.jenjang as s_jenjang
        FROM ValidasiData v
        LEFT JOIN Pegawai p ON v.pegawaiId = p.id
        LEFT JOIN Sekolah ps ON p.sekolahId = ps.id
        LEFT JOIN Sekolah s ON v.sekolahId = s.id
        WHERE v.id = ?`,
        [id]
      )

      const validasi = row ? transformValidasiRow(row) : { id, pegawaiId, sekolahId, jenisPengajuan, statusValidasi: 'pending', dataPerubahan: dataPerubahan ? JSON.stringify(dataPerubahan) : null, tanggalPengajuan: new Date().toISOString() }

      return NextResponse.json({
        success: true,
        data: validasi,
      }, { status: 201 })
    } catch (dbError) {
      console.warn('Validasi POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Validasi POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
