'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Pegawai, Sekolah } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  School,
  Users,
  GraduationCap,
  Briefcase,
  BadgeCheck,
  FileBadge,
  Clock,
  AlertTriangle,
  LogIn,
  CalendarDays,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

// ============================================================================
// Types
// ============================================================================

interface DashboardData {
  overview: {
    totalSekolah: number
    totalPegawai: number
    totalGuru: number
    totalTendik: number
    totalPNS: number
    totalPPPK: number
    totalPPPKParuhWaktu: number
    totalHonorer: number
    bup: {
      aktif: number
      akanPensiun: number
      sudahPensiun: number
    }
    pendingValidasi: number
    pendingMutasi: number
  }
  absensi: {
    hadir: number
    terlambat: number
    izin: number
    sakit: number
    alfa: number
    dinasLuar: number
    cuti: number
    belumInput: number
  }
  rekapPerSekolah: Array<{
    id: string
    npsn: string
    namaSekolah: string
    jenjang: string
    desa: string | null
    totalPegawai: number
    guru: number
    tendik: number
    pns: number
    pppk: number
    honorer: number
    akanPensiun: number
  }>
}

interface PegawaiPublic {
  id: string
  nama: string
  jenisPegawai: string | null
  jenisKelamin: string | null
  statusKepegawaian: string | null
  statusBup: string | null
  tahunPensiun: number | null
  sekolahId: string
  sekolah: { id: string; namaSekolah: string; jenjang: string; npsn: string }
}

// ============================================================================
// Color palette
// ============================================================================

const COLORS = {
  blue: '#1e40af',
  sky: '#2563eb',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  rose: '#f43f5e',
  orange: '#f97316',
  sky: '#0ea5e9',
  lime: '#84cc16',
}

const JENJANG_COLORS: Record<string, string> = {
  SD: 'bg-blue-100 text-blue-800',
  TK: 'bg-amber-100 text-amber-800',
  'KB/PAUD': 'bg-purple-100 text-purple-800',
}

const CHART_COLORS = ['#1e40af', '#2563eb', '#f59e0b', '#8b5cf6', '#f43f5e', '#f97316']

// ============================================================================
// Component
// ============================================================================

