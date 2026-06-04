'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { LogAktivitas } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  School,
  Users,
  GraduationCap,
  Briefcase,
  BadgeCheck,
  FileBadge,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRightLeft,
  ClipboardCheck,
  FileText,
  UserCog,
  LogOut,
  TrendingUp,
  Activity,
  Calendar,
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

interface PegawaiAdmin {
  id: string
  nama: string
  nip: string | null
  jenisPegawai: string | null
  jenisKelamin: string | null
  statusKepegawaian: string | null
  statusBup: string | null
  tahunPensiun: number | null
  tanggalLahir: string | null
  sekolahId: string
  sekolah: { id: string; namaSekolah: string; jenjang: string; npsn: string }
}

interface LogEntry {
  id: string
  aksi: string | null
  modul: string | null
  keterangan: string | null
  createdAt: string
  user: { id: string; nama: string; email: string; role: string }
}

// ============================================================================
// Color palette for stat cards
// ============================================================================

const JENJANG_COLORS: Record<string, string> = {
  SD: 'bg-blue-100 text-blue-800',
  TK: 'bg-amber-100 text-amber-800',
  'KB/PAUD': 'bg-purple-100 text-purple-800',
}

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#8b5cf6', '#f43f5e', '#f97316']

// ============================================================================
// Component
// ============================================================================

