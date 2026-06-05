import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db-turso'
import { hashPassword, verifyPassword } from '@/lib/password'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password baru minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Verify current password
    const user = await queryOne<{ id: string; password: string }>(
      'SELECT id, password FROM User WHERE id = ?',
      [userId]
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return NextResponse.json(
        { success: false, error: 'Password saat ini salah' },
        { status: 401 }
      )
    }

    // Update password
    const hashed = hashPassword(newPassword)
    await execute('UPDATE User SET password = ? WHERE id = ?', [hashed, userId])

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
