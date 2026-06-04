'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { ValidasiData } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2, XCircle, Clock, FileCheck, ClipboardList, ChevronLeft, ChevronRight, Filter
} from 'lucide-react'

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

function getStatusColor(status: string): string {
  switch (status) {
    case 'divalidasi': return 'bg-blue-100 text-blue-800'
    case 'ditolak': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getJenisPengajuanColor(jenis: string | null): string {
  switch (jenis) {
    case 'data_baru': return 'bg-blue-100 text-blue-800'
    case 'perubahan_data': return 'bg-amber-100 text-amber-800'
    case 'mutasi': return 'bg-purple-100 text-purple-800'
    case 'pensiun': return 'bg-sky-100 text-sky-800'
    case 'tidak_aktif': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getJenisLabel(jenis: string | null): string {
  switch (jenis) {
    case 'data_baru': return 'Data Baru'
    case 'perubahan_data': return 'Perubahan Data'
    case 'mutasi': return 'Mutasi'
    case 'pensiun': return 'Pensiun'
    case 'tidak_aktif': return 'Tidak Aktif'
    default: return jenis || '-'
  }
}

export default function ValidasiPage() {
  const { user, validasiList, loadValidasi, sekolahList, loadSekolah, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  const [activeTab, setActiveTab] = useState('semua')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSekolah, setFilterSekolah] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Approve/Reject dialog
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [selectedValidasi, setSelectedValidasi] = useState<ValidasiData | null>(null)
  const [catatan, setCatatan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sekolahId = isAdmin ? filterSekolah : (user?.sekolahId || '')

  const load = useCallback(() => {
    const filters: Record<string, string> = {
      page: page.toString(),
      limit: pageSize.toString(),
    }
    if (filterStatus) filters.statusValidasi = filterStatus
    if (sekolahId) filters.sekolahId = sekolahId
    if (activeTab !== 'semua' && activeTab !== 'riwayat') {
      filters.jenisPengajuan = activeTab
    }
    if (activeTab === 'riwayat') {
      filters.statusValidasi = 'divalidasi,ditolak'
    }
    loadValidasi(filters)
  }, [page, filterStatus, sekolahId, activeTab, loadValidasi])

  useEffect(() => { loadSekolah() }, [loadSekolah])
  useEffect(() => { load() }, [load])

  function openActionDialog(validasi: ValidasiData, type: 'approve' | 'reject') {
    setSelectedValidasi(validasi)
    setActionType(type)
    setCatatan('')
    setShowActionDialog(true)
  }

  async function handleAction() {
    if (!selectedValidasi) return
    if (actionType === 'reject' && !catatan.trim()) {
      setNotification({ type: 'error', message: 'Catatan wajib diisi saat menolak pengajuan' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/validasi/${selectedValidasi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusValidasi: actionType === 'approve' ? 'divalidasi' : 'ditolak',
          catatanAdmin: catatan || null,
        }),
      })
      if (!res.ok) throw new Error('Gagal memproses validasi')
      setNotification({
        type: 'success',
        message: actionType === 'approve' ? 'Pengajuan berhasil divalidasi' : 'Pengajuan berhasil ditolak'
      })
      setShowActionDialog(false)
      load()
    } catch {
      setNotification({ type: 'error', message: 'Gagal memproses validasi' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredList = validasiList
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize))
  const paginatedList = filteredList.slice((page - 1) * pageSize, page * pageSize)

  const pendingCount = validasiList.filter(v => v.statusValidasi === 'pending').length
  const validatedCount = validasiList.filter(v => v.statusValidasi === 'divalidasi').length
  const rejectedCount = validasiList.filter(v => v.statusValidasi === 'ditolak').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validasi Data</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola validasi pengajuan data pegawai</p>
        </div>
        <div className="flex gap-3">
          <Card className="border-0 bg-yellow-50">
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-lg font-bold text-yellow-800">{pendingCount}</p>
                <p className="text-xs text-yellow-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-blue-50">
            <CardContent className="p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-blue-800">{validatedCount}</p>
                <p className="text-xs text-blue-600">Divalidasi</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-red-50">
            <CardContent className="p-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-red-800">{rejectedCount}</p>
                <p className="text-xs text-red-600">Ditolak</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="divalidasi">Divalidasi</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <Label className="text-xs mb-1 block">Sekolah</Label>
                <Select value={filterSekolah} onValueChange={v => { setFilterSekolah(v); setPage(1) }}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="Semua Sekolah" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sekolah</SelectItem>
                    {sekolahList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.namaSekolah}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1) }}>
        <TabsList className="bg-blue-50">
          <TabsTrigger value="semua">Semua</TabsTrigger>
          <TabsTrigger value="data_baru">Data Baru</TabsTrigger>
          <TabsTrigger value="perubahan_data">Perubahan Data</TabsTrigger>
          <TabsTrigger value="mutasi">Mutasi</TabsTrigger>
          <TabsTrigger value="pensiun">Pensiun</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Sekolah</TableHead>
                      <TableHead>Jenis Pengajuan</TableHead>
                      <TableHead>Tgl Pengajuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Catatan Admin</TableHead>
                      {isAdmin && <TableHead className="w-36 text-center">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-gray-500">
                          <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Belum ada data validasi</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedList.map((validasi, idx) => (
                        <TableRow key={validasi.id} className="hover:bg-blue-50/50">
                          <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                          <TableCell className="font-medium">{validasi.pegawai?.nama || '-'}</TableCell>
                          <TableCell>{validasi.sekolah?.namaSekolah || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`${getJenisPengajuanColor(validasi.jenisPengajuan)} text-xs`}>
                              {getJenisLabel(validasi.jenisPengajuan)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(validasi.tanggalPengajuan)}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(validasi.statusValidasi)} text-xs`}>
                              {validasi.statusValidasi === 'divalidasi' ? 'Divalidasi' : validasi.statusValidasi === 'ditolak' ? 'Ditolak' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-48 truncate">{validasi.catatanAdmin || '-'}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              {validasi.statusValidasi === 'pending' ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 text-blue-600 hover:bg-blue-50" onClick={() => openActionDialog(validasi, 'approve')}>
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50" onClick={() => openActionDialog(validasi, 'reject')}>
                                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Selesai</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredList.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-gray-500">
                    Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredList.length)} dari {filteredList.length}
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
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
            </DialogTitle>
          </DialogHeader>
          {selectedValidasi && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pegawai:</span>
                  <span className="font-medium">{selectedValidasi.pegawai?.nama || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sekolah:</span>
                  <span className="font-medium">{selectedValidasi.sekolah?.namaSekolah || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jenis:</span>
                  <Badge className={getJenisPengajuanColor(selectedValidasi.jenisPengajuan)}>
                    {getJenisLabel(selectedValidasi.jenisPengajuan)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Catatan {actionType === 'reject' && <span className="text-red-500">*</span>}</Label>
                <Textarea
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder={actionType === 'reject' ? 'Alasan penolakan (wajib)' : 'Catatan tambahan (opsional)'}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>Batal</Button>
            <Button
              onClick={handleAction}
              disabled={submitting || (actionType === 'reject' && !catatan.trim())}
              className={actionType === 'approve' ? 'bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {submitting ? 'Memproses...' : actionType === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
