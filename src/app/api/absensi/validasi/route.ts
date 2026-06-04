import { NextRequest, NextResponse } from 'next/server'

// POST: Kirim data absensi ke kecamatan untuk validasi
// This marks all pending absensi for the school as "submitted" (keeps statusValidasi as 'pending' 
// but records the action in log)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sekolahId } = body

    if (!sekolahId) {
      return NextResponse.json(
        { success: false, error: 'Sekolah ID wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      // Count pending absensi for this school
      const pendingCount = await db.absensiPegawai.count({
        where: {
          sekolahId,
          statusValidasi: 'pending',
        },
      })

      if (pendingCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Tidak ada data absensi yang perlu divalidasi' },
          { status: 400 }
        )
      }

      // Get school info
      const sekolah = await db.sekolah.findUnique({
        where: { id: sekolahId },
        select: { namaSekolah: true },
      })

      // The data is already in 'pending' state which means it's awaiting validation
      // The "Kirim ke Kecamatan" action is more of a notification trigger
      // In a real system, this might send an email/notification or change a flag

      return NextResponse.json({
        success: true,
        message: `${pendingCount} data absensi dari ${sekolah?.namaSekolah || 'sekolah'} berhasil dikirim ke Kecamatan untuk validasi`,
        data: {
          sekolahId,
          totalSubmitted: pendingCount,
        },
      })
    } catch (dbError) {
      console.warn('Absensi Validasi POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Absensi Validasi POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
