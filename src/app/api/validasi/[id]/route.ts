import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { statusValidasi, catatanAdmin, userId } = body

    if (!statusValidasi || !['divalidasi', 'ditolak'].includes(statusValidasi)) {
      return NextResponse.json(
        { success: false, error: 'Status validasi harus divalidasi atau ditolak' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      const existing = await db.validasiData.findUnique({
        where: { id },
        include: { pegawai: true },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Data validasi tidak ditemukan' },
          { status: 404 }
        )
      }

      if (existing.statusValidasi !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Data validasi sudah diproses' },
          { status: 403 }
        )
      }

      const validasi = await db.validasiData.update({
        where: { id },
        data: {
          statusValidasi,
          catatanAdmin: catatanAdmin || null,
          tanggalValidasi: new Date(),
        },
      })

      // If approved, update the related pegawai data
      if (statusValidasi === 'divalidasi' && existing.pegawaiId && existing.dataPerubahan) {
        try {
          const dataPerubahan = JSON.parse(existing.dataPerubahan)

          if (existing.jenisPengajuan === 'data_baru') {
            // Data baru already created, just approve the validation
          } else if (existing.jenisPengajuan === 'perubahan_data') {
            // Update pegawai with the changed data
            const updateData: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(dataPerubahan)) {
              if (['tanggalLahir', 'tmtTugas', 'tmtSekolah', 'tmtJabatan', 'tmtPangkat'].includes(key) && value) {
                updateData[key] = new Date(value as string)
              } else {
                updateData[key] = value
              }
            }
            if (Object.keys(updateData).length > 0) {
              await db.pegawai.update({
                where: { id: existing.pegawaiId },
                data: updateData,
              })
            }
          } else if (existing.jenisPengajuan === 'pensiun') {
            await db.pegawai.update({
              where: { id: existing.pegawaiId },
              data: {
                statusPegawai: 'pensiun',
                statusBup: 'sudah_pensiun',
              },
            })
          } else if (existing.jenisPengajuan === 'tidak_aktif') {
            await db.pegawai.update({
              where: { id: existing.pegawaiId },
              data: {
                statusPegawai: 'tidak_aktif',
              },
            })
          }
        } catch (parseError) {
          console.error('Error parsing dataPerubahan:', parseError)
        }
      }

      // Create log aktivitas
      if (userId) {
        await db.logAktivitas.create({
          data: {
            userId,
            aksi: 'validasi',
            modul: 'validasi',
            keterangan: `${statusValidasi === 'divalidasi' ? 'Mengvalidasi' : 'Menolak'} pengajuan ${existing.jenisPengajuan} ${existing.pegawai ? `untuk ${existing.pegawai.nama}` : ''}`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: validasi,
      })
    } catch (dbError) {
      console.warn('Validasi PUT [id]: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Validasi PUT [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
