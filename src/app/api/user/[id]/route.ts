import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    try {
      const { db } = await import('@/lib/db')

      const user = await db.user.findUnique({
        where: { id },
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

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User tidak ditemukan' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: user,
      })
    } catch (dbError) {
      console.warn('User GET [id]: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: null,
      })
    }
  } catch (error) {
    console.error('User GET [id] error:', error)
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
    const { nama, email, role, sekolahId, status } = body

    try {
      const { db } = await import('@/lib/db')

      const existing = await db.user.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'User tidak ditemukan' },
          { status: 404 }
        )
      }

      // If email is being changed, check uniqueness
      if (email && email !== existing.email) {
        const emailExists = await db.user.findUnique({ where: { email } })
        if (emailExists) {
          return NextResponse.json(
            { success: false, error: 'Email sudah terdaftar' },
            { status: 409 }
          )
        }
      }

      const user = await db.user.update({
        where: { id },
        data: {
          ...(nama !== undefined && { nama }),
          ...(email !== undefined && { email }),
          ...(role !== undefined && { role }),
          ...(sekolahId !== undefined && { sekolahId }),
          ...(status !== undefined && { status }),
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
      })
    } catch (dbError) {
      console.warn('User PUT [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('User PUT [id] error:', error)
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

    try {
      const { db } = await import('@/lib/db')

      const existing = await db.user.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'User tidak ditemukan' },
          { status: 404 }
        )
      }

      await db.user.delete({ where: { id } })

      return NextResponse.json({
        success: true,
        data: { id },
      })
    } catch (dbError) {
      console.warn('User DELETE [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('User DELETE [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
