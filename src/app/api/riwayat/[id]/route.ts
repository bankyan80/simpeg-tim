import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db-sqlite'
import crypto from 'crypto'

const TABLE_MAP: Record<string, string> = {
  jabatan: 'RiwayatJabatan',
  mutasi: 'RiwayatMutasi',
  pelatihan: 'RiwayatPelatihan',
  pendidikan: 'RiwayatPendidikan',
  pangkat: 'RiwayatPangkat',
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jenis = request.nextUrl.searchParams.get('jenis') || 'jabatan'
    const userId = request.nextUrl.searchParams.get('userId')
    const now = new Date().toISOString()

    const table = TABLE_MAP[jenis]
    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Jenis riwayat tidak valid' },
        { status: 400 }
      )
    }

    execute(`DELETE FROM ${table} WHERE id = ?`, [id])

    if (userId) {
      execute(
        `INSERT INTO LogAktivitas (id, userId, aksi, modul, keterangan, createdAt) VALUES (?, ?, 'hapus', 'pegawai', ?, ?)`,
        [crypto.randomUUID(), userId, `Menghapus riwayat ${jenis}`, now]
      )
    }

    return NextResponse.json({ success: true, message: 'Riwayat berhasil dihapus' })
  } catch (error) {
    console.error('Riwayat DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
