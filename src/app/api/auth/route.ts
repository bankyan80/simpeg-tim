import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db-sqlite'

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
      const sekolah = queryOne<{
        id: string; npsn: string; namaSekolah: string; jenjang: string;
        kecamatan: string; desa: string; alamat: string | null;
        kepalaSekolah: string | null; status: string
      }>('SELECT id, npsn, namaSekolah, jenjang, kecamatan, desa, alamat, kepalaSekolah, status FROM Sekolah WHERE npsn = ?', [username])

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
          sekolahId: sekolah.id,
          status: 'aktif',
          foto: null,
          sekolah: {
            id: sekolah.id,
            npsn: sekolah.npsn,
            namaSekolah: sekolah.namaSekolah,
            jenjang: sekolah.jenjang,
            kecamatan: sekolah.kecamatan,
            desa: sekolah.desa,
            alamat: sekolah.alamat,
            kepalaSekolah: sekolah.kepalaSekolah,
            status: sekolah.status,
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

    const sekolah = queryOne<{
      id: string; npsn: string; namaSekolah: string; jenjang: string;
      kecamatan: string; desa: string; alamat: string | null;
      kepalaSekolah: string | null; status: string
    }>('SELECT id, npsn, namaSekolah, jenjang, kecamatan, desa, alamat, kepalaSekolah, status FROM Sekolah WHERE npsn = ?', [username])

    if (sekolah) {
      return NextResponse.json({
        success: true,
        data: {
          id: `op-${sekolah.npsn}`,
          nama: `Operator ${sekolah.namaSekolah}`,
          email: `operator@${sekolah.npsn}.simpeg.id`,
          role: 'operator',
          sekolahId: sekolah.id,
          status: 'aktif',
          sekolah: {
            id: sekolah.id,
            npsn: sekolah.npsn,
            namaSekolah: sekolah.namaSekolah,
            jenjang: sekolah.jenjang,
            kecamatan: sekolah.kecamatan,
            desa: sekolah.desa,
            alamat: sekolah.alamat,
            kepalaSekolah: sekolah.kepalaSekolah,
            status: sekolah.status,
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