export default function AdminDashboard() {
  const { setCurrentPage, logout, user } = useSimpegStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [pegawaiList, setPegawaiList] = useState<PegawaiAdmin[]>([])
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, pegawaiRes, logRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/pegawai?limit=500'),
        fetch('/api/log?limit=5'),
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

      if (logRes.ok) {
        const logJson = await logRes.json()
        if (logJson.success) {
          setRecentLogs(logJson.data || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
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

  // Pegawai akan pensiun with more detail for admin
  const pensiunData = pegawaiList
    .filter((p) => p.statusBup === 'akan_pensiun' || p.statusBup === 'sudah_pensiun')
    .map((p) => {
      const currentYear = new Date().getFullYear()
      const tahunPensiun = p.tahunPensiun || currentYear
      const sisaTahun = tahunPensiun - currentYear

      // Calculate age
      let usia = '-'
      if (p.tanggalLahir) {
        const birthDate = new Date(p.tanggalLahir)
        const age = currentYear - birthDate.getFullYear()
        usia = `${age} th`
      }

      return {
        id: p.id,
        nama: p.nama,
        nip: p.nip || '-',
        sekolah: p.sekolah?.namaSekolah || '-',
        statusKepegawaian: p.statusKepegawaian || '-',
        usia,
        tahunPensiun,
        statusBup: p.statusBup,
        sisaWaktu: sisaTahun <= 0 ? 'Sudah waktunya' : `${sisaTahun} tahun lagi`,
        isWithinOneYear: sisaTahun <= 1,
      }
    })
    .sort((a, b) => a.tahunPensiun - b.tahunPensiun)

  // Status distribution for chart
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
      PPPK_Paruh_Waktu: 'PPPK PW',
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

  // ============================================================================
  // Stat cards config
  // ============================================================================

  const statCards = dashboard
    ? [
        { label: 'Total Sekolah', value: dashboard.overview.totalSekolah, icon: School, bgClass: 'bg-blue-500', textClass: 'text-white' },
        { label: 'Total Pegawai', value: dashboard.overview.totalPegawai, icon: Users, bgClass: 'bg-gradient-to-br from-blue-700 to-blue-800', textClass: 'text-white' },
        { label: 'Total Guru', value: dashboard.overview.totalGuru, icon: GraduationCap, bgClass: 'bg-green-500', textClass: 'text-white' },
        { label: 'Total Tendik', value: dashboard.overview.totalTendik, icon: Briefcase, bgClass: 'bg-amber-500', textClass: 'text-white' },
        { label: 'Total PNS', value: dashboard.overview.totalPNS, icon: BadgeCheck, bgClass: 'bg-sky-600', textClass: 'text-white' },
        { label: 'Total PPPK', value: dashboard.overview.totalPPPK, icon: FileBadge, bgClass: 'bg-purple-500', textClass: 'text-white' },
        { label: 'PPPK Paruh Waktu', value: dashboard.overview.totalPPPKParuhWaktu, icon: Clock, bgClass: 'bg-orange-500', textClass: 'text-white' },
        { label: 'Total Honorer', value: dashboard.overview.totalHonorer, icon: UserCog, bgClass: 'bg-red-500', textClass: 'text-white' },
        { label: 'BUP / Akan Pensiun', value: dashboard.overview.bup.akanPensiun, icon: AlertTriangle, bgClass: 'bg-rose-500', textClass: 'text-white' },
        { label: 'Validasi Pending', value: dashboard.overview.pendingValidasi, icon: ShieldCheck, bgClass: 'bg-yellow-500', textClass: 'text-white' },
        { label: 'Mutasi Pending', value: dashboard.overview.pendingMutasi, icon: ArrowRightLeft, bgClass: 'bg-violet-600', textClass: 'text-white' },
      ]
    : []

  // Absensi summary cards
  const absensiCards = dashboard
    ? [
        { label: 'Hadir', value: dashboard.absensi.hadir, color: 'text-blue-700 bg-blue-50' },
        { label: 'Terlambat', value: dashboard.absensi.terlambat, color: 'text-amber-700 bg-amber-50' },
        { label: 'Izin', value: dashboard.absensi.izin, color: 'text-sky-700 bg-sky-50' },
        { label: 'Sakit', value: dashboard.absensi.sakit, color: 'text-orange-700 bg-orange-50' },
        { label: 'Alfa', value: dashboard.absensi.alfa, color: 'text-red-700 bg-red-50' },
        { label: 'Dinas Luar', value: dashboard.absensi.dinasLuar, color: 'text-purple-700 bg-purple-50' },
        { label: 'Cuti', value: dashboard.absensi.cuti, color: 'text-sky-700 bg-sky-50' },
        { label: 'Belum Input', value: dashboard.absensi.belumInput, color: 'text-gray-700 bg-gray-100' },
      ]
    : []

  // ============================================================================
  // Quick action buttons
  // ============================================================================

  const quickActions = [
    { label: 'Kelola Pegawai', icon: Users, page: 'pegawai', badge: null },
    {
      label: 'Validasi Data',
      icon: ShieldCheck,
      page: 'validasi',
      badge: dashboard?.overview.pendingValidasi || 0,
    },
    { label: 'Mutasi Pegawai', icon: ArrowRightLeft, page: 'mutasi', badge: null },
    { label: 'Absensi', icon: ClipboardCheck, page: 'absensi', badge: null },
    { label: 'Laporan', icon: FileText, page: 'laporan', badge: null },
  ]

  // ============================================================================
  // Chart configs
  // ============================================================================

  const pieChartConfig: ChartConfig = {
    PNS: { label: 'PNS', color: '#10b981' },
    PPPK: { label: 'PPPK', color: '#14b8a6' },
    'PPPK PW': { label: 'PPPK Paruh Waktu', color: '#f59e0b' },
    Honorer: { label: 'Honorer', color: '#8b5cf6' },
    GTT: { label: 'GTT', color: '#f43f5e' },
    GTY: { label: 'GTY', color: '#f97316' },
    Lainnya: { label: 'Lainnya', color: '#0ea5e9' },
  }

  // ============================================================================
  // Formatting helpers
  // ============================================================================

  const formatStatusBup = (status: string | null) => {
    if (status === 'akan_pensiun') return 'Akan Pensiun'
    if (status === 'sudah_pensiun') return 'Sudah Pensiun'
    return status || '-'
  }

  const formatLogTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAksi = (aksi: string | null) => {
    if (!aksi) return '-'
    const map: Record<string, string> = {
      login: 'Login',
      tambah: 'Tambah',
      edit: 'Edit',
      hapus: 'Hapus',
      validasi: 'Validasi',
      export: 'Export',
      cetak: 'Cetak',
    }
    return map[aksi] || aksi
  }

  const formatModul = (modul: string | null) => {
    if (!modul) return '-'
    const map: Record<string, string> = {
      pegawai: 'Pegawai',
      absensi: 'Absensi',
      validasi: 'Validasi',
      mutasi: 'Mutasi',
      sekolah: 'Sekolah',
      pengaturan: 'Pengaturan',
    }
    return map[modul] || modul
  }

  const aksiColorMap: Record<string, string> = {
    login: 'bg-sky-100 text-sky-700',
    tambah: 'bg-blue-100 text-blue-700',
    edit: 'bg-amber-100 text-amber-700',
    hapus: 'bg-red-100 text-red-700',
    validasi: 'bg-purple-100 text-purple-700',
    export: 'bg-sky-100 text-sky-700',
    cetak: 'bg-gray-100 text-gray-700',
  }

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ===== Admin Header ===== */}
      <header className="bg-gradient-to-r from-[#0a1628] to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Dashboard Admin</h1>
              <p className="text-blue-200 text-sm">
                Sistem Informasi Manajemen Pegawai
              </p>
              <p className="text-blue-300/70 text-xs">
                Tim Kerja Dinas Pendidikan Kec. Lemahabang
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.nama || 'Admin'}</p>
                <p className="text-xs text-blue-200">{user?.role === 'admin_kecamatan' ? 'Admin Kecamatan' : 'Operator'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:bg-blue-800 hover:text-white"
                onClick={logout}
              >
                <LogOut className="size-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ===== Ringkasan Data - Stat Cards ===== */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Ringkasan Data</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {statCards.map((card) => (
              <Card
                key={card.label}
                className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-default"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <div className={`rounded-lg p-2 ${card.bgClass}`}>
                      <card.icon className="size-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {card.value.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">
                        {card.label}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 bg-blue-600 rounded-sm px-1.5 py-0.5">
                    <TrendingUp className="size-3 text-white" />
                    <span className="text-[10px] text-white font-medium">Aktif</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ===== Quick Action Buttons ===== */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Aksi Cepat</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.page}
                variant="outline"
                className="h-auto py-2.5 px-4 border-blue-200 hover:bg-blue-50 hover:border-blue-400 text-gray-700 hover:text-blue-700 relative"
                onClick={() => setCurrentPage(action.page)}
              >
                <action.icon className="size-4 mr-2" />
                {action.label}
                {action.badge !== null && action.badge > 0 && (
                  <Badge className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0 min-w-[20px] justify-center">
                    {action.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </section>

        {/* ===== Absensi Summary ===== */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            <span className="flex items-center gap-2">
              <Calendar className="size-5 text-blue-600" />
              Rekap Absensi Bulan Ini
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {absensiCards.map((card) => (
              <Card key={card.label} className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className={`inline-flex rounded-lg px-3 py-1 mb-1.5 ${card.color}`}>
                    <span className="text-lg font-bold">{card.value}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500">{card.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ===== Charts + Rekap Sekolah (2-col layout) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart: Status Kepegawaian */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribusi Status Kepegawaian</CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistribution.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada data</p>
              ) : (
                <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-xs text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Rekap Per Sekolah Table */}
          <Card className="shadow-md border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rekap Pegawai per Sekolah</CardTitle>
              <CardDescription>Klik baris untuk melihat detail pegawai</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="text-center w-10">No</TableHead>
                      <TableHead>Sekolah</TableHead>
                      <TableHead className="text-center">Jenjang</TableHead>
                      <TableHead className="text-center">Guru</TableHead>
                      <TableHead className="text-center">Tendik</TableHead>
                      <TableHead className="text-center font-semibold">Total</TableHead>
                      <TableHead className="text-center">PNS</TableHead>
                      <TableHead className="text-center">PPPK</TableHead>
                      <TableHead className="text-center">Honorer/GTT</TableHead>
                      <TableHead className="text-center">Akan Pensiun</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapWithGender.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-400">
                          Belum ada data sekolah
                        </TableCell>
                      </TableRow>
                    ) : (
                      rekapWithGender.map((sekolah, idx) => (
                        <TableRow
                          key={sekolah.id}
                          className="cursor-pointer hover:bg-blue-50/50"
                          onClick={() => setCurrentPage('pegawai')}
                        >
                          <TableCell className="text-center text-gray-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{sekolah.namaSekolah}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`${JENJANG_COLORS[sekolah.jenjang] || 'bg-gray-100 text-gray-700'} text-[10px]`}
                            >
                              {sekolah.jenjang}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{sekolah.guru}</TableCell>
                          <TableCell className="text-center text-sm">{sekolah.tendik}</TableCell>
                          <TableCell className="text-center font-semibold bg-blue-700 text-sm">
                            {sekolah.totalPegawai}
                          </TableCell>
                          <TableCell className="text-center text-sm">{sekolah.pns}</TableCell>
                          <TableCell className="text-center text-sm">{sekolah.pppk}</TableCell>
                          <TableCell className="text-center text-sm">{sekolah.honorerGtt}</TableCell>
                          <TableCell className="text-center text-sm">
                            {sekolah.akanPensiun > 0 ? (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                {sekolah.akanPensiun}
                              </Badge>
                            ) : (
                              <span className="text-gray-300">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Bottom Section: Pensiun + Recent Activity ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pegawai Akan Pensiun */}
          <Card className="shadow-md border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Pegawai Akan Pensiun
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50 hover:bg-amber-50">
                      <TableHead className="text-center w-10">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Sekolah</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Usia</TableHead>
                      <TableHead className="text-center">Thn Pensiun</TableHead>
                      <TableHead className="text-center">Sisa Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pensiunData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                          Tidak ada pegawai yang akan pensiun
                        </TableCell>
                      </TableRow>
                    ) : (
                      pensiunData.map((p, idx) => (
                        <TableRow
                          key={p.id}
                          className={p.isWithinOneYear ? 'bg-red-50 hover:bg-red-50' : ''}
                        >
                          <TableCell className="text-center text-gray-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{p.nama}</TableCell>
                          <TableCell className="text-xs font-mono text-gray-500">
                            {p.nip}
                          </TableCell>
                          <TableCell className="text-sm">{p.sekolah}</TableCell>
                          <TableCell className="text-center text-xs">{p.statusKepegawaian}</TableCell>
                          <TableCell className="text-center text-sm">{p.usia}</TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {p.tahunPensiun}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`text-[10px] ${
                                p.isWithinOneYear
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.sisaWaktu}
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

          {/* Recent Activity */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-5 text-sky-500" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  Belum ada aktivitas
                </p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Badge
                        className={`${aksiColorMap[log.aksi || ''] || 'bg-gray-100 text-gray-700'} text-[10px] shrink-0 self-start mt-0.5`}
                      >
                        {formatAksi(log.aksi)}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 leading-snug truncate">
                          {log.keterangan || '-'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">
                            {log.user?.nama || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className="text-[10px] text-gray-400">
                            {formatLogTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ===== Admin Footer ===== */}
      <footer className="bg-[#0a1628] text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-center">
            SIMPEG &mdash; Tim Kerja Dinas Pendidikan Kec. Lemahabang &copy; 2026 &mdash; Panel Admin
          </p>
        </div>
      </footer>
    </div>
  )
}
