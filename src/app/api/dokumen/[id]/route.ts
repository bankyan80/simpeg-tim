import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db-sqlite'
import crypto from 'crypto'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.nextUrl.searchParams.get('userId')
    const now = new Date().toISOString()

    execute('DELETE FROM DokumenPegawai WHERE id = ?', [id])

    if (userId) {
      execute(
        `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt) VALUES (?, ?, 'hapus', 'pegawai', ?, ?)`,
        [crypto.randomUUID(), userId, 'Menghapus dokumen pegawai', now]
      )
    }

    return NextResponse.json({ success: true, message: 'Dokumen berhasil dihapus' })
  } catch (error) {
    console.error('Dokumen DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
