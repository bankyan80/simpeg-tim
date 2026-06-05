import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db-sqlite'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const pegawaiId = request.nextUrl.searchParams.get('pegawaiId')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const jenisDokumen = request.nextUrl.searchParams.get('jenisDokumen')

    try {
      const conditions: string[] = []
      const params: unknown[] = []

      if (pegawaiId) {
        conditions.push('d.pegawaiId = ?')
        params.push(pegawaiId)
      }
      if (sekolahId) {
        conditions.push('p.sekolahId = ?')
        params.push(sekolahId)
      }
      if (jenisDokumen) {
        conditions.push('d.jenisDokumen = ?')
        params.push(jenisDokumen)
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

      const data = query(
        `SELECT d.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik,
                s.namaSekolah as s_namaSekolah
         FROM DokumenPegawai d
         LEFT JOIN Pegawai p ON d.pegawaiId = p.id
         LEFT JOIN Sekolah s ON p.sekolahId = s.id
         ${whereClause}
         ORDER BY d.uploadedAt DESC`,
        params
      )

      const result = data.map((d: Record<string, unknown>) => {
        const { p_nama, p_nip, p_nik, s_namaSekolah, ...rest } = d
        return {
          ...rest,
          pegawai: p_nama ? { nama: p_nama, nip: p_nip, nik: p_nik } : null,
          sekolah: s_namaSekolah ? { namaSekolah: s_namaSekolah } : null,
        }
      })

      return NextResponse.json({ success: true, data: result })
    } catch (dbError) {
      console.warn('Dokumen GET: DB query failed:', dbError)
      return NextResponse.json({ success: true, data: [] })
    }
  } catch (error) {
    console.error('Dokumen GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pegawaiId, jenisDokumen, namaFile, urlFile, ukuranFile, userId } = body

    if (!pegawaiId || !jenisDokumen) {
      return NextResponse.json(
        { success: false, error: 'pegawaiId dan jenisDokumen wajib diisi' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    execute(
      `INSERT INTO DokumenPegawai (id, pegawaiId, jenisDokumen, namaFile, urlFile, ukuranFile, uploadedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, pegawaiId, jenisDokumen, namaFile || null, urlFile || null, ukuranFile || null, now]
    )

    if (userId) {
      execute(
        `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt) VALUES (?, ?, 'tambah', 'pegawai', ?, ?)`,
        [crypto.randomUUID(), userId, `Menambahkan dokumen ${jenisDokumen}`, now]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil ditambahkan',
      data: { id },
    })
  } catch (error) {
    console.error('Dokumen POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
