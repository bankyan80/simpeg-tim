'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { MutasiPegawai } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowRightLeft, Plus, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, FileCheck
} from 'lucide-react'

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  } catch { return '-' }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'disetujui': return 'bg-blue-100 text-blue-800'
    case 'ditolak': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function MutasiPage() {
  const { user, mutasiList, loadMutasi, sekolahList, loadSekolah, pegawaiList, loadPegawai, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  const [activeTab, setActiveTab] = useState('semua')
  const [filterSekolah, setFilterSekolah] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Add mutation dialog
  const [showForm, setShowForm] = useState(false)
  const [formPegawaiId, setFormPegawaiId] = useState('')
  const [formSekolahTujuan, setFormSekolahTujuan] = useState('')
  const [formTanggal, setFormTanggal] = useState('')
  const [formNoSk, setFormNoSk] = useState('')
  const [formKeterangan, setFormKeterangan] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Approve/Reject dialog
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [selectedMutasi, setSelectedMutasi] = useState<MutasiPegawai | null>(null)
  const [actionCatatan, setActionCatatan] = useState('')

  const sekolahId = isAdmin ? filterSekolah : (user?.sekolahId || '')

  const load = useCallback(() => {
    const filters: Record<string, string> = {
      page: page.toString(),
      limit: pageSize.toString(),
    }
    if (sekolahId) filters.sekolahId = sekolahId
    if (activeTab === 'mutasi_masuk') filters.tipe = 'masuk'
    if (activeTab === 'mutasi_keluar') filters.tipe = 'keluar'
    if (activeTab === 'riwayat') filters.status = 'disetujui,ditolak'
    loadMutasi(filters)
  }, [page, sekolahId, activeTab, loadMutasi])

  useEffect(() => { loadSekolah() }, [loadSekolah])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (sekolahId) loadPegawai({ sekolahId, statusPegawai: 'aktif' })
  }, [sekolahId, loadPegawai])

  function openAddForm() {
    setFormPegawaiId('')
    setFormSekolahTujuan('')
    setFormTanggal('')
    setFormNoSk('')
    setFormKeterangan('')
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit() {
    setFormError('')
    if (!formPegawaiId) { setFormError('Pegawai wajib dipilih'); return }
    if (!formSekolahTujuan) { setFormError('Sekolah tujuan wajib dipilih'); return }
    if (!formTanggal) { setFormError('Tanggal mutasi wajib diisi'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/mutasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pegawaiId: formPegawaiId,
          sekolahTujuanId: formSekolahTujuan,
          tanggalMutasi: formTanggal,
          nomorSk: formNoSk || null,
          keterangan: formKeterangan || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menyimpan data' }))
        throw new Error(err.error || 'Gagal menyimpan data')
      }
      setNotification({ type: 'success', message: 'Data mutasi berhasil ditambahkan' })
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  function openActionDialog(mutasi: MutasiPegawai, type: 'approve' | 'reject') {
    setSelectedMutasi(mutasi)
    setActionType(type)
    setActionCatatan('')
    setShowActionDialog(true)
  }

  async function handleAction() {
    if (!selectedMutasi) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/mutasi/${selectedMutasi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionType === 'approve' ? 'disetujui' : 'ditolak' }),
      })
      if (!res.ok) throw new Error('Gagal memproses mutasi')
      setNotification({
        type: 'success',
        message: actionType === 'approve' ? 'Mutasi berhasil disetujui' : 'Mutasi berhasil ditolak'
      })
      setShowActionDialog(false)
      load()
    } catch {
      setNotification({ type: 'error', message: 'Gagal memproses mutasi' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredList = mutasiList
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize))
  const paginatedList = filteredList.slice((page - 1) * pageSize, page * pageSize)

  const pendingCount = mutasiList.filter(m => m.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mutasi Pegawai</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data mutasi pegawai antar sekolah</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button onClick={openAddForm} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
              <Plus className="w-4 h-4 mr-2" /> Tambah Mutasi
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
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
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-800">{mutasiList.length}</p>
              <p className="text-xs text-blue-600">Total Mutasi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {isAdmin && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1) }}>
        <TabsList className="bg-blue-50">
          <TabsTrigger value="semua">Semua</TabsTrigger>
          <TabsTrigger value="mutasi_masuk">Mutasi Masuk</TabsTrigger>
          <TabsTrigger value="mutasi_keluar">Mutasi Keluar</TabsTrigger>
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
                      <TableHead>Sekolah Asal</TableHead>
                      <TableHead>Sekolah Tujuan</TableHead>
                      <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                      <TableHead className="hidden md:table-cell">No SK</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Keterangan</TableHead>
                      {isAdmin && <TableHead className="w-28 text-center">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-12 text-gray-500">
                          <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Belum ada data mutasi</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedList.map((mutasi, idx) => (
                        <TableRow key={mutasi.id} className="hover:bg-blue-50/50">
                          <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                          <TableCell className="font-medium">{mutasi.pegawai?.nama || '-'}</TableCell>
                          <TableCell>{mutasi.sekolahAsal?.namaSekolah || '-'}</TableCell>
                          <TableCell>{mutasi.sekolahTujuan?.namaSekolah || '-'}</TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">{formatDate(mutasi.tanggalMutasi || '')}</TableCell>
                          <TableCell className="hidden md:table-cell">{mutasi.nomorSk || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(mutasi.status)} text-xs`}>
                              {mutasi.status === 'disetujui' ? 'Disetujui' : mutasi.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-32 truncate">{mutasi.keterangan || '-'}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              {mutasi.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 text-blue-600 hover:bg-blue-50 p-1" onClick={() => openActionDialog(mutasi, 'approve')}>
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50 p-1" onClick={() => openActionDialog(mutasi, 'reject')}>
                                    <XCircle className="w-4 h-4" />
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

      {/* Add Mutation Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Mutasi Pegawai</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{formError}</div>
            )}
            <div>
              <Label>Pilih Pegawai <span className="text-red-500">*</span></Label>
              <Select value={formPegawaiId} onValueChange={setFormPegawaiId}>
                <SelectTrigger><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {pegawaiList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nama} - {p.nip || p.nik}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sekolah Tujuan <span className="text-red-500">*</span></Label>
              <Select value={formSekolahTujuan} onValueChange={setFormSekolahTujuan}>
                <SelectTrigger><SelectValue placeholder="Pilih Sekolah Tujuan" /></SelectTrigger>
                <SelectContent>
                  {sekolahList.filter(s => s.id !== sekolahId).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.namaSekolah}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal Mutasi <span className="text-red-500">*</span></Label>
              <Input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} />
            </div>
            <div>
              <Label>Nomor SK</Label>
              <Input value={formNoSk} onChange={e => setFormNoSk(e.target.value)} placeholder="Masukkan nomor SK" />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Textarea value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} placeholder="Keterangan tambahan" rows={3} />
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

      {/* Approve/Reject Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Setujui Mutasi' : 'Tolak Mutasi'}</DialogTitle>
          </DialogHeader>
          {selectedMutasi && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Pegawai:</span>
                <span className="font-medium">{selectedMutasi.pegawai?.nama || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Asal:</span>
                <span className="font-medium">{selectedMutasi.sekolahAsal?.namaSekolah || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tujuan:</span>
                <span className="font-medium">{selectedMutasi.sekolahTujuan?.namaSekolah || '-'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>Batal</Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
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
