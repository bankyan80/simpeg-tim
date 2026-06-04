import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, nomorSk, keterangan, userId } = body

    if (!status || !['disetujui', 'ditolak'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status harus disetujui atau ditolak' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      const existing = await db.mutasiPegawai.findUnique({
        where: { id },
        include: { pegawai: true },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Data mutasi tidak ditemukan' },
          { status: 404 }
        )
      }

      if (existing.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Data mutasi sudah diproses' },
          { status: 403 }
        )
      }

      const mutasi = await db.mutasiPegawai.update({
        where: { id },
        data: {
          status,
          nomorSk: nomorSk || existing.nomorSk,
          keterangan: keterangan || existing.keterangan,
        },
      })

      // If approved, update pegawai's sekolahId
      if (status === 'disetujui') {
        await db.pegawai.update({
          where: { id: existing.pegawaiId },
          data: {
            sekolahId: existing.sekolahTujuanId,
            statusPegawai: 'mutasi',
          },
        })

        // Also create a riwayat mutasi
        await db.riwayatMutasi.create({
          data: {
            pegawaiId: existing.pegawaiId,
            sekolahAsal: existing.sekolahAsalId,
            sekolahTujuan: existing.sekolahTujuanId,
            tanggalMutasi: existing.tanggalMutasi || new Date(),
            nomorSk: nomorSk || existing.nomorSk,
            keterangan: keterangan || existing.keterangan,
          },
        })
      }

      // Create log aktivitas
      if (userId) {
        await db.logAktivitas.create({
          data: {
            userId,
            aksi: 'edit',
            modul: 'mutasi',
            keterangan: `${status === 'disetujui' ? 'Menyetujui' : 'Menolak'} mutasi ${existing.pegawai.nama} dari ${existing.sekolahAsalId} ke ${existing.sekolahTujuanId}`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: mutasi,
      })
    } catch (dbError) {
      console.warn('Mutasi PUT [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Mutasi PUT [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
