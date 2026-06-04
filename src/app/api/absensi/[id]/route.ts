import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    try {
      const { db } = await import('@/lib/db')

      const absensi = await db.absensiPegawai.findUnique({
        where: { id },
        include: {
          pegawai: {
            select: {
              id: true,
              nama: true,
              nik: true,
              nip: true,
              jenisPegawai: true,
              statusKepegawaian: true,
            },
          },
          sekolah: {
            select: {
              id: true,
              namaSekolah: true,
              npsn: true,
              jenjang: true,
            },
          },
          inputByUser: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
      })

      if (!absensi) {
        return NextResponse.json(
          { success: false, error: 'Data absensi tidak ditemukan' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: absensi,
      })
    } catch (dbError) {
      console.warn('Absensi GET [id]: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: null,
      })
    }
  } catch (error) {
    console.error('Absensi GET [id] error:', error)
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

    try {
      const { db } = await import('@/lib/db')

      const existing = await db.absensiPegawai.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Data absensi tidak ditemukan' },
          { status: 404 }
        )
      }

      // Only allow update if statusValidasi is 'pending'
      if (existing.statusValidasi !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Data absensi yang sudah divalidasi tidak dapat diubah' },
          { status: 403 }
        )
      }

      const {
        jamMasuk,
        jamKeluar,
        keterangan,
        tanggal,
      } = body

      // Validate: if keterangan is Hadir/Terlambat, jamMasuk is required
      const effectiveKeterangan = keterangan !== undefined ? keterangan : existing.keterangan
      const effectiveJamMasuk = jamMasuk !== undefined ? jamMasuk : existing.jamMasuk
      if ((effectiveKeterangan === 'Hadir' || effectiveKeterangan === 'Terlambat') && !effectiveJamMasuk) {
        return NextResponse.json(
          { success: false, error: 'Jam masuk wajib diisi untuk keterangan Hadir/Terlambat' },
          { status: 400 }
        )
      }

      const absensi = await db.absensiPegawai.update({
        where: { id },
        data: {
          ...(tanggal !== undefined && { tanggal: new Date(tanggal) }),
          ...(jamMasuk !== undefined && { jamMasuk: jamMasuk || null }),
          ...(jamKeluar !== undefined && { jamKeluar: jamKeluar || null }),
          ...(keterangan !== undefined && { keterangan: keterangan || null }),
        },
        include: {
          pegawai: {
            select: {
              id: true,
              nama: true,
              nik: true,
              nip: true,
            },
          },
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
        data: absensi,
      })
    } catch (dbError) {
      console.warn('Absensi PUT [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Absensi PUT [id] error:', error)
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

      const existing = await db.absensiPegawai.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Data absensi tidak ditemukan' },
          { status: 404 }
        )
      }

      // Only allow delete if statusValidasi is 'pending'
      if (existing.statusValidasi !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Data absensi yang sudah divalidasi tidak dapat dihapus' },
          { status: 403 }
        )
      }

      await db.absensiPegawai.delete({ where: { id } })

      return NextResponse.json({
        success: true,
        data: { id },
      })
    } catch (dbError) {
      console.warn('Absensi DELETE [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Absensi DELETE [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
