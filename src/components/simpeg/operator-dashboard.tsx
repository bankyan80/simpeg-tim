'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Pegawai, ValidasiData } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  School,
  Users,
  UserCheck,
  ClipboardList,
  Send,
  Printer,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarDays,
  GraduationCap,
  Briefcase,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardOverview {
  totalSekolah: number
  totalPegawai: number
  totalGuru: number
  totalTendik: number
  totalPNS: number
  totalPPPK: number
  totalPPPKParuhWaktu: number
  totalHonorer: number
  bup: { aktif: number; akanPensiun: number; sudahPensiun: number }
  pendingValidasi: number
  pendingMutasi: number
}

interface DashboardAbsensi {
  hadir: number
  terlambat: number
  izin: number
  sakit: number
  alfa: number
  dinasLuar: number
  cuti: number
  belumInput: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OperatorDashboard() {
  const {
    user,
    setCurrentPage,
    setShowPegawaiForm,
    setNotification,
    sekolahList,
    loadSekolah,
  } = useSimpegStore()

  const sekolahId = user?.sekolahId ?? ''
  const sekolah = user?.sekolah

  // ---- Local state ----
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [absensi, setAbsensi] = useState<DashboardAbsensi | null>(null)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [pegawaiTotal, setPegawaiTotal] = useState(0)
  const [validasiList, setValidasiList] = useState<ValidasiData[]>([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingPegawai, setLoadingPegawai] = useState(true)

  // Pegawai table filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // ---- Fetch dashboard data ----
  const fetchDashboard = useCallback(async () => {
    if (!sekolahId) return
    setLoadingOverview(true)
    try {
      const res = await fetch(`/api/dashboard?sekolahId=${sekolahId}`)
      if (!res.ok) throw new Error('Gagal memuat dashboard')
      const json = await res.json()
      const d = json.data
      setOverview(d.overview)
      setAbsensi(d.absensi)
    } catch {
      setNotification({ type: 'error', message: 'Gagal memuat data dashboard' })
    } finally {
      setLoadingOverview(false)
    }
  }, [sekolahId, setNotification])

  // ---- Fetch pegawai list ----
  const fetchPegawai = useCallback(async () => {
    if (!sekolahId) return
    setLoadingPegawai(true)
    try {
      const params = new URLSearchParams({ sekolahId, page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (filterStatus) params.set('statusKepegawaian', filterStatus)
      const res = await fetch(`/api/pegawai?${params}`)
      if (!res.ok) throw new Error('Gagal memuat pegawai')
      const json = await res.json()
      setPegawaiList(json.data ?? [])
      setPegawaiTotal(json.total ?? 0)
    } catch {
      setNotification({ type: 'error', message: 'Gagal memuat data pegawai' })
    } finally {
      setLoadingPegawai(false)
    }
  }, [sekolahId, page, search, filterStatus, setNotification])

  // ---- Fetch validasi list ----
  const fetchValidasi = useCallback(async () => {
    if (!sekolahId) return
    try {
      const res = await fetch(`/api/validasi?sekolahId=${sekolahId}&limit=5`)
      if (!res.ok) throw new Error('Gagal memuat validasi')
      const json = await res.json()
      setValidasiList(json.data ?? [])
    } catch {
      /* silent */
    }
  }, [sekolahId])

  // ---- Effects ----
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    fetchPegawai()
  }, [fetchPegawai])

  useEffect(() => {
    fetchValidasi()
  }, [fetchValidasi])

  useEffect(() => {
    if (sekolahList.length === 0) loadSekolah()
  }, [sekolahList.length, loadSekolah])

  // ---- Handlers ----
  const handleKirimData = async () => {
    if (!sekolahId) return
    try {
      const res = await fetch('/api/validasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sekolahId,
          jenisPengajuan: 'data_baru',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal' }))
        throw new Error(err.error || 'Gagal mengirim data')
      }
      setNotification({ type: 'success', message: 'Data berhasil dikirim untuk validasi' })
      fetchValidasi()
    } catch (e) {
      setNotification({
        type: 'error',
        message: e instanceof Error ? e.message : 'Gagal mengirim data',
      })
    }
  }

  const handleCetak = () => {
    window.print()
  }

  const handleDeletePegawai = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menonaktifkan pegawai "${nama}"?`)) return
    try {
      const res = await fetch(`/api/pegawai/${id}?userId=${user?.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      setNotification({ type: 'success', message: `Pegawai ${nama} berhasil dinonaktifkan` })
      fetchPegawai()
      fetchDashboard()
    } catch {
      setNotification({ type: 'error', message: 'Gagal menonaktifkan pegawai' })
    }
  }

  // ---- Pagination helpers ----
  const totalPages = Math.ceil(pegawaiTotal / limit)

  // ---- Render helpers ----
  const statusKepegawaianLabel = (s: string | null) => {
    const map: Record<string, string> = {
      PNS: 'PNS',
      PPPK: 'PPPK',
      PPPK_Paruh_Waktu: 'PPPK Paruh Waktu',
      Honorer: 'Honorer',
      GTY: 'GTY',
      GTT: 'GTT',
      Tenaga_Administrasi: 'Tenaga Administrasi',
      Penjaga_Sekolah: 'Penjaga Sekolah',
      Kepala_Sekolah: 'Kepala Sekolah',
    }
    return s ? map[s] ?? s : '-'
  }

  const validasiBadge = (status: string) => {
    switch (status) {
      case 'divalidasi':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><CheckCircle2 className="size-3 mr-1" /> Divalidasi</Badge>
      case 'ditolak':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="size-3 mr-1" /> Ditolak</Badge>
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><Clock className="size-3 mr-1" /> Pending</Badge>
    }
  }

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* RINGKASAN SEKOLAH                                                */}
      {/* ================================================================= */}
      <section>
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <School className="size-5 text-blue-700" />
          Ringkasan Sekolah
        </h2>

