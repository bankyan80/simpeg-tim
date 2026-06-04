import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const sekolahAsalId = request.nextUrl.searchParams.get('sekolahAsalId')
    const sekolahTujuanId = request.nextUrl.searchParams.get('sekolahTujuanId')
    const pegawaiId = request.nextUrl.searchParams.get('pegawaiId')
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const tipe = request.nextUrl.searchParams.get('tipe')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (status) {
      // Support comma-separated status values
      if (status.includes(',')) {
        where.status = { in: status.split(',') }
      } else {
        where.status = status
      }
    }

    if (sekolahAsalId) {
      where.sekolahAsalId = sekolahAsalId
    }

    if (sekolahTujuanId) {
      where.sekolahTujuanId = sekolahTujuanId
    }

    if (sekolahId) {
      // Filter by school (either asal or tujuan)
      if (tipe === 'masuk') {
        where.sekolahTujuanId = sekolahId
      } else if (tipe === 'keluar') {
        where.sekolahAsalId = sekolahId
      } else {
        where.OR = [
          { sekolahAsalId: sekolahId },
          { sekolahTujuanId: sekolahId },
        ]
      }
    }

    if (pegawaiId) {
      where.pegawaiId = pegawaiId
    }

    const skip = (page - 1) * limit

    try {
      const { db } = await import('@/lib/db')

      // Sequential queries to avoid SQLite concurrency issues
      const mutasi = await db.mutasiPegawai.findMany({
        where,
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
          sekolahAsal: {
            select: {
              id: true,
              namaSekolah: true,
              npsn: true,
              jenjang: true,
            },
          },
          sekolahTujuan: {
            select: {
              id: true,
              namaSekolah: true,
              npsn: true,
              jenjang: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })

      const total = await db.mutasiPegawai.count({ where })

      return NextResponse.json({
        success: true,
        data: mutasi,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (dbError) {
      console.warn('Mutasi GET: DB query failed, using fallback:', dbError)
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
    console.error('Mutasi GET error:', error)
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
      sekolahAsalId,
      sekolahTujuanId,
      tanggalMutasi,
      nomorSk,
      keterangan,
    } = body

    if (!pegawaiId || !sekolahTujuanId) {
      return NextResponse.json(
        { success: false, error: 'Pegawai dan sekolah tujuan wajib diisi' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      const pegawai = await db.pegawai.findUnique({ where: { id: pegawaiId } })
      if (!pegawai) {
        return NextResponse.json(
          { success: false, error: 'Pegawai tidak ditemukan' },
          { status: 404 }
        )
      }

      const asalId = sekolahAsalId || pegawai.sekolahId

      if (asalId === sekolahTujuanId) {
        return NextResponse.json(
          { success: false, error: 'Sekolah asal dan tujuan tidak boleh sama' },
          { status: 400 }
        )
      }

      const mutasi = await db.mutasiPegawai.create({
        data: {
          pegawaiId,
          sekolahAsalId: asalId,
          sekolahTujuanId,
          tanggalMutasi: tanggalMutasi ? new Date(tanggalMutasi) : null,
          nomorSk: nomorSk || null,
          keterangan: keterangan || null,
          status: 'pending',
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
          sekolahAsal: {
            select: {
              id: true,
              namaSekolah: true,
              npsn: true,
            },
          },
          sekolahTujuan: {
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
        data: mutasi,
      }, { status: 201 })
    } catch (dbError) {
      console.warn('Mutasi POST: DB error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Mutasi POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