export default function PublicView() {
  const { setCurrentPage } = useSimpegStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [pegawaiList, setPegawaiList] = useState<PegawaiPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, pegawaiRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/pegawai?limit=500'),
      ])

      if (dashRes.ok) {
        const dashJson = await dashRes.json()
        if (dashJson.success) setDashboard(dashJson.data)
      }

      if (pegawaiRes.ok) {
        const pegJson = await pegawaiRes.json()
        if (pegJson.success) {
          setPegawaiList(pegJson.data || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch public data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================================================
  // Computed data
  // ============================================================================

  // Per-school breakdown with gender detail
  const rekapWithGender = (() => {
    if (!dashboard) return []

    return dashboard.rekapPerSekolah.map((sekolah) => {
      const schoolPegawai = pegawaiList.filter((p) => p.sekolahId === sekolah.id)
      const guruL = schoolPegawai.filter(
        (p) => p.jenisPegawai === 'Guru' && p.jenisKelamin === 'L'
      ).length
      const guruP = schoolPegawai.filter(
        (p) => p.jenisPegawai === 'Guru' && p.jenisKelamin === 'P'
      ).length
      const tendikL = schoolPegawai.filter(
        (p) => p.jenisPegawai === 'Tendik' && p.jenisKelamin === 'L'
      ).length
      const tendikP = schoolPegawai.filter(
        (p) => p.jenisPegawai === 'Tendik' && p.jenisKelamin === 'P'
      ).length
      const pppkPw = schoolPegawai.filter(
        (p) => p.statusKepegawaian === 'PPPK_Paruh_Waktu'
      ).length
      const gtt = schoolPegawai.filter((p) => p.statusKepegawaian === 'GTT').length
      const honorer = schoolPegawai.filter((p) => p.statusKepegawaian === 'Honorer').length

      return {
        ...sekolah,
        guruL,
        guruP,
        tendikL,
        tendikP,
        pppkPw,
        honorerGtt: honorer + gtt,
      }
    })
  })()

  // Pensiun data (privacy: only show name, school, jenis, tahun, statusBup)
  const pensiunData = pegawaiList
    .filter((p) => p.statusBup === 'akan_pensiun' || p.statusBup === 'sudah_pensiun')
    .map((p) => ({
      id: p.id,
      nama: p.nama,
      sekolah: p.sekolah?.namaSekolah || '-',
      jenisPegawai: p.jenisPegawai || '-',
      tahunPensiun: p.tahunPensiun,
      statusBup: p.statusBup,
    }))

  // Status kepegawaian distribution for pie chart
  const statusDistribution = (() => {
    if (!pegawaiList.length) return []
    const counts: Record<string, number> = {}
    pegawaiList.forEach((p) => {
      const status = p.statusKepegawaian || 'Lainnya'
      counts[status] = (counts[status] || 0) + 1
    })
    const labels: Record<string, string> = {
      PNS: 'PNS',
      PPPK: 'PPPK',
      PPPK_Paruh_Waktu: 'PPPK Paruh Waktu',
      Honorer: 'Honorer',
      GTT: 'GTT',
      GTY: 'GTY',
      Lainnya: 'Lainnya',
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: labels[key] || key,
      value,
    }))
  })()

  // Pegawai per sekolah for bar chart
  const pegawaiPerSekolah = (dashboard?.rekapPerSekolah || []).map((s) => ({
    name: s.namaSekolah.length > 20 ? s.namaSekolah.slice(0, 18) + '...' : s.namaSekolah,
    Pegawai: s.totalPegawai,
  }))

  // Guru L vs P per jenjang for bar chart
  const guruPerJenjang = (() => {
    const jenjangMap: Record<string, { Laki: number; Perempuan: number }> = {}
    pegawaiList
      .filter((p) => p.jenisPegawai === 'Guru')
      .forEach((p) => {
        const j = p.sekolah?.jenjang || 'Lainnya'
        if (!jenjangMap[j]) jenjangMap[j] = { Laki: 0, Perempuan: 0 }
        if (p.jenisKelamin === 'L') jenjangMap[j].Laki++
        else if (p.jenisKelamin === 'P') jenjangMap[j].Perempuan++
      })
    return Object.entries(jenjangMap).map(([name, data]) => ({
      name,
      Laki: data.Laki,
      Perempuan: data.Perempuan,
    }))
  })()

  // ============================================================================
  // Summary cards config
  // ============================================================================

  const summaryCards = dashboard
    ? [
        { label: 'Total Sekolah', value: dashboard.overview.totalSekolah, icon: School, color: 'text-blue-600 bg-blue-50' },
        { label: 'Total Pegawai', value: dashboard.overview.totalPegawai, icon: Users, color: 'text-sky-600 bg-sky-50' },
        { label: 'Total Guru', value: dashboard.overview.totalGuru, icon: GraduationCap, color: 'text-green-600 bg-green-50' },
        { label: 'Total Tendik', value: dashboard.overview.totalTendik, icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
        { label: 'Total PNS', value: dashboard.overview.totalPNS, icon: BadgeCheck, color: 'text-blue-700 bg-blue-50' },
        { label: 'Total PPPK', value: dashboard.overview.totalPPPK, icon: FileBadge, color: 'text-sky-700 bg-sky-50' },
        { label: 'PPPK Paruh Waktu', value: dashboard.overview.totalPPPKParuhWaktu, icon: Clock, color: 'text-amber-700 bg-amber-50' },
        { label: 'Akan Pensiun', value: dashboard.overview.bup.akanPensiun, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
      ]
    : []

  // ============================================================================
  // Chart configs
  // ============================================================================

  const pieChartConfig: ChartConfig = {
    PNS: { label: 'PNS', color: '#1e40af' },
    PPPK: { label: 'PPPK', color: '#2563eb' },
    'PPPK Paruh Waktu': { label: 'PPPK Paruh Waktu', color: '#f59e0b' },
    Honorer: { label: 'Honorer', color: '#8b5cf6' },
    GTT: { label: 'GTT', color: '#f43f5e' },
    GTY: { label: 'GTY', color: '#f97316' },
    Lainnya: { label: 'Lainnya', color: '#0ea5e9' },
  }

  const barChartConfig: ChartConfig = {
    Pegawai: { label: 'Jumlah Pegawai', color: '#1e40af' },
  }

  const guruChartConfig: ChartConfig = {
    Laki: { label: 'Guru Laki-laki', color: '#2563eb' },
    Perempuan: { label: 'Guru Perempuan', color: '#f59e0b' },
  }

  // ============================================================================
  // Formatting helpers
  // ============================================================================

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatStatusBup = (status: string | null) => {
    if (status === 'akan_pensiun') return 'Akan Pensiun'
    if (status === 'sudah_pensiun') return 'Sudah Pensiun'
    return status || '-'
  }

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100/30 flex flex-col">
      {/* ===== Header ===== */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                SIMPEG
              </h1>
              <p className="text-blue-200 mt-1 text-sm sm:text-base">
                Sistem Informasi Manajemen Pegawai
              </p>
              <p className="text-blue-300/70 text-xs sm:text-sm">
                Tim Kerja Dinas Pendidikan Kecamatan Lemahabang
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <CalendarDays className="size-4" />
              <span>{formatDateTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* ===== Summary Cards ===== */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Ringkasan Data Pegawai
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {summaryCards.map((card) => (
              <Card
                key={card.label}
                className="border-0 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${card.color}`}>
                      <card.icon className="size-5 sm:size-6" />
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {card.value.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ===== Rekap Pegawai per Sekolah ===== */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Rekap Pegawai per Sekolah
          </h2>
          <Card className="shadow-md border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="text-center w-10">No</TableHead>
                      <TableHead>Nama Sekolah</TableHead>
                      <TableHead className="text-center">Jenjang</TableHead>
                      <TableHead className="text-center">Guru L</TableHead>
                      <TableHead className="text-center">Guru P</TableHead>
                      <TableHead className="text-center">Tendik L</TableHead>
                      <TableHead className="text-center">Tendik P</TableHead>
                      <TableHead className="text-center font-semibold">Total</TableHead>
                      <TableHead className="text-center">PNS</TableHead>
                      <TableHead className="text-center">PPPK</TableHead>
                      <TableHead className="text-center">PPPK PW</TableHead>
                      <TableHead className="text-center">Honorer/GTT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapWithGender.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                          Belum ada data sekolah
                        </TableCell>
                      </TableRow>
                    ) : (
                      rekapWithGender.map((sekolah, idx) => (
                        <TableRow key={sekolah.id}>
                          <TableCell className="text-center text-gray-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{sekolah.namaSekolah}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`${JENJANG_COLORS[sekolah.jenjang] || 'bg-gray-100 text-gray-700'} text-[10px] sm:text-xs`}
                            >
                              {sekolah.jenjang}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{sekolah.guruL}</TableCell>
                          <TableCell className="text-center">{sekolah.guruP}</TableCell>
                          <TableCell className="text-center">{sekolah.tendikL}</TableCell>
                          <TableCell className="text-center">{sekolah.tendikP}</TableCell>
                          <TableCell className="text-center font-semibold text-blue-800">
                            {sekolah.totalPegawai}
                          </TableCell>
                          <TableCell className="text-center">{sekolah.pns}</TableCell>
                          <TableCell className="text-center">{sekolah.pppk}</TableCell>
                          <TableCell className="text-center">{sekolah.pppkPw}</TableCell>
                          <TableCell className="text-center">{sekolah.honorerGtt}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {/* Totals row */}
                    {rekapWithGender.length > 0 && (
                      <TableRow className="bg-blue-50 font-semibold hover:bg-blue-50">
                        <TableCell colSpan={3} className="text-right pr-4">
                          Total
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.guruL, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.guruP, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.tendikL, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.tendikP, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-800">
                          {rekapWithGender.reduce((s, r) => s + r.totalPegawai, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.pns, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.pppk, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.pppkPw, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rekapWithGender.reduce((s, r) => s + r.honorerGtt, 0)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== Statistik Charts ===== */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Statistik Kepegawaian
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart: Distribusi Status Kepegawaian */}
            <Card className="shadow-md border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribusi Status Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent>
                {statusDistribution.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Belum ada data</p>
                ) : (
                  <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={true}
                      >
                        {statusDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Bar chart: Jumlah Pegawai per Sekolah */}
            <Card className="shadow-md border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Jumlah Pegawai per Sekolah</CardTitle>
              </CardHeader>
              <CardContent>
                {pegawaiPerSekolah.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Belum ada data</p>
                ) : (
                  <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                    <BarChart data={pegawaiPerSekolah} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="Pegawai"
                        fill="#1e40af"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Bar chart: Guru L vs P per Jenjang */}
            <Card className="shadow-md border-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Guru Laki-laki vs Perempuan per Jenjang</CardTitle>
              </CardHeader>
              <CardContent>
                {guruPerJenjang.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Belum ada data</p>
                ) : (
                  <ChartContainer config={guruChartConfig} className="h-[280px] w-full">
                    <BarChart data={guruPerJenjang}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="Laki" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="Perempuan" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ===== Rekap BUP/Pensiun ===== */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Rekap BUP / Pensiun
          </h2>
          <Card className="shadow-md border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-rose-50 hover:bg-rose-50">
                      <TableHead className="text-center w-10">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Sekolah</TableHead>
                      <TableHead className="text-center">Jenis Pegawai</TableHead>
                      <TableHead className="text-center">Tahun Pensiun</TableHead>
                      <TableHead className="text-center">Status BUP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pensiunData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          Tidak ada data pegawai yang akan/sudah pensiun
                        </TableCell>
                      </TableRow>
                    ) : (
                      pensiunData.map((p, idx) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-center text-gray-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{p.nama}</TableCell>
                          <TableCell>{p.sekolah}</TableCell>
                          <TableCell className="text-center">{p.jenisPegawai}</TableCell>
                          <TableCell className="text-center font-mono">
                            {p.tahunPensiun || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                p.statusBup === 'akan_pensiun'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }
                            >
                              {formatStatusBup(p.statusBup)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0a1628] text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              SIMPEG &mdash; Tim Kerja Dinas Pendidikan Kec. Lemahabang &copy; 2026
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setCurrentPage('login')}
            >
              <LogIn className="size-4 mr-2" />
              Login Admin / Operator
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
