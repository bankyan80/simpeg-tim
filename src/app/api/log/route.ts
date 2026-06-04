import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const aksi = request.nextUrl.searchParams.get('aksi')
    const modul = request.nextUrl.searchParams.get('modul')
    const dari = request.nextUrl.searchParams.get('dari')
    const sampai = request.nextUrl.searchParams.get('sampai')
    const search = request.nextUrl.searchParams.get('search')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (userId) {
      where.userId = userId
    }

    if (aksi) {
      where.aksi = aksi
    }

    if (modul) {
      where.modul = modul
    }

    if (dari || sampai) {
      const dateFilter: Record<string, Date> = {}
      if (dari) dateFilter.gte = new Date(dari)
      if (sampai) {
        const sampaiDate = new Date(sampai)
        sampaiDate.setHours(23, 59, 59, 999)
        dateFilter.lte = sampaiDate
      }
      where.createdAt = dateFilter
    }

    if (search) {
      where.OR = [
        { keterangan: { contains: search } },
        { user: { nama: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }

    const skip = (page - 1) * limit

    try {
      const { db } = await import('@/lib/db')

      // Sequential queries to avoid SQLite concurrency issues
      const logs = await db.logAktivitas.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })

      const total = await db.logAktivitas.count({ where })

      return NextResponse.json({
        success: true,
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (dbError) {
      console.warn('Log GET: DB query failed, using fallback:', dbError)
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      })
    }
  } catch (error) {
    console.error('Log GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
