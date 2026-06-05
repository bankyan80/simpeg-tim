import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db-turso'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    try {
      const sekolah = await queryOne<Record<string, unknown>>(
        `SELECT s.*, COUNT(p.id) as pegawaiCount, COUNT(u.id) as usersCount
         FROM Sekolah s
         LEFT JOIN Pegawai p ON p.sekolahId = s.id
         LEFT JOIN User u ON u.sekolahId = s.id
         WHERE s.id = ?
         GROUP BY s.id`,
        [id]
      )

      if (!sekolah) {
        return NextResponse.json(
          { success: false, error: 'Sekolah tidak ditemukan' },
          { status: 404 }
        )
      }

      // Transform to match Prisma format
      const { pegawaiCount, usersCount, ...rest } = sekolah
      return NextResponse.json({
        success: true,
        data: {
          ...rest,
          _count: { pegawai: pegawaiCount as number, users: usersCount as number },
        },
      })
    } catch (dbError) {
      console.warn('Sekolah GET [id]: DB error, using fallback:', dbError)
      return NextResponse.json(
        { success: false, error: 'Sekolah tidak ditemukan' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Sekolah GET [id] error:', error)
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
    const { npsn, namaSekolah, jenjang, kecamatan, desa, alamat, kepalaSekolah } = body

    try {
      const existing = await queryOne('SELECT * FROM Sekolah WHERE id = ?', [id])
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Sekolah tidak ditemukan' },
          { status: 404 }
        )
      }

      // Build update query dynamically
      const updates: string[] = []
      const updateParams: unknown[] = []

      if (npsn !== undefined) { updates.push('npsn = ?'); updateParams.push(npsn) }
      if (namaSekolah !== undefined) { updates.push('namaSekolah = ?'); updateParams.push(namaSekolah) }
      if (jenjang !== undefined) { updates.push('jenjang = ?'); updateParams.push(jenjang) }
      if (kecamatan !== undefined) { updates.push('kecamatan = ?'); updateParams.push(kecamatan) }
      if (desa !== undefined) { updates.push('desa = ?'); updateParams.push(desa) }
      if (alamat !== undefined) { updates.push('alamat = ?'); updateParams.push(alamat) }
      if (kepalaSekolah !== undefined) { updates.push('kepalaSekolah = ?'); updateParams.push(kepalaSekolah) }

      if (updates.length > 0) {
        updates.push("updatedAt = datetime('now')")
        updateParams.push(id)

        await execute(
          `UPDATE Sekolah SET ${updates.join(', ')} WHERE id = ?`,
          updateParams
        )
      }

      const updated = await queryOne('SELECT * FROM Sekolah WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        data: updated,
      })
    } catch (dbError) {
      console.error('Sekolah PUT [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Sekolah PUT [id] error:', error)
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
      const existing = await queryOne<{ id: string }>('SELECT id FROM Sekolah WHERE id = ?', [id])
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Sekolah tidak ditemukan' },
          { status: 404 }
        )
      }

      const pegawaiCount = await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM Pegawai WHERE sekolahId = ?', [id])
      if (pegawaiCount && pegawaiCount.cnt > 0) {
        return NextResponse.json(
          { success: false, error: 'Tidak dapat menghapus sekolah yang masih memiliki pegawai' },
          { status: 400 }
        )
      }

      await execute('DELETE FROM Sekolah WHERE id = ?', [id])

      return NextResponse.json({
        success: true,
        data: { id },
      })
    } catch (dbError) {
      console.error('Sekolah DELETE [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus dari database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Sekolah DELETE [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
