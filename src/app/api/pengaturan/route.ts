import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const keyParam = request.nextUrl.searchParams.get('key')

    if (keyParam) {
      try {
        const { db } = await import('@/lib/db')

        // Return single pengaturan by key
        const pengaturan = await db.pengaturan.findUnique({
          where: { key: keyParam },
        })
        return NextResponse.json({
          success: true,
          key: keyParam,
          value: pengaturan?.value || null,
        })
      } catch (dbError) {
        console.warn('Pengaturan GET (single): DB query failed, using fallback:', dbError)
        return NextResponse.json({
          success: true,
          key: keyParam,
          value: null,
        })
      }
    }

    try {
      const { db } = await import('@/lib/db')

      const pengaturan = await db.pengaturan.findMany({
        orderBy: { key: 'asc' },
      })

      // Convert array to object for easier access
      const data: Record<string, string | null> = {}
      for (const p of pengaturan) {
        data[p.key] = p.value
      }

      return NextResponse.json({
        success: true,
        data,
      })
    } catch (dbError) {
      console.warn('Pengaturan GET: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: {},
      })
    }
  } catch (error) {
    console.error('Pengaturan GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, userId } = body

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key pengaturan wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      const pengaturan = await db.pengaturan.upsert({
        where: { key },
        update: { value: value || null },
        create: { key, value: value || null },
      })

      // Create log aktivitas
      if (userId) {
        await db.logAktivitas.create({
          data: {
            userId,
            aksi: 'edit',
            modul: 'pengaturan',
            keterangan: `Mengubah pengaturan ${key}`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: pengaturan,
      })
    } catch (dbError) {
      console.warn('Pengaturan POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Pengaturan POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, userId } = body

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key pengaturan wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      const pengaturan = await db.pengaturan.upsert({
        where: { key },
        update: { value: value || null },
        create: { key, value: value || null },
      })

      // Create log aktivitas
      if (userId) {
        await db.logAktivitas.create({
          data: {
            userId,
            aksi: 'edit',
            modul: 'pengaturan',
            keterangan: `Mengubah pengaturan ${key}`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: pengaturan,
      })
    } catch (dbError) {
      console.warn('Pengaturan PUT: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Pengaturan PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
