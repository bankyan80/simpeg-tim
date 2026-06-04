'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Sekolah, Pegawai } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Building2, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Users, MapPin
} from 'lucide-react'

function getJenjangColor(jenjang: string): string {
  switch (jenjang) {
    case 'SD': return 'bg-blue-100 text-blue-800'
    case 'TK': return 'bg-purple-100 text-purple-800'
    case 'KB/PAUD': return 'bg-pink-100 text-pink-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function SekolahPage() {
  const { user, sekolahList, loadSekolah, pegawaiList, loadPegawai, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  const [page, setPage] = useState(1)
  const pageSize = 10

  // Form dialog
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNpsn, setFormNpsn] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formJenjang, setFormJenjang] = useState('SD')
  const [formKecamatan, setFormKecamatan] = useState('Lemahabang')
  const [formDesa, setFormDesa] = useState('')
  const [formAlamat, setFormAlamat] = useState('')
  const [formKepsek, setFormKepsek] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Detail dialog
  const [showDetail, setShowDetail] = useState(false)
  const [detailSekolah, setDetailSekolah] = useState<Sekolah | null>(null)

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(() => { loadSekolah() }, [loadSekolah])
  useEffect(() => { load() }, [load])

  function openAddForm() {
    setEditingId(null)
    setFormNpsn('')
    setFormNama('')
    setFormJenjang('SD')
    setFormKecamatan('Lemahabang')
    setFormDesa('')
    setFormAlamat('')
    setFormKepsek('')
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(sekolah: Sekolah) {
    setEditingId(sekolah.id)
    setFormNpsn(sekolah.npsn)
    setFormNama(sekolah.namaSekolah)
    setFormJenjang(sekolah.jenjang)
    setFormKecamatan(sekolah.kecamatan)
    setFormDesa(sekolah.desa || '')
    setFormAlamat(sekolah.alamat || '')
    setFormKepsek(sekolah.kepalaSekolah || '')
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit() {
    setFormError('')
    if (!formNpsn) { setFormError('NPSN wajib diisi'); return }
    if (!formNama) { setFormError('Nama Sekolah wajib diisi'); return }
    if (!formJenjang) { setFormError('Jenjang wajib dipilih'); return }

    setSubmitting(true)
    try {
      const body = {
        npsn: formNpsn,
        namaSekolah: formNama,
        jenjang: formJenjang,
        kecamatan: formKecamatan,
        desa: formDesa || null,
        alamat: formAlamat || null,
        kepalaSekolah: formKepsek || null,
      }

      let res: Response
      if (editingId) {
        res = await fetch(`/api/sekolah/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/sekolah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menyimpan data' }))
        throw new Error(err.error || 'Gagal menyimpan data')
      }

      setNotification({ type: 'success', message: editingId ? 'Sekolah berhasil diperbarui' : 'Sekolah berhasil ditambahkan' })
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
      const res = await fetch(`/api/sekolah/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')
      setNotification({ type: 'success', message: 'Sekolah berhasil dihapus' })
      setShowDelete(false)
      setDeleteId(null)
      load()
    } catch {
      setNotification({ type: 'error', message: 'Gagal menghapus sekolah. Pastikan tidak ada pegawai terkait.' })
    }
  }

  function openDetail(sekolah: Sekolah) {
    setDetailSekolah(sekolah)
    setShowDetail(true)
    loadPegawai({ sekolahId: sekolah.id })
  }

  const totalPages = Math.max(1, Math.ceil(sekolahList.length / pageSize))
  const paginatedList = sekolahList.slice((page - 1) * pageSize, page * pageSize)

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-600">Akses Terbatas</h2>
          <p className="text-sm text-gray-500 mt-1">Halaman ini hanya dapat diakses oleh Admin Kecamatan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sekolah</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data sekolah di wilayah kecamatan</p>
        </div>
        <Button onClick={openAddForm} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
          <Plus className="w-4 h-4 mr-2" /> Tambah Sekolah
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-800">{sekolahList.length}</p>
              <p className="text-xs text-blue-600">Total Sekolah</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-800">{sekolahList.filter(s => s.jenjang === 'SD').length}</p>
              <p className="text-xs text-blue-600">Sekolah SD</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-purple-50">
          <CardContent className="p-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-lg font-bold text-purple-800">{sekolahList.filter(s => s.jenjang === 'TK').length}</p>
              <p className="text-xs text-purple-600">Sekolah TK</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-pink-50">
          <CardContent className="p-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-600" />
            <div>
              <p className="text-lg font-bold text-pink-800">{sekolahList.filter(s => s.jenjang === 'KB/PAUD').length}</p>
              <p className="text-xs text-pink-600">KB/PAUD</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>NPSN</TableHead>
                  <TableHead>Nama Sekolah</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead className="hidden sm:table-cell">Kecamatan</TableHead>
                  <TableHead className="hidden md:table-cell">Desa</TableHead>
                  <TableHead className="hidden lg:table-cell">Kepala Sekolah</TableHead>
                  <TableHead>Jml Pegawai</TableHead>
                  <TableHead className="w-28 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Belum ada data sekolah</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedList.map((sekolah, idx) => (
                    <TableRow key={sekolah.id} className="hover:bg-blue-50/50">
                      <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="font-mono">{sekolah.npsn}</TableCell>
                      <TableCell className="font-medium">{sekolah.namaSekolah}</TableCell>
                      <TableCell>
                        <Badge className={`${getJenjangColor(sekolah.jenjang)} text-xs`}>{sekolah.jenjang}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{sekolah.kecamatan}</TableCell>
                      <TableCell className="hidden md:table-cell">{sekolah.desa || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{sekolah.kepalaSekolah || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          {sekolah._count?.pegawai ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openDetail(sekolah)}>
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditForm(sekolah)}>
                            <Pencil className="w-3.5 h-3.5 text-blue-500" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setDeleteId(sekolah.id); setShowDelete(true) }}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {sekolahList.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sekolahList.length)} dari {sekolahList.length}
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
            <DialogTitle>{editingId ? 'Edit Sekolah' : 'Tambah Sekolah'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>NPSN <span className="text-red-500">*</span></Label>
                <Input value={formNpsn} onChange={e => setFormNpsn(e.target.value)} placeholder="NPSN" />
              </div>
              <div>
                <Label>Jenjang <span className="text-red-500">*</span></Label>
                <Select value={formJenjang} onValueChange={setFormJenjang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="TK">TK</SelectItem>
                    <SelectItem value="KB/PAUD">KB/PAUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nama Sekolah <span className="text-red-500">*</span></Label>
              <Input value={formNama} onChange={e => setFormNama(e.target.value)} placeholder="Nama Sekolah" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kecamatan</Label>
                <Input value={formKecamatan} onChange={e => setFormKecamatan(e.target.value)} />
              </div>
              <div>
                <Label>Desa</Label>
                <Input value={formDesa} onChange={e => setFormDesa(e.target.value)} placeholder="Nama Desa" />
              </div>
            </div>
            <div>
              <Label>Alamat</Label>
              <Input value={formAlamat} onChange={e => setFormAlamat(e.target.value)} placeholder="Alamat lengkap" />
            </div>
            <div>
              <Label>Kepala Sekolah</Label>
              <Input value={formKepsek} onChange={e => setFormKepsek(e.target.value)} placeholder="Nama Kepala Sekolah" />
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Sekolah</DialogTitle>
          </DialogHeader>
          {detailSekolah && (
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">NPSN:</span><br /><span className="font-mono font-medium">{detailSekolah.npsn}</span></div>
                  <div><span className="text-gray-500">Nama Sekolah:</span><br /><span className="font-medium">{detailSekolah.namaSekolah}</span></div>
                  <div><span className="text-gray-500">Jenjang:</span><br /><Badge className={getJenjangColor(detailSekolah.jenjang)}>{detailSekolah.jenjang}</Badge></div>
                  <div><span className="text-gray-500">Kecamatan:</span><br /><span className="font-medium">{detailSekolah.kecamatan}</span></div>
                  <div><span className="text-gray-500">Desa:</span><br /><span className="font-medium">{detailSekolah.desa || '-'}</span></div>
                  <div><span className="text-gray-500">Kepala Sekolah:</span><br /><span className="font-medium">{detailSekolah.kepalaSekolah || '-'}</span></div>
                  <div><span className="text-gray-500">Alamat:</span><br /><span className="font-medium">{detailSekolah.alamat || '-'}</span></div>
                  <div><span className="text-gray-500">Jumlah Pegawai:</span><br /><span className="font-medium">{detailSekolah._count?.pegawai ?? 0}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Daftar Pegawai</h3>
                {pegawaiList.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">Belum ada pegawai di sekolah ini</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Jabatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pegawaiList.slice(0, 20).map((p, idx) => (
                          <TableRow key={p.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{p.nama}</TableCell>
                            <TableCell>{p.nip || '-'}</TableCell>
                            <TableCell><Badge className="text-xs bg-blue-100 text-blue-800">{(p.statusKepegawaian || '-').replace('_', ' ')}</Badge></TableCell>
                            <TableCell>{p.jabatan || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Sekolah</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus sekolah ini? Semua data terkait akan terpengaruh.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
