import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db-sqlite'
import { verifyPassword, DEFAULT_PASSWORD, ADMIN_PASSWORD } from '@/lib/password'

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

    // Check admin credentials from DB
    if (username === 'admin-kepeg') {
      const admin = queryOne<{ id: string; nama: string; email: string; password: string; status: string }>(
        "SELECT id, nama, email, password, status FROM User WHERE role = 'admin_kecamatan' LIMIT 1"
      )
      if (!admin || !verifyPassword(password, admin.password)) {
        return NextResponse.json(
          { success: false, error: 'Username atau password salah' },
          { status: 401 }
        )
      }
      const mustChange = password === ADMIN_PASSWORD
      return NextResponse.json({
        success: true,
        data: {
          id: admin.id,
          nama: admin.nama,
          email: admin.email,
          role: 'admin_kecamatan',
          sekolahId: null,
          status: admin.status,
          foto: null,
          sekolah: null,
          mustChangePassword: mustChange,
        },
      })
    }

    // Check operator credentials (username = NPSN)
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

    // Find operator user for this school
    const operator = queryOne<{ id: string; nama: string; email: string; password: string; status: string }>(
      'SELECT id, nama, email, password, status FROM User WHERE sekolahId = ? AND role = ? LIMIT 1',
      [sekolah.id, 'operator']
    )

    if (!operator || !verifyPassword(password, operator.password)) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const mustChange = password === DEFAULT_PASSWORD

    return NextResponse.json({
      success: true,
      data: {
        id: operator.id,
        nama: operator.nama,
        email: operator.email,
        role: 'operator',
        sekolahId: sekolah.id,
        status: operator.status,
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
        mustChangePassword: mustChange,
      },
    })
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
      const admin = queryOne<{ id: string; nama: string; email: string }>(
        "SELECT id, nama, email FROM User WHERE role = 'admin_kecamatan' LIMIT 1"
      )
      if (!admin) {
        return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: { id: admin.id, nama: admin.nama, email: admin.email, role: 'admin_kecamatan', sekolahId: null, status: 'aktif', sekolah: null },
      })
    }

    const sekolah = queryOne<{ id: string; npsn: string; namaSekolah: string; jenjang: string; kecamatan: string; desa: string; kepalaSekolah: string | null; status: string }>(
      'SELECT id, npsn, namaSekolah, jenjang, kecamatan, desa, kepalaSekolah, status FROM Sekolah WHERE npsn = ?', [username]
    )
    if (!sekolah) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
    }

    const operator = queryOne<{ id: string; nama: string; email: string; status: string }>(
      'SELECT id, nama, email, status FROM User WHERE sekolahId = ? AND role = ? LIMIT 1', [sekolah.id, 'operator']
    )
    if (!operator) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: operator.id,
        nama: operator.nama,
        email: operator.email,
        role: 'operator',
        sekolahId: sekolah.id,
        status: operator.status,
        sekolah: {
          id: sekolah.id,
          npsn: sekolah.npsn,
          namaSekolah: sekolah.namaSekolah,
          jenjang: sekolah.jenjang,
          kecamatan: sekolah.kecamatan,
          desa: sekolah.desa,
          kepalaSekolah: sekolah.kepalaSekolah,
          status: sekolah.status,
        },
      },
    })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
