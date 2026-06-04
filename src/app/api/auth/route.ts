import { NextRequest, NextResponse } from 'next/server'

// Hardcoded school data matching the seed data
const SEKOLAH_DATA = [
  { npsn: '2010001', namaSekolah: 'SDN Lemahabang 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Lemahabang' },
  { npsn: '2010002', namaSekolah: 'SDN Lemahabang 02', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Lemahabang' },
  { npsn: '2010003', namaSekolah: 'SDN Cipanas 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Cipanas' },
  { npsn: '2010004', namaSekolah: 'SDN Cipanas 02', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Cipanas' },
  { npsn: '2010005', namaSekolah: 'SDN Palalangan 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Palalangan' },
  { npsn: '2020001', namaSekolah: 'TKN Lemahabang 01', jenjang: 'TK', kecamatan: 'Lemahabang', desa: 'Lemahabang' },
  { npsn: '2020002', namaSekolah: 'TKN Cipanas 01', jenjang: 'TK', kecamatan: 'Lemahabang', desa: 'Cipanas' },
  { npsn: '2030001', namaSekolah: 'KBN Melati Lemahabang', jenjang: 'KB/PAUD', kecamatan: 'Lemahabang', desa: 'Lemahabang' },
  { npsn: '2030002', namaSekolah: 'PAUDN Cempaka Cipanas', jenjang: 'KB/PAUD', kecamatan: 'Lemahabang', desa: 'Cipanas' },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Check admin credentials
    if (username === 'admin-kepeg' && password === 'kepeg017') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'admin-001',
          nama: 'Admin Kecamatan',
          email: 'admin@simpeg.id',
          role: 'admin_kecamatan',
          sekolahId: null,
          status: 'aktif',
          foto: null,
          sekolah: null,
        },
      })
    }

    // Check operator credentials (username = NPSN, password = 123456)
    if (password === '123456') {
      const sekolah = SEKOLAH_DATA.find(s => s.npsn === username)
      if (!sekolah) {
        return NextResponse.json(
          { success: false, error: 'Sekolah dengan NPSN tersebut tidak ditemukan' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: {
          id: `op-${sekolah.npsn}`,
          nama: `Operator ${sekolah.namaSekolah}`,
          email: `operator@${sekolah.npsn}.simpeg.id`,
          role: 'operator',
          sekolahId: `sekolah-${sekolah.npsn}`,
          status: 'aktif',
          foto: null,
          sekolah: {
            id: `sekolah-${sekolah.npsn}`,
            npsn: sekolah.npsn,
            namaSekolah: sekolah.namaSekolah,
            jenjang: sekolah.jenjang,
            kecamatan: sekolah.kecamatan,
            desa: sekolah.desa,
            alamat: null,
            kepalaSekolah: null,
            status: 'aktif',
          },
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Username atau password salah' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username query parameter wajib diisi' },
        { status: 400 }
      )
    }

    if (username === 'admin-kepeg') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'admin-001',
          nama: 'Admin Kecamatan',
          email: 'admin@simpeg.id',
          role: 'admin_kecamatan',
          sekolahId: null,
          status: 'aktif',
          sekolah: null,
        },
      })
    }

    const sekolah = SEKOLAH_DATA.find(s => s.npsn === username)
    if (sekolah) {
      return NextResponse.json({
        success: true,
        data: {
          id: `op-${sekolah.npsn}`,
          nama: `Operator ${sekolah.namaSekolah}`,
          email: `operator@${sekolah.npsn}.simpeg.id`,
          role: 'operator',
          sekolahId: `sekolah-${sekolah.npsn}`,
          status: 'aktif',
          sekolah: {
            id: `sekolah-${sekolah.npsn}`,
            npsn: sekolah.npsn,
            namaSekolah: sekolah.namaSekolah,
            jenjang: sekolah.jenjang,
            kecamatan: sekolah.kecamatan,
            desa: sekolah.desa,
            alamat: null,
            kepalaSekolah: null,
            status: 'aktif',
          },
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'User tidak ditemukan' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
