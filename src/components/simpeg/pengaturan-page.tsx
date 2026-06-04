'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Sekolah, User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  Settings, Building2, Users as UsersIcon, Plus, Pencil, Trash2, Save, Download, Calendar
} from 'lucide-react'

export default function PengaturanPage() {
  const { user, sekolahList, loadSekolah, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  // Tahun Data
  const [tahunData, setTahunData] = useState(new Date().getFullYear().toString())

  // Operator accounts (mock - fetched from API)
  const [operators, setOperators] = useState<User[]>([])
  const [loadingOps, setLoadingOps] = useState(false)

  // Operator form dialog
  const [showOpForm, setShowOpForm] = useState(false)
  const [editingOpId, setEditingOpId] = useState<string | null>(null)
  const [formOpNama, setFormOpNama] = useState('')
  const [formOpEmail, setFormOpEmail] = useState('')
  const [formOpSekolah, setFormOpSekolah] = useState('')
  const [formOpStatus, setFormOpStatus] = useState('aktif')
  const [formOpError, setFormOpError] = useState('')
  const [submittingOp, setSubmittingOp] = useState(false)

  // Delete dialog
  const [showDeleteOp, setShowDeleteOp] = useState(false)
  const [deleteOpId, setDeleteOpId] = useState<string | null>(null)

  const loadOperators = useCallback(async () => {
    setLoadingOps(true)
    try {
      const res = await fetch('/api/user?role=operator')
      if (res.ok) {
        const data = await res.json()
        setOperators(data.data ?? data)
      }
    } catch {
      // ignore
    } finally {
      setLoadingOps(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadSekolah()
      loadOperators()
      // Load tahun data from pengaturan
      fetch('/api/pengaturan?key=tahun_data').then(r => r.json()).then(d => {
        if (d?.value) setTahunData(d.value)
      }).catch(() => {})
    }
  }, [isAdmin, loadSekolah, loadOperators])

  async function saveTahunData() {
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'tahun_data', value: tahunData }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setNotification({ type: 'success', message: 'Tahun data berhasil disimpan' })
    } catch {
      setNotification({ type: 'error', message: 'Gagal menyimpan tahun data' })
    }
  }

  function openAddOperator() {
    setEditingOpId(null)
    setFormOpNama('')
    setFormOpEmail('')
    setFormOpSekolah('')
    setFormOpStatus('aktif')
    setFormOpError('')
    setShowOpForm(true)
  }

  function openEditOperator(op: User) {
    setEditingOpId(op.id)
    setFormOpNama(op.nama)
    setFormOpEmail(op.email)
    setFormOpSekolah(op.sekolahId || '')
    setFormOpStatus(op.status)
    setFormOpError('')
    setShowOpForm(true)
  }

  async function handleOpSubmit() {
    setFormOpError('')
    if (!formOpNama) { setFormOpError('Nama wajib diisi'); return }
    if (!formOpEmail) { setFormOpError('Email wajib diisi'); return }
    if (!formOpSekolah) { setFormOpError('Sekolah wajib dipilih'); return }

    setSubmittingOp(true)
    try {
      const body = {
        nama: formOpNama,
        email: formOpEmail,
        role: 'operator',
        sekolahId: formOpSekolah,
        status: formOpStatus,
      }

      let res: Response
      if (editingOpId) {
        res = await fetch(`/api/user/${editingOpId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menyimpan data' }))
        throw new Error(err.error || 'Gagal menyimpan data')
      }

      setNotification({ type: 'success', message: editingOpId ? 'Operator berhasil diperbarui' : 'Operator berhasil ditambahkan' })
      setShowOpForm(false)
      loadOperators()
    } catch (err) {
      setFormOpError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setSubmittingOp(false)
    }
  }

  async function handleDeleteOp() {
    if (!deleteOpId) return
    try {
      const res = await fetch(`/api/user/${deleteOpId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      setNotification({ type: 'success', message: 'Operator berhasil dihapus' })
      setShowDeleteOp(false)
      setDeleteOpId(null)
      loadOperators()
    } catch {
      setNotification({ type: 'error', message: 'Gagal menghapus operator' })
    }
  }

  function handleBackup() {
    setNotification({ type: 'info', message: 'Fitur backup data akan segera tersedia' })
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-600">Akses Terbatas</h2>
          <p className="text-sm text-gray-500 mt-1">Halaman ini hanya dapat diakses oleh Admin Kecamatan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengaturan sistem SIMPEG Kecamatan</p>
      </div>

      {/* Tahun Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-600" /> Tahun Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Label className="text-xs mb-1 block">Tahun Data Aktif</Label>
              <Select value={tahunData} onValueChange={setTahunData}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveTahunData} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
              <Save className="w-4 h-4 mr-2" /> Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Sekolah */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-blue-600" /> Data Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">
            Kelola data sekolah di wilayah kecamatan. Total: <span className="font-semibold text-gray-900">{sekolahList.length} sekolah</span>
          </p>
          <Button variant="outline" onClick={() => useSimpegStore.getState().setCurrentPage('sekolah')} className="border-blue-300 text-blue-700">
            Kelola Data Sekolah →
          </Button>
        </CardContent>
      </Card>

      {/* Akun Operator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersIcon className="w-5 h-5 text-blue-600" /> Akun Operator
            </CardTitle>
            <Button onClick={openAddOperator} size="sm" className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
              <Plus className="w-4 h-4 mr-2" /> Tambah Operator
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sekolah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <UsersIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Belum ada akun operator</p>
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((op, idx) => (
                  <TableRow key={op.id} className="hover:bg-blue-50/50">
                    <TableCell className="text-center">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{op.nama}</TableCell>
                    <TableCell>{op.email}</TableCell>
                    <TableCell>{op.sekolah?.namaSekolah || '-'}</TableCell>
                    <TableCell>
                      <Badge className={op.status === 'aktif' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                        {op.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditOperator(op)}>
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setDeleteOpId(op.id); setShowDeleteOp(true) }}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

      {/* Backup Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-blue-600" /> Backup Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">Backup seluruh data sistem untuk keamanan data.</p>
          <Button variant="outline" onClick={handleBackup} className="border-blue-300 text-blue-700">
            <Download className="w-4 h-4 mr-2" /> Backup Data Sekarang
          </Button>
        </CardContent>
      </Card>

      {/* Operator Form Dialog */}
      <Dialog open={showOpForm} onOpenChange={setShowOpForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOpId ? 'Edit Operator' : 'Tambah Operator'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formOpError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{formOpError}</div>
            )}
            <div>
              <Label>Nama <span className="text-red-500">*</span></Label>
              <Input value={formOpNama} onChange={e => setFormOpNama(e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div>
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formOpEmail} onChange={e => setFormOpEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
            <div>
              <Label>Sekolah <span className="text-red-500">*</span></Label>
              <Select value={formOpSekolah} onValueChange={setFormOpSekolah}>
                <SelectTrigger><SelectValue placeholder="Pilih Sekolah" /></SelectTrigger>
                <SelectContent>
                  {sekolahList.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.namaSekolah}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formOpStatus} onValueChange={setFormOpStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpForm(false)}>Batal</Button>
            <Button onClick={handleOpSubmit} disabled={submittingOp} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
              {submittingOp ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Operator Dialog */}
      <Dialog open={showDeleteOp} onOpenChange={setShowDeleteOp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Operator</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus akun operator ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteOp(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteOp}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