        {loadingOverview ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Nama Sekolah" value={sekolah?.namaSekolah ?? '-'} icon={<School className="size-4" />} />
            <StatCard label="NPSN" value={sekolah?.npsn ?? '-'} />
            <StatCard label="Kepala Sekolah" value={sekolah?.kepalaSekolah ?? '-'} icon={<UserCheck className="size-4" />} />
            <StatCard label="Total Guru" value={overview?.totalGuru ?? 0} icon={<GraduationCap className="size-4" />} color="blue" />
            <StatCard label="Total Tendik" value={overview?.totalTendik ?? 0} icon={<Briefcase className="size-4" />} color="sky" />
            <StatCard label="Total PNS" value={overview?.totalPNS ?? 0} color="blue" />
            <StatCard label="Total PPPK" value={overview?.totalPPPK ?? 0} color="sky" />
            <StatCard label="Total PPPK Paruh Waktu" value={overview?.totalPPPKParuhWaktu ?? 0} color="sky" />
            <StatCard label="Total Honorer" value={overview?.totalHonorer ?? 0} color="amber" />
            <StatCard
              label="Status Validasi"
              value={overview && overview.pendingValidasi > 0 ? 'Pending' : 'Divalidasi'}
              badge={overview && overview.pendingValidasi > 0 ? 'pending' : 'divalidasi'}
            />
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* QUICK ACTIONS                                                     */}
      {/* ================================================================= */}
      <section>
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <ClipboardList className="size-5 text-blue-700" />
          Aksi Cepat
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowPegawaiForm(true)}
            className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Users className="size-4" /> Tambah Pegawai
          </Button>
          <Button
            onClick={() => setCurrentPage('absensi')}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <CalendarDays className="size-4" /> Input Absensi
          </Button>
          <Button
            onClick={handleKirimData}
            variant="outline"
            className="border-sky-300 text-sky-700 hover:bg-sky-50"
          >
            <Send className="size-4" /> Kirim Data
          </Button>
          <Button
            onClick={handleCetak}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Printer className="size-4" /> Cetak Daftar Pegawai
          </Button>
        </div>
      </section>

      {/* ================================================================= */}
      {/* DAFTAR PEGAWAI SEKOLAH TABLE                                      */}
      {/* ================================================================= */}
      <section>
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Users className="size-5 text-blue-700" />
          Daftar Pegawai Sekolah
        </h2>

        {/* Search & filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v === '__all__' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status Kepegawaian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Semua Status</SelectItem>
              <SelectItem value="PNS">PNS</SelectItem>
              <SelectItem value="PPPK">PPPK</SelectItem>
              <SelectItem value="PPPK_Paruh_Waktu">PPPK Paruh Waktu</SelectItem>
              <SelectItem value="Honorer">Honorer</SelectItem>
              <SelectItem value="GTY">GTY</SelectItem>
              <SelectItem value="GTT">GTT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">NIP</TableHead>
                  <TableHead className="hidden sm:table-cell">Jabatan</TableHead>
                  <TableHead>Status Kepegawaian</TableHead>
                  <TableHead className="hidden lg:table-cell">Sertifikasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPegawai ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pegawaiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada data pegawai
                    </TableCell>
                  </TableRow>
                ) : (
                  pegawaiList.map((p, idx) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-blue-50/50"
                      onClick={() => {
                        useSimpegStore.getState().loadPegawaiDetail(p.id)
                        setCurrentPage('pegawai')
                      }}
                    >
                      <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                      <TableCell className="font-medium">{p.nama}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.nip ?? '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{p.jabatan ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {statusKepegawaianLabel(p.statusKepegawaian)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <SertifikasiBadge status={p.sertifikasi} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                            onClick={() => {
                              useSimpegStore.getState().loadPegawaiDetail(p.id)
                              setCurrentPage('pegawai')
                            }}
                            title="Detail"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            onClick={() => setShowPegawaiForm(true, p)}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeletePegawai(p.id, p.nama)}
                            title="Hapus"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, pegawaiTotal)} dari {pegawaiTotal} pegawai
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground">...</span>
                    )}
                    <Button
                      size="sm"
                      variant={p === page ? 'default' : 'outline'}
                      className={p === page ? 'bg-blue-800 hover:bg-blue-700' : ''}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </span>
                ))}
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* ABSENSI HARI INI                                                  */}
      {/* ================================================================= */}
      <section>
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <CalendarDays className="size-5 text-blue-700" />
          Absensi Hari Ini
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MiniStatCard label="Hadir" value={absensi?.hadir ?? 0} color="blue" />
          <MiniStatCard label="Terlambat" value={absensi?.terlambat ?? 0} color="amber" />
          <MiniStatCard label="Izin" value={absensi?.izin ?? 0} color="sky" />
          <MiniStatCard label="Sakit" value={absensi?.sakit ?? 0} color="orange" />
          <MiniStatCard label="Alfa" value={absensi?.alfa ?? 0} color="red" />
          <MiniStatCard label="Belum Input" value={absensi?.belumInput ?? 0} color="gray" />
        </div>

        <Button
          variant="outline"
          className="mt-4 border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={() => setCurrentPage('absensi')}
        >
          Lihat Semua Absensi
        </Button>
      </section>

      {/* ================================================================= */}
      {/* STATUS PENGAJUAN                                                  */}
      {/* ================================================================= */}
      <section>
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <ClipboardList className="size-5 text-blue-700" />
          Status Pengajuan
        </h2>

        {validasiList.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Belum ada pengajuan
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {validasiList.map((v) => (
              <Card key={v.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {v.pegawai?.nama ?? v.sekolah?.namaSekolah ?? 'Pengajuan Data'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {v.jenisPengajuan?.replace(/_/g, ' ')} &middot;{' '}
                      {new Date(v.tanggalPengajuan).toLocaleDateString('id-ID')}
                    </p>
                    {v.catatanAdmin && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Catatan: {v.catatanAdmin}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">{validasiBadge(v.statusValidasi)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
  badge,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  color?: 'blue' | 'sky' | 'amber' | 'red'
  badge?: string
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  const cardColor = color ? colorMap[color] : ''

  if (badge) {
    return (
      <Card className={cardColor}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          {badge === 'pending' ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              <AlertTriangle className="size-3 mr-1" /> Pending
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <CheckCircle2 className="size-3 mr-1" /> Divalidasi
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cardColor}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <p className="text-lg font-bold truncate" title={String(value)}>{value}</p>
      </CardContent>
    </Card>
  )
}

function MiniStatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'sky' | 'orange' | 'red' | 'gray'
}) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }

  return (
    <Card className={colorMap[color]}>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs mt-1 opacity-80">{label}</p>
      </CardContent>
    </Card>
  )
}

function SertifikasiBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>
  switch (status) {
    case 'Terisi':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Terisi</Badge>
    case 'Proses':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">Proses</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs">Belum</Badge>
  }
}
