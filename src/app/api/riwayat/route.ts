import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-sqlite'

export async function GET(request: NextRequest) {
  try {
    const pegawaiId = request.nextUrl.searchParams.get('pegawaiId')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const jenis = request.nextUrl.searchParams.get('jenis') || 'jabatan'

    try {
      const conditions: string[] = []
      const params: unknown[] = []

      if (pegawaiId) {
        conditions.push('r.pegawaiId = ?')
        params.push(pegawaiId)
      }
      if (sekolahId) {
        conditions.push('p.sekolahId = ?')
        params.push(sekolahId)
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

      let data: unknown[] = []

      if (jenis === 'jabatan') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik, p.jenisPegawai as p_jenisPegawai
           FROM RiwayatJabatan r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tmtJabatan DESC`,
          params
        )
      } else if (jenis === 'mutasi') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatMutasi r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tanggalMutasi DESC`,
          params
        )
      } else if (jenis === 'pelatihan') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatPelatihan r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tahunPelatihan DESC`,
          params
        )
      } else if (jenis === 'pendidikan') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatPendidikan r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tahunLulus DESC`,
          params
        )
      } else if (jenis === 'pangkat') {
        data = query(
          `SELECT r.*, p.nama as p_nama, p.nip as p_nip, p.nik as p_nik
           FROM RiwayatPangkat r
           LEFT JOIN Pegawai p ON r.pegawaiId = p.id
           ${whereClause}
           ORDER BY r.tmtPangkat DESC`,
          params
        )
      } else {
        data = []
      }

      const result = data.map((r: Record<string, unknown>) => {
        const { p_nama, p_nip, p_nik } = r
        return {
          ...r,
          pegawai: p_nama ? { nama: p_nama, nip: p_nip, nik: p_nik } : null,
        }
      })

      return NextResponse.json({ success: true, data: result })
    } catch (dbError) {
      console.warn('Riwayat GET: DB query failed:', dbError)
      return NextResponse.json({ success: true, data: [] })
    }
  } catch (error) {
    console.error('Riwayat GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
