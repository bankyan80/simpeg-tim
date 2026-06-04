'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { AbsensiPegawai, Pegawai, Sekolah } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Users, UserCheck, Clock, FileText, Heart, XCircle, MapPin, CalendarOff, ClipboardList,
  Plus, Search, RotateCcw, Printer, FileSpreadsheet, Send, Eye, Pencil, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react'

const KETERANGAN_OPTIONS = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alfa', 'Dinas_Luar', 'Cuti'] as const
const STATUS_PEGAWAI_OPTIONS = ['PNS', 'PPPK', 'PPPK_Paruh_Waktu'] as const

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  } catch {
    return '-'
  }
}

function getKeteranganColor(keterangan: string | null): string {
  switch (keterangan) {
    case 'Hadir': return 'bg-blue-100 text-blue-800'
    case 'Terlambat': return 'bg-amber-100 text-amber-800'
    case 'Izin': return 'bg-blue-100 text-blue-800'
    case 'Sakit': return 'bg-yellow-100 text-yellow-800'
    case 'Alfa': return 'bg-red-100 text-red-800'
    case 'Dinas_Luar': return 'bg-purple-100 text-purple-800'
    case 'Cuti': return 'bg-sky-100 text-sky-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusPegawaiColor(status: string | null): string {
  switch (status) {
    case 'PNS': return 'bg-blue-100 text-blue-800'
    case 'PPPK': return 'bg-blue-100 text-blue-800'
    case 'PPPK_Paruh_Waktu': return 'bg-amber-100 text-amber-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function AbsensiPage() {
  const { user, absensiList, absensiTotal, loadAbsensi, sekolahList, loadSekolah, pegawaiList, loadPegawai, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  // Filters
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterSekolah, setFilterSekolah] = useState('')
  const [filterStatusPegawai, setFilterStatusPegawai] = useState('')
  const [filterKeterangan, setFilterKeterangan] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Dialog
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailData, setDetailData] = useState<AbsensiPegawai | null>(null)

  // Form state
  const [formTanggal, setFormTanggal] = useState('')
  const [formPegawaiId, setFormPegawaiId] = useState('')
  const [formNip, setFormNip] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formUnitKerja, setFormUnitKerja] = useState('')
  const [formStatusPegawai, setFormStatusPegawai] = useState('')
  const [formJamMasuk, setFormJamMasuk] = useState('')
  const [formJamKeluar, setFormJamKeluar] = useState('')
  const [formKeterangan, setFormKeterangan] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sekolahId = isAdmin ? filterSekolah : (user?.sekolahId || '')

  const load = useCallback(() => {
    const filters: Record<string, string> = {
      page: page.toString(),
      limit: pageSize.toString(),
    }
    if (filterTanggal) filters.tanggal = filterTanggal
    if (filterBulan) filters.bulan = filterBulan
    if (filterTahun) filters.tahun = filterTahun
    if (sekolahId) filters.sekolahId = sekolahId
    if (filterStatusPegawai) filters.statusPegawai = filterStatusPegawai
    if (filterKeterangan) filters.keterangan = filterKeterangan
    if (filterSearch) filters.search = filterSearch
    loadAbsensi(filters)
  }, [page, filterTanggal, filterBulan, filterTahun, sekolahId, filterStatusPegawai, filterKeterangan, filterSearch, loadAbsensi])

  useEffect(() => {
    loadSekolah()
  }, [loadSekolah])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (sekolahId) {
      loadPegawai({ sekolahId, statusPegawai: 'aktif' })
    }
  }, [sekolahId, loadPegawai])

  // Summary calculations
  const totalPegawai = pegawaiList.length
  const hadirCount = absensiList.filter(a => a.keterangan === 'Hadir').length
  const terlambatCount = absensiList.filter(a => a.keterangan === 'Terlambat').length
  const izinCount = absensiList.filter(a => a.keterangan === 'Izin').length
  const sakitCount = absensiList.filter(a => a.keterangan === 'Sakit').length
  const alfaCount = absensiList.filter(a => a.keterangan === 'Alfa').length
  const dinasLuarCount = absensiList.filter(a => a.keterangan === 'Dinas_Luar').length
  const cutiCount = absensiList.filter(a => a.keterangan === 'Cuti').length
  const belumInput = Math.max(0, totalPegawai - absensiList.length)

  const summaryCards = [
    { label: 'Total Pegawai', count: totalPegawai, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Hadir', count: hadirCount, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Terlambat', count: terlambatCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Izin', count: izinCount, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sakit', count: sakitCount, icon: Heart, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Alfa', count: alfaCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Dinas Luar', count: dinasLuarCount, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cuti', count: cutiCount, icon: CalendarOff, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Belum Input', count: belumInput, icon: ClipboardList, color: 'text-gray-600', bg: 'bg-gray-50' },
  ]

  function resetFilters() {
    setFilterTanggal('')
    setFilterBulan('')
    setFilterTahun(new Date().getFullYear().toString())
    setFilterSekolah('')
    setFilterStatusPegawai('')
    setFilterKeterangan('')
    setFilterSearch('')
    setPage(1)
  }

  function openAddForm() {
    setEditingId(null)
    setFormTanggal(new Date().toISOString().split('T')[0])
    setFormPegawaiId('')
    setFormNip('')
    setFormNama('')
    setFormUnitKerja(user?.sekolahId || '')
    setFormStatusPegawai('')
    setFormJamMasuk('')
    setFormJamKeluar('')
    setFormKeterangan('')
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(absensi: AbsensiPegawai) {
    if (absensi.statusValidasi !== 'pending') return
    setEditingId(absensi.id)
    setFormTanggal(absensi.tanggal ? new Date(absensi.tanggal).toISOString().split('T')[0] : '')
    setFormPegawaiId(absensi.pegawaiId)
    setFormNip(absensi.nip || '-')
    setFormNama(absensi.namaPegawai)
    setFormUnitKerja(absensi.sekolahId)
    setFormStatusPegawai(absensi.statusPegawai || '')
    setFormJamMasuk(absensi.jamMasuk || '')
    setFormJamKeluar(absensi.jamKeluar || '')
    setFormKeterangan(absensi.keterangan || '')
    setFormError('')
    setShowForm(true)
  }

  function handlePegawaiSelect(pegawaiId: string) {
    setFormPegawaiId(pegawaiId)
    const pegawai = pegawaiList.find(p => p.id === pegawaiId)
    if (pegawai) {
      setFormNip(pegawai.nip || '-')
      setFormNama(pegawai.nama)
      setFormUnitKerja(pegawai.sekolahId || user?.sekolahId || '')
      const statusMap: Record<string, string> = {
        'PNS': 'PNS', 'PPPK': 'PPPK', 'PPPK_Paruh_Waktu': 'PPPK_Paruh_Waktu'
      }
      setFormStatusPegawai(statusMap[pegawai.statusKepegawaian || ''] || '')
    }
  }

  async function handleSubmit() {
    setFormError('')
    if (!formTanggal) { setFormError('Tanggal wajib diisi'); return }
    if (!formPegawaiId) { setFormError('Pegawai wajib dipilih'); return }
    if (!formKeterangan) { setFormError('Keterangan wajib diisi'); return }
    if ((formKeterangan === 'Hadir' || formKeterangan === 'Terlambat') && !formJamMasuk) {
      setFormError('Jam masuk wajib diisi untuk keterangan Hadir/Terlambat')
      return
    }

    setSubmitting(true)
    try {
      const body = {
        tanggal: formTanggal,
        pegawaiId: formPegawaiId,
        jamMasuk: formJamMasuk || null,
        jamKeluar: formJamKeluar || null,
        keterangan: formKeterangan,
      }

      let res: Response
      if (editingId) {
        res = await fetch(`/api/absensi/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/absensi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menyimpan data' }))
        throw new Error(err.error || 'Gagal menyimpan data')
      }

      setNotification({ type: 'success', message: editingId ? 'Absensi berhasil diperbarui' : 'Absensi berhasil ditambahkan' })
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/absensi/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')
      setNotification({ type: 'success', message: 'Absensi berhasil dihapus' })
      setShowDelete(false)
      setDeleteId(null)
      load()
    } catch {
      setNotification({ type: 'error', message: 'Gagal menghapus data' })
    }
  }

  async function handleKirimValidasi() {
    try {
      const body = { sekolahId: user?.sekolahId }
      const res = await fetch('/api/absensi/validasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Gagal mengirim validasi')
      setNotification({ type: 'success', message: 'Data absensi berhasil dikirim ke Kecamatan' })
      load()
    } catch {
      setNotification({ type: 'error', message: 'Gagal mengirim validasi' })
    }
  }

  function handleExport() {
    const params = new URLSearchParams({ type: 'absensi', format: 'csv' })
    if (sekolahId) params.set('sekolahId', sekolahId)
    if (filterTahun) params.set('tahun', filterTahun)
    if (filterBulan) params.set('bulan', filterBulan)
    window.open(`/api/export?${params.toString()}`)
  }

  const filteredPegawai = pegawaiList.filter(p =>
    ['PNS', 'PPPK', 'PPPK_Paruh_Waktu'].includes(p.statusKepegawaian || '') && p.statusPegawai === 'aktif'
  )

  const totalPages = Math.max(1, Math.ceil(absensiTotal / pageSize))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Absensi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data kehadiran pegawai</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddForm} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
            <Plus className="w-4 h-4 mr-2" /> Tambah Absensi
          </Button>
          {!isAdmin && (
            <Button variant="outline" onClick={handleKirimValidasi} className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <Send className="w-4 h-4 mr-2" /> Kirim ke Kecamatan
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()} className="border-gray-300">
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
          <Button variant="outline" onClick={handleExport} className="border-gray-300">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`${card.bg} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <card.icon className={`w-8 h-8 ${card.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                  <p className="text-xs text-gray-600">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Tanggal</Label>
              <Input type="date" value={filterTanggal} onChange={e => { setFilterTanggal(e.target.value); setPage(1) }} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Bulan</Label>
              <Select value={filterBulan} onValueChange={v => { setFilterBulan(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">Januari</SelectItem>
                  <SelectItem value="02">Februari</SelectItem>
                  <SelectItem value="03">Maret</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">Mei</SelectItem>
                  <SelectItem value="06">Juni</SelectItem>
                  <SelectItem value="07">Juli</SelectItem>
                  <SelectItem value="08">Agustus</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">Oktober</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">Desember</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tahun</Label>
              <Select value={filterTahun} onValueChange={v => { setFilterTahun(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <Label className="text-xs mb-1 block">Unit Kerja/Sekolah</Label>
                <Select value={filterSekolah} onValueChange={v => { setFilterSekolah(v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Semua Sekolah" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sekolah</SelectItem>
                    {sekolahList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.namaSekolah}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Status Pegawai</Label>
              <Select value={filterStatusPegawai} onValueChange={v => { setFilterStatusPegawai(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_PEGAWAI_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Keterangan</Label>
              <Select value={filterKeterangan} onValueChange={v => { setFilterKeterangan(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Semua Keterangan" /></SelectTrigger>
                <SelectContent>
                  {KETERANGAN_OPTIONS.map(k => (
                    <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Cari Nama/NIP</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <Input className="pl-9" placeholder="Cari..." value={filterSearch} onChange={e => { setFilterSearch(e.target.value); setPage(1) }} />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead className="hidden md:table-cell">Unit Kerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Jam Masuk</TableHead>
                  <TableHead className="hidden sm:table-cell">Jam Keluar</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-28 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absensiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Belum ada data absensi</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  absensiList.map((absensi, idx) => (
                    <TableRow key={absensi.id} className="hover:bg-blue-50/50">
                      <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(absensi.tanggal)}</TableCell>
                      <TableCell className="whitespace-nowrap">{absensi.nip || '-'}</TableCell>
                      <TableCell className="font-medium">{absensi.namaPegawai}</TableCell>
                      <TableCell className="hidden md:table-cell">{absensi.sekolah?.namaSekolah || absensi.unitKerja}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusPegawaiColor(absensi.statusPegawai)} text-xs`}>
                          {(absensi.statusPegawai || '-').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{absensi.jamMasuk || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{absensi.jamKeluar || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${getKeteranganColor(absensi.keterangan)} text-xs`}>
                          {(absensi.keterangan || '-').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setDetailData(absensi); setShowDetail(true) }}>
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          {absensi.statusValidasi === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditForm(absensi)}>
                                <Pencil className="w-3.5 h-3.5 text-blue-500" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setDeleteId(absensi.id); setShowDelete(true) }}>
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {absensiTotal > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, absensiTotal)} dari {absensiTotal}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Hal {page}/{totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Absensi' : 'Tambah Absensi'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{formError}</div>
            )}
            <div>
              <Label>Tanggal <span className="text-red-500">*</span></Label>
              <Input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} />
            </div>
            <div>
              <Label>Pilih Pegawai <span className="text-red-500">*</span></Label>
              <Select value={formPegawaiId} onValueChange={handlePegawaiSelect} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredPegawai.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nama} - {p.nip || p.nik}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>NIP</Label>
                <Input value={formNip || '-'} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Nama Pegawai</Label>
                <Input value={formNama} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit Kerja</Label>
                <Input
                  value={sekolahList.find(s => s.id === formUnitKerja)?.namaSekolah || '-'}
                  readOnly className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Status Pegawai</Label>
                <Input value={formStatusPegawai || '-'} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jam Masuk {(formKeterangan === 'Hadir' || formKeterangan === 'Terlambat') && <span className="text-red-500">*</span>}</Label>
                <Input type="time" value={formJamMasuk} onChange={e => setFormJamMasuk(e.target.value)} />
              </div>
              <div>
                <Label>Jam Keluar</Label>
                <Input type="time" value={formJamKeluar} onChange={e => setFormJamKeluar(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Keterangan <span className="text-red-500">*</span></Label>
              <Select value={formKeterangan} onValueChange={setFormKeterangan}>
                <SelectTrigger><SelectValue placeholder="Pilih Keterangan" /></SelectTrigger>
                <SelectContent>
                  {KETERANGAN_OPTIONS.map(k => (
                    <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Absensi</DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Tanggal:</span><br /><span className="font-medium">{formatDate(detailData.tanggal)}</span></div>
                <div><span className="text-gray-500">NIP:</span><br /><span className="font-medium">{detailData.nip || '-'}</span></div>
                <div><span className="text-gray-500">Nama:</span><br /><span className="font-medium">{detailData.namaPegawai}</span></div>
                <div><span className="text-gray-500">Unit Kerja:</span><br /><span className="font-medium">{detailData.sekolah?.namaSekolah || detailData.unitKerja}</span></div>
                <div><span className="text-gray-500">Status Pegawai:</span><br /><Badge className={getStatusPegawaiColor(detailData.statusPegawai)}>{(detailData.statusPegawai || '-').replace('_', ' ')}</Badge></div>
                <div><span className="text-gray-500">Keterangan:</span><br /><Badge className={getKeteranganColor(detailData.keterangan)}>{(detailData.keterangan || '-').replace('_', ' ')}</Badge></div>
                <div><span className="text-gray-500">Jam Masuk:</span><br /><span className="font-medium">{detailData.jamMasuk || '-'}</span></div>
                <div><span className="text-gray-500">Jam Keluar:</span><br /><span className="font-medium">{detailData.jamKeluar || '-'}</span></div>
                <div><span className="text-gray-500">Status Validasi:</span><br /><Badge className={detailData.statusValidasi === 'divalidasi' ? 'bg-blue-100 text-blue-800' : detailData.statusValidasi === 'ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{detailData.statusValidasi}</Badge></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Absensi</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus data absensi ini? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
