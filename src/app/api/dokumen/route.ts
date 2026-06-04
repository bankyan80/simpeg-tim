import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const pegawaiId = request.nextUrl.searchParams.get('pegawaiId')
    const jenisDokumen = request.nextUrl.searchParams.get('jenisDokumen')

    if (!pegawaiId) {
      return NextResponse.json(
        { success: false, error: 'pegawaiId wajib diisi' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { pegawaiId }

    if (jenisDokumen) {
      where.jenisDokumen = jenisDokumen
    }

    try {
      const { db } = await import('@/lib/db')

      const dokumen = await db.dokumenPegawai.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: dokumen,
      })
    } catch (dbError) {
      console.warn('Dokumen GET: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: [],
      })
    }
  } catch (error) {
    console.error('Dokumen GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pegawaiId,
      jenisDokumen,
      namaFile,
      urlFile,
      ukuranFile,
      userId,
    } = body

    if (!pegawaiId || !jenisDokumen || !namaFile) {
      return NextResponse.json(
        { success: false, error: 'Pegawai, jenis dokumen, dan nama file wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      // Verify pegawai exists
      const pegawai = await db.pegawai.findUnique({ where: { id: pegawaiId } })
      if (!pegawai) {
        return NextResponse.json(
          { success: false, error: 'Pegawai tidak ditemukan' },
          { status: 404 }
        )
      }

      // In production, this would upload to Supabase Storage
      // For now, just store metadata
      const dokumen = await db.dokumenPegawai.create({
        data: {
          pegawaiId,
          jenisDokumen,
          namaFile,
          urlFile: urlFile || null,
          ukuranFile: ukuranFile || null,
        },
      })

      // Create log aktivitas
      if (userId) {
        await db.logAktivitas.create({
          data: {
            userId,
            aksi: 'tambah',
            modul: 'pegawai',
            keterangan: `Mengupload dokumen ${jenisDokumen} untuk ${pegawai.nama}`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: dokumen,
      }, { status: 201 })
    } catch (dbError) {
      console.warn('Dokumen POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Dokumen POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
