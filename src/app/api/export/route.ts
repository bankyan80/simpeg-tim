import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') // pegawai | absensi | rekap
    const format = request.nextUrl.searchParams.get('format') // csv | json
    const sekolahId = request.nextUrl.searchParams.get('sekolahId')
    const statusKepegawaian = request.nextUrl.searchParams.get('statusKepegawaian')
    const jenisPegawai = request.nextUrl.searchParams.get('jenisPegawai')
    const bulan = request.nextUrl.searchParams.get('bulan')
    const tahun = request.nextUrl.searchParams.get('tahun')

    if (!type || !['pegawai', 'absensi', 'rekap'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type harus pegawai, absensi, atau rekap' },
        { status: 400 }
      )
    }

    if (!format || !['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Format harus csv atau json' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')

      let data: Record<string, unknown>[] = []
      let filename = ''

      if (type === 'pegawai') {
        const where: Record<string, unknown> = { statusPegawai: 'aktif' }
        if (sekolahId) where.sekolahId = sekolahId
        if (statusKepegawaian) where.statusKepegawaian = statusKepegawaian
        if (jenisPegawai) where.jenisPegawai = jenisPegawai

        const pegawai = await db.pegawai.findMany({
          where,
          include: {
            sekolah: {
              select: {
                namaSekolah: true,
                npsn: true,
                jenjang: true,
              },
            },
          },
          orderBy: { nama: 'asc' },
        })

        data = pegawai.map((p) => ({
          nama: p.nama,
          nik: p.nik,
          nip: p.nip || '',
          nuptk: p.nuptk || '',
          jenisKelamin: p.jenisKelamin || '',
          tempatLahir: p.tempatLahir || '',
          tanggalLahir: p.tanggalLahir ? new Date(p.tanggalLahir).toISOString().split('T')[0] : '',
          jenisPegawai: p.jenisPegawai || '',
          statusKepegawaian: p.statusKepegawaian || '',
          jabatan: p.jabatan || '',
          pangkat: p.pangkat || '',
          golongan: p.golongan || '',
          pendidikanTerakhir: p.pendidikanTerakhir || '',
          sertifikasi: p.sertifikasi || '',
          tahunPensiun: p.tahunPensiun || '',
          statusBup: p.statusBup || '',
          sekolah: p.sekolah.namaSekolah,
          npsn: p.sekolah.npsn,
          jenjang: p.sekolah.jenjang,
        }))

        filename = `data-pegawai-${new Date().toISOString().split('T')[0]}`
      } else if (type === 'absensi') {
        const where: Record<string, unknown> = {}
        if (sekolahId) where.sekolahId = sekolahId

        if (bulan && tahun) {
          const startOfMonth = new Date(parseInt(tahun), parseInt(bulan) - 1, 1)
          const endOfMonth = new Date(parseInt(tahun), parseInt(bulan), 1)
          where.tanggal = {
            gte: startOfMonth.toISOString(),
            lt: endOfMonth.toISOString(),
          }
        } else if (tahun) {
          const startOfYear = new Date(parseInt(tahun), 0, 1)
          const endOfYear = new Date(parseInt(tahun) + 1, 0, 1)
          where.tanggal = {
            gte: startOfYear.toISOString(),
            lt: endOfYear.toISOString(),
          }
        }

        const absensi = await db.absensiPegawai.findMany({
          where,
          include: {
            pegawai: {
              select: {
                nik: true,
                jenisPegawai: true,
              },
            },
            sekolah: {
              select: {
                namaSekolah: true,
                npsn: true,
              },
            },
          },
          orderBy: [{ tanggal: 'desc' }, { namaPegawai: 'asc' }],
        })

        data = absensi.map((a) => ({
          tanggal: new Date(a.tanggal).toISOString().split('T')[0],
          namaPegawai: a.namaPegawai,
          nip: a.nip || '',
          nik: a.pegawai?.nik || '',
          unitKerja: a.unitKerja,
          statusPegawai: a.statusPegawai || '',
          jenisPegawai: a.pegawai?.jenisPegawai || '',
          jamMasuk: a.jamMasuk || '',
          jamKeluar: a.jamKeluar || '',
          keterangan: a.keterangan || '',
          statusValidasi: a.statusValidasi,
          sekolah: a.sekolah.namaSekolah,
          npsn: a.sekolah.npsn,
        }))

        filename = `data-absensi-${bulan ? `${bulan}-` : ''}${tahun || new Date().getFullYear()}-${new Date().toISOString().split('T')[0]}`
      } else if (type === 'rekap') {
        // Rekap per sekolah
        const sekolahWhere: Record<string, unknown> = { status: 'aktif' }
        if (sekolahId) sekolahWhere.id = sekolahId

        const sekolahList = await db.sekolah.findMany({
          where: sekolahWhere,
          orderBy: { namaSekolah: 'asc' },
        })

        // Sequential processing to avoid SQLite concurrency issues
        // Fetch all pegawai once and compute per-school stats in-memory
        const allPegawai = await db.pegawai.findMany({
          where: { statusPegawai: 'aktif', ...(sekolahId && { sekolahId }) },
          select: {
            sekolahId: true,
            jenisPegawai: true,
            statusKepegawaian: true,
            statusBup: true,
          },
        })

        data = sekolahList.map((s) => {
          const sp = allPegawai.filter(p => p.sekolahId === s.id)
          return {
            npsn: s.npsn,
            namaSekolah: s.namaSekolah,
            jenjang: s.jenjang,
            desa: s.desa || '',
            totalPegawai: sp.length,
            guru: sp.filter(p => p.jenisPegawai === 'Guru').length,
            tendik: sp.filter(p => p.jenisPegawai === 'Tendik').length,
            pns: sp.filter(p => p.statusKepegawaian === 'PNS').length,
            pppk: sp.filter(p => ['PPPK', 'PPPK_Paruh_Waktu'].includes(p.statusKepegawaian || '')).length,
            honorer: sp.filter(p => p.statusKepegawaian === 'Honorer').length,
            akanPensiun: sp.filter(p => p.statusBup === 'akan_pensiun').length,
          }
        })

        filename = `rekap-sekolah-${new Date().toISOString().split('T')[0]}`
      }

      if (format === 'json') {
        return NextResponse.json({
          success: true,
          data,
        })
      }

      // CSV format
      if (data.length === 0) {
        return NextResponse.json({
          success: true,
          data: '',
          filename: `${filename}.csv`,
        })
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = String(row[h] ?? '')
              // Escape CSV: wrap in quotes if contains comma, quote, or newline
              if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`
              }
              return val
            })
            .join(',')
        ),
      ]

      const csvString = csvRows.join('\n')

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    } catch (dbError) {
      console.warn('Export GET: DB query failed, using fallback:', dbError)
      // Return empty data for export
      if (format === 'json') {
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
      return NextResponse.json({
        success: true,
        data: '',
        filename: `export-${type}-${new Date().toISOString().split('T')[0]}.csv`,
      })
    }
  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
