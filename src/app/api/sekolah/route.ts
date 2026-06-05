import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db-turso'

// Hardcoded school data as fallback
const HARDCODED_SEKOLAH = [
  { id: 'sekolah-2010001', npsn: '2010001', namaSekolah: 'SDN Lemahabang 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2010002', npsn: '2010002', namaSekolah: 'SDN Lemahabang 02', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2010003', npsn: '2010003', namaSekolah: 'SDN Cipanas 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2010004', npsn: '2010004', namaSekolah: 'SDN Cipanas 02', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2010005', npsn: '2010005', namaSekolah: 'SDN Palalangan 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Palalangan', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2020001', npsn: '2020001', namaSekolah: 'TKN Lemahabang 01', jenjang: 'TK', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2020002', npsn: '2020002', namaSekolah: 'TKN Cipanas 01', jenjang: 'TK', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2030001', npsn: '2030001', namaSekolah: 'KBN Melati Lemahabang', jenjang: 'KB/PAUD', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
  { id: 'sekolah-2030002', npsn: '2030002', namaSekolah: 'PAUDN Cempaka Cipanas', jenjang: 'KB/PAUD', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { pegawai: 0 } },
]

export async function GET(request: NextRequest) {
  try {
    const jenjang = request.nextUrl.searchParams.get('jenjang')
    const search = request.nextUrl.searchParams.get('search')

    try {
      let whereClause = "WHERE s.status = 'aktif'"
      const params: unknown[] = []

      if (jenjang) {
        whereClause += " AND s.jenjang = ?"
        params.push(jenjang)
      }

      if (search) {
        whereClause += ` AND (s.namaSekolah LIKE ? OR s.npsn LIKE ? OR s.desa LIKE ? OR s.alamat LIKE ?)`
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
      }

      const sekolah = await query<{
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
        pegawaiCount: number
      }>(`SELECT s.*, COUNT(p.id) as pegawaiCount FROM Sekolah s LEFT JOIN Pegawai p ON p.sekolahId = s.id ${whereClause} GROUP BY s.id ORDER BY s.namaSekolah ASC`, params)

      const total = sekolah.length

      // Transform to match Prisma format
      const data = sekolah.map(s => ({
        ...s,
        _count: { pegawai: s.pegawaiCount },
        pegawaiCount: undefined,
      }))

      return NextResponse.json({
        success: true,
        data,
        total,
      })
    } catch (dbError) {
      console.warn('Sekolah API: DB query failed, using fallback data:', dbError)
    }

    // Fallback to hardcoded data
    let filtered = [...HARDCODED_SEKOLAH]

    if (jenjang) {
      filtered = filtered.filter(s => s.jenjang === jenjang)
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.namaSekolah.toLowerCase().includes(q) ||
        s.npsn.includes(q) ||
        (s.desa || '').toLowerCase().includes(q) ||
        (s.alamat || '').toLowerCase().includes(q)
      )
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    })
  } catch (error) {
    console.error('Sekolah GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { npsn, namaSekolah, jenjang, kecamatan, desa, alamat, kepalaSekolah } = body

    if (!npsn || !namaSekolah || !jenjang) {
      return NextResponse.json(
        { success: false, error: 'NPSN, nama sekolah, dan jenjang wajib diisi' },
        { status: 400 }
      )
    }

    try {
      // Check if NPSN already exists
      const existing = await queryOne('SELECT id FROM Sekolah WHERE npsn = ?', [npsn])
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'NPSN sudah terdaftar' },
          { status: 409 }
        )
      }

      const result = await execute(
        `INSERT INTO Sekolah (id, npsn, namaSekolah, jenjang, kecamatan, desa, alamat, kepalaSekolah, status, createdAt, updatedAt)
         VALUES (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))), ?, ?, ?, ?, ?, ?, ?, 'aktif', datetime('now'), datetime('now'))`,
        [npsn, namaSekolah, jenjang, kecamatan || 'Lemahabang', desa || null, alamat || null, kepalaSekolah || null]
      )

      const newSekolah = await queryOne('SELECT * FROM Sekolah WHERE npsn = ?', [npsn])

      return NextResponse.json({
        success: true,
        data: newSekolah,
      }, { status: 201 })
    } catch (dbError) {
      console.error('Sekolah POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Sekolah POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
