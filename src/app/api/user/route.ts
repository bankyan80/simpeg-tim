import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get('role')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')

    const where: Record<string, unknown> = {}

    if (role) {
      where.role = role
    }

    if (sekolahId) {
      where.sekolahId = sekolahId
    }

    try {
      const { db } = await import('@/lib/db')

      const users = await db.user.findMany({
        where,
        include: {
          sekolah: {
            select: {
              id: true,
              namaSekolah: true,
              npsn: true,
            },
          },
        },
        orderBy: { nama: 'asc' },
      })

      return NextResponse.json({
        success: true,
        data: users,
      })
    } catch (dbError) {
      console.warn('User GET: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: [],
      })
    }
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, email, role, sekolahId, status } = body

    if (!nama || !email) {
      return NextResponse.json(
        { success: false, error: 'Nama dan email wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      // Check email uniqueness
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Email sudah terdaftar' },
          { status: 409 }
        )
      }

      const user = await db.user.create({
        data: {
          nama,
          email,
          role: role || 'operator',
          sekolahId: sekolahId || null,
          status: status || 'aktif',
        },
        include: {
          sekolah: {
            select: {
              id: true,
              namaSekolah: true,
              npsn: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: user,
      }, { status: 201 })
    } catch (dbError) {
      console.warn('User POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('User POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
