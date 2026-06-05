'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Pegawai, Sekolah } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Printer,
  X,
  Loader2,
  User,
  Users,
  GraduationCap,
  Award,
  CalendarCheck,
  FileText,
  Briefcase,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_KEPEGAWAIAN_OPTIONS = [
  'PNS',
  'PPPK',
  'PPPK_Paruh_Waktu',
  'Honorer',
  'GTY',
  'GTT',
  'Tenaga_Administrasi',
  'Penjaga_Sekolah',
  'Kepala_Sekolah',
] as const

const STATUS_KEPEGAWAIAN_LABELS: Record<string, string> = {
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

const PENDIDIKAN_OPTIONS = ['S2', 'S1', 'D4', 'D3', 'D2', 'SMA', 'SMP'] as const

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] as const

// ---------------------------------------------------------------------------
// Form type
// ---------------------------------------------------------------------------

interface PegawaiFormData {
  nik: string
  nip: string
  nuptk: string
  nama: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  agama: string
  alamat: string
  noHp: string
  email: string
  sekolahId: string
  jabatan: string
  jenisPegawai: string
  statusKepegawaian: string
  statusPegawai: string
  tmtTugas: string
  tmtSekolah: string
  tmtJabatan: string
  tmtPangkat: string
  masaKerjaTahun: number
  masaKerjaBulan: number
  pangkat: string
  golongan: string
  pendidikanTerakhir: string
  jurusan: string
  sertifikasi: string
  nomorSertifikat: string
  bidangSertifikasi: string
  tahunSertifikasi: string
  nrg: string
  statusTpg: string
}

const emptyForm: PegawaiFormData = {
  nik: '',
  nip: '',
  nuptk: '',
  nama: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: '',
  agama: '',
  alamat: '',
  noHp: '',
  email: '',
  sekolahId: '',
  jabatan: '',
  jenisPegawai: '',
  statusKepegawaian: '',
  statusPegawai: 'aktif',
  tmtTugas: '',
  tmtSekolah: '',
  tmtJabatan: '',
  tmtPangkat: '',
  masaKerjaTahun: 0,
  masaKerjaBulan: 0,
  pangkat: '',
  golongan: '',
  pendidikanTerakhir: '',
  jurusan: '',
  sertifikasi: '',
  nomorSertifikat: '',
  bidangSertifikasi: '',
  tahunSertifikasi: '',
  nrg: '',
  statusTpg: '',
}

function pegawaiToForm(p: Pegawai): PegawaiFormData {
  return {
    nik: p.nik ?? '',
    nip: p.nip ?? '',
    nuptk: p.nuptk ?? '',
    nama: p.nama ?? '',
    tempatLahir: p.tempatLahir ?? '',
    tanggalLahir: p.tanggalLahir ? new Date(p.tanggalLahir).toISOString().split('T')[0] : '',
    jenisKelamin: p.jenisKelamin ?? '',
    agama: p.agama ?? '',
    alamat: p.alamat ?? '',
    noHp: p.noHp ?? '',
    email: p.email ?? '',
    sekolahId: p.sekolahId ?? '',
    jabatan: p.jabatan ?? '',
    jenisPegawai: p.jenisPegawai ?? '',
    statusKepegawaian: p.statusKepegawaian ?? '',
    statusPegawai: p.statusPegawai ?? 'aktif',
    tmtTugas: p.tmtTugas ? new Date(p.tmtTugas).toISOString().split('T')[0] : '',
    tmtSekolah: p.tmtSekolah ? new Date(p.tmtSekolah).toISOString().split('T')[0] : '',
    tmtJabatan: p.tmtJabatan ? new Date(p.tmtJabatan).toISOString().split('T')[0] : '',
    tmtPangkat: p.tmtPangkat ? new Date(p.tmtPangkat).toISOString().split('T')[0] : '',
    masaKerjaTahun: p.masaKerjaTahun ?? 0,
    masaKerjaBulan: p.masaKerjaBulan ?? 0,
    pangkat: p.pangkat ?? '',
    golongan: p.golongan ?? '',
    pendidikanTerakhir: p.pendidikanTerakhir ?? '',
    jurusan: p.jurusan ?? '',
    sertifikasi: p.sertifikasi ?? '',
    nomorSertifikat: p.nomorSertifikat ?? '',
    bidangSertifikasi: p.bidangSertifikasi ?? '',
    tahunSertifikasi: p.tahunSertifikasi ?? '',
    nrg: p.nrg ?? '',
    statusTpg: p.statusTpg ?? '',
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PegawaiPage() {
  const {
    user,
    pegawaiList,
    pegawaiTotal,
    loadPegawai,
    currentPegawai,
    loadPegawaiDetail,
    setCurrentPage,
    setShowPegawaiForm,
    sekolahList,
    loadSekolah,
    setNotification,
  } = useSimpegStore()

  const isAdmin = user?.role === 'admin_kecamatan'
  const sekolahId = user?.sekolahId ?? ''

  // ---- List state ----
  const [search, setSearch] = useState('')
  const [filterJenisPegawai, setFilterJenisPegawai] = useState('')
  const [filterStatusKepegawaian, setFilterStatusKepegawaian] = useState('')
  const [filterStatusAktif, setFilterStatusAktif] = useState('')
  const [filterSekolahId, setFilterSekolahId] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  // ---- Detail view state ----
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState('identitas')

  // ---- Form dialog state ----
  const [formOpen, setFormOpen] = useState(false)
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null)
  const [formData, setFormData] = useState<PegawaiFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // ---- Delete dialog ----
  const [deleteTarget, setDeleteTarget] = useState<Pegawai | null>(null)

  // ---- Riwayat form dialog ----
  const [riwayatFormJenis, setRiwayatFormJenis] = useState('')
  const [riwayatFormOpen, setRiwayatFormOpen] = useState(false)
  const [riwayatForm, setRiwayatForm] = useState<Record<string, string>>({})

  // ---- Dokumen form ----
  const [dokumenFormOpen, setDokumenFormOpen] = useState(false)
  const [dokumenForm, setDokumenForm] = useState({ jenisDokumen: '', namaFile: '', urlFile: '' })

  // ---- Riwayat/Dokumen delete ----
  const [deleteRiwayatTarget, setDeleteRiwayatTarget] = useState<{ id: string; jenis: string } | null>(null)
  const [deleteDokumenTarget, setDeleteDokumenTarget] = useState<string | null>(null)

  // =====================================================================
  // DATA FETCHING
  // =====================================================================

  const fetchPegawai = useCallback(async () => {
    const filters: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    }
    if (!isAdmin && sekolahId) {
      filters.sekolahId = sekolahId
    } else if (isAdmin && filterSekolahId) {
      filters.sekolahId = filterSekolahId
    }
    if (search) filters.search = search
    if (filterJenisPegawai) filters.jenisPegawai = filterJenisPegawai
    if (filterStatusKepegawaian) filters.statusKepegawaian = filterStatusKepegawaian
    if (filterStatusAktif) filters.statusPegawai = filterStatusAktif
    await loadPegawai(filters)
  }, [isAdmin, sekolahId, page, search, filterJenisPegawai, filterStatusKepegawaian, filterStatusAktif, filterSekolahId, loadPegawai])

  useEffect(() => {
    fetchPegawai()
  }, [fetchPegawai])

  useEffect(() => {
    if (sekolahList.length === 0) loadSekolah()
  }, [sekolahList.length, loadSekolah])

  // Load detail when selected
  useEffect(() => {
    if (selectedPegawaiId) {
      loadPegawaiDetail(selectedPegawaiId)
    }
  }, [selectedPegawaiId, loadPegawaiDetail])

  // =====================================================================
  // FORM HANDLERS
  // =====================================================================

  const openAddForm = () => {
    setEditingPegawai(null)
    setFormData({
      ...emptyForm,
      sekolahId: isAdmin ? '' : sekolahId,
      statusPegawai: 'aktif',
    })
    setFormOpen(true)
  }

  const openEditForm = (p: Pegawai) => {
    setEditingPegawai(p)
    setFormData(pegawaiToForm(p))
    setFormOpen(true)
  }

  const handleFormChange = (field: keyof PegawaiFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateTahunPensiun = (tanggalLahir: string, jenisPegawai: string): number | null => {
    if (!tanggalLahir) return null
    const birthYear = new Date(tanggalLahir).getFullYear()
    const retirementAge = jenisPegawai === 'Guru' ? 60 : 58
    return birthYear + retirementAge
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.nik || !formData.nama || !formData.sekolahId) {
      setNotification({ type: 'error', message: 'NIK, Nama, dan Sekolah wajib diisi' })
      return
    }

    setSubmitting(true)
    try {
      const body = {
        ...formData,
        userId: user?.id,
      }

      const res = editingPegawai
        ? await fetch(`/api/pegawai/${editingPegawai.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/pegawai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan data')
      }

      setNotification({
        type: 'success',
        message: editingPegawai
          ? `Data ${formData.nama} berhasil diperbarui`
          : `Pegawai ${formData.nama} berhasil ditambahkan`,
      })
      setFormOpen(false)
      fetchPegawai()
    } catch (e) {
      setNotification({
        type: 'error',
        message: e instanceof Error ? e.message : 'Gagal menyimpan data',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/pegawai/${deleteTarget.id}?userId=${user?.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      setNotification({ type: 'success', message: `Pegawai ${deleteTarget.nama} berhasil dinonaktifkan` })
      setDeleteTarget(null)
      fetchPegawai()
    } catch {
      setNotification({ type: 'error', message: 'Gagal menonaktifkan pegawai' })
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setFilterJenisPegawai('')
    setFilterStatusKepegawaian('')
    setFilterStatusAktif('')
    setFilterSekolahId('')
    setPage(1)
  }

  const totalPages = Math.ceil(pegawaiTotal / limit)

  // =====================================================================
  // RIWAYAT FORM HANDLERS
  // =====================================================================

  const openRiwayatForm = (jenis: string) => {
    setRiwayatFormJenis(jenis)
    setRiwayatForm({})
    setRiwayatFormOpen(true)
  }

  const handleRiwayatSubmit = async () => {
    if (!currentPegawai) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/riwayat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...riwayatForm, jenis: riwayatFormJenis, pegawaiId: currentPegawai.id, userId: user?.id }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setNotification({ type: 'success', message: 'Riwayat berhasil ditambahkan' })
      setRiwayatFormOpen(false)
      loadPegawaiDetail(currentPegawai.id)
    } catch {
      setNotification({ type: 'error', message: 'Gagal menyimpan riwayat' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRiwayat = async () => {
    if (!deleteRiwayatTarget || !currentPegawai) return
    try {
      const res = await fetch(`/api/riwayat/${deleteRiwayatTarget.id}?jenis=${deleteRiwayatTarget.jenis}&userId=${user?.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      setDeleteRiwayatTarget(null)
      loadPegawaiDetail(currentPegawai.id)
    } catch {
      setNotification({ type: 'error', message: 'Gagal menghapus riwayat' })
    }
  }

  // =====================================================================
  // DOKUMEN FORM HANDLERS
  // =====================================================================

  const handleDokumenSubmit = async () => {
    if (!currentPegawai) return
    if (!dokumenForm.jenisDokumen || !dokumenForm.namaFile) {
      setNotification({ type: 'error', message: 'Jenis dokumen dan nama file wajib diisi' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/dokumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dokumenForm, pegawaiId: currentPegawai.id, userId: user?.id }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setNotification({ type: 'success', message: 'Dokumen berhasil ditambahkan' })
      setDokumenFormOpen(false)
      setDokumenForm({ jenisDokumen: '', namaFile: '', urlFile: '' })
      loadPegawaiDetail(currentPegawai.id)
    } catch {
      setNotification({ type: 'error', message: 'Gagal menyimpan dokumen' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDokumen = async () => {
    if (!deleteDokumenTarget || !currentPegawai) return
    try {
      const res = await fetch(`/api/dokumen/${deleteDokumenTarget}?userId=${user?.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      setDeleteDokumenTarget(null)
      loadPegawaiDetail(currentPegawai.id)
    } catch {
      setNotification({ type: 'error', message: 'Gagal menghapus dokumen' })
    }
  }

  // =====================================================================
  // DETAIL VIEW
  // =====================================================================

  if (selectedPegawaiId && currentPegawai) {
    const p = currentPegawai
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPegawaiId(null)
                setDetailTab('identitas')
              }}
            >
              <ArrowLeft className="size-4" /> Kembali
            </Button>
            <div>
              <h2 className="text-xl font-bold text-blue-800">{p.nama}</h2>
              <p className="text-sm text-muted-foreground">
                NIK: {p.nik} {p.nip ? `| NIP: ${p.nip}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-blue-300 text-blue-700"
            >
              <Printer className="size-4" /> Cetak Biodata
            </Button>
            <Button
              size="sm"
              onClick={() => openEditForm(p)}
              className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Pencil className="size-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteTarget(p)}
            >
              <Trash2 className="size-4" /> Hapus
            </Button>
          </div>
        </div>

        {/* Tabbed Detail */}
        <Tabs value={detailTab} onValueChange={setDetailTab}>
          <ScrollArea className="w-full">
            <TabsList className="w-max">
              <TabsTrigger value="identitas"><User className="size-3.5 mr-1" /> Identitas</TabsTrigger>
              <TabsTrigger value="kepegawaian"><Briefcase className="size-3.5 mr-1" /> Kepegawaian</TabsTrigger>
              <TabsTrigger value="pangkat"><Award className="size-3.5 mr-1" /> Pangkat/Gol.</TabsTrigger>
              <TabsTrigger value="pendidikan"><GraduationCap className="size-3.5 mr-1" /> Pendidikan</TabsTrigger>
              <TabsTrigger value="sertifikasi"><Award className="size-3.5 mr-1" /> Sertifikasi</TabsTrigger>
              <TabsTrigger value="bup"><CalendarCheck className="size-3.5 mr-1" /> BUP/Pensiun</TabsTrigger>
              <TabsTrigger value="riwayat"><FileText className="size-3.5 mr-1" /> Riwayat</TabsTrigger>
              <TabsTrigger value="dokumen"><FileText className="size-3.5 mr-1" /> Dokumen</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Tab 1: Identitas */}
          <TabsContent value="identitas">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Identitas Pegawai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <DetailField label="NIK" value={p.nik} />
                  <DetailField label="NIP" value={p.nip} />
                  <DetailField label="NUPTK" value={p.nuptk} />
                  <DetailField label="Nama Lengkap" value={p.nama} />
                  <DetailField label="Tempat Lahir" value={p.tempatLahir} />
                  <DetailField label="Tanggal Lahir" value={p.tanggalLahir ? new Date(p.tanggalLahir).toLocaleDateString('id-ID') : '-'} />
                  <DetailField label="Jenis Kelamin" value={p.jenisKelamin === 'L' ? 'Laki-laki' : p.jenisKelamin === 'P' ? 'Perempuan' : '-'} />
                  <DetailField label="Agama" value={p.agama} />
                  <DetailField label="Nomor HP" value={p.noHp} />
                  <DetailField label="Email" value={p.email} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <DetailField label="Alamat" value={p.alamat} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Kepegawaian */}
          <TabsContent value="kepegawaian">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Data Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <DetailField label="Sekolah/Unit Kerja" value={p.sekolah?.namaSekolah ?? '-'} />
                  <DetailField label="Jabatan" value={p.jabatan} />
                  <DetailField label="Jenis Pegawai" value={p.jenisPegawai} />
                  <DetailField label="Status Kepegawaian" value={STATUS_KEPEGAWAIAN_LABELS[p.statusKepegawaian ?? ''] ?? p.statusKepegawaian} />
                  <DetailField label="Status Aktif" value={
                    p.statusPegawai === 'aktif' ? 'Aktif' :
                    p.statusPegawai === 'tidak_aktif' ? 'Tidak Aktif' :
                    p.statusPegawai === 'pensiun' ? 'Pensiun' :
                    p.statusPegawai === 'mutasi' ? 'Mutasi' : '-'
                  } />
                  <DetailField label="TMT Tugas" value={p.tmtTugas ? new Date(p.tmtTugas).toLocaleDateString('id-ID') : '-'} />
                  <DetailField label="TMT Sekolah" value={p.tmtSekolah ? new Date(p.tmtSekolah).toLocaleDateString('id-ID') : '-'} />
                  <DetailField label="TMT Jabatan" value={p.tmtJabatan ? new Date(p.tmtJabatan).toLocaleDateString('id-ID') : '-'} />
                  <DetailField label="Masa Kerja" value={`${p.masaKerjaTahun} Tahun ${p.masaKerjaBulan} Bulan`} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Pangkat/Golongan */}
          <TabsContent value="pangkat">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Pangkat & Golongan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mb-6">
                  <DetailField label="Pangkat" value={p.pangkat} />
                  <DetailField label="Golongan/Ruang" value={p.golongan} />
                  <DetailField label="TMT Pangkat" value={p.tmtPangkat ? new Date(p.tmtPangkat).toLocaleDateString('id-ID') : '-'} />
                </div>

                {/* Riwayat Pangkat */}
                {p.riwayatPangkat && p.riwayatPangkat.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-3">Riwayat Pangkat</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pangkat</TableHead>
                            <TableHead>Golongan</TableHead>
                            <TableHead>TMT</TableHead>
                            <TableHead>Nomor SK</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.riwayatPangkat.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.pangkat ?? '-'}</TableCell>
                            <TableCell>{r.golongan ?? '-'}</TableCell>
                            <TableCell>{r.tmtPangkat ? new Date(r.tmtPangkat).toLocaleDateString('id-ID') : '-'}</TableCell>
                            <TableCell>{r.nomorSk ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Pendidikan */}
          <TabsContent value="pendidikan">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Pendidikan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                  <DetailField label="Pendidikan Terakhir" value={p.pendidikanTerakhir} />
                  <DetailField label="Jurusan" value={p.jurusan} />
                </div>

                {/* Riwayat Pendidikan */}
                {p.riwayatPendidikan && p.riwayatPendidikan.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-3">Riwayat Pendidikan</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Jenjang</TableHead>
                            <TableHead>Jurusan</TableHead>
                            <TableHead>Nama PT/Sekolah</TableHead>
                            <TableHead>Tahun Lulus</TableHead>
                            <TableHead>No. Ijazah</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.riwayatPendidikan.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.jenjang ?? '-'}</TableCell>
                            <TableCell>{r.jurusan ?? '-'}</TableCell>
                            <TableCell>{r.namaSekolahKampus ?? '-'}</TableCell>
                            <TableCell>{r.tahunLulus ?? '-'}</TableCell>
                            <TableCell>{r.nomorIjazah ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Sertifikasi */}
          <TabsContent value="sertifikasi">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Sertifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mb-6">
                  <DetailField label="Status Sertifikasi" value={p.sertifikasi} />
                  <DetailField label="Nomor Sertifikat" value={p.nomorSertifikat} />
                  <DetailField label="Bidang Sertifikasi" value={p.bidangSertifikasi} />
                  <DetailField label="Tahun Sertifikasi" value={p.tahunSertifikasi} />
                  <DetailField label="NRG" value={p.nrg} />
                  <DetailField label="Status TPG" value={p.statusTpg} />
                </div>

                {/* Riwayat Sertifikasi */}
                {p.riwayatSertifikasi && p.riwayatSertifikasi.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-3">Riwayat Sertifikasi</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Nomor</TableHead>
                            <TableHead>Bidang</TableHead>
                            <TableHead>Tahun</TableHead>
                            <TableHead>NRG</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.riwayatSertifikasi.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.statusSertifikasi ?? '-'}</TableCell>
                              <TableCell>{r.nomorSertifikat ?? '-'}</TableCell>
                              <TableCell>{r.bidangSertifikasi ?? '-'}</TableCell>
                              <TableCell>{r.tahunSertifikasi ?? '-'}</TableCell>
                              <TableCell>{r.nrg ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: BUP/Pensiun */}
          <TabsContent value="bup">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">BUP / Pensiun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <DetailField label="Tanggal Lahir" value={p.tanggalLahir ? new Date(p.tanggalLahir).toLocaleDateString('id-ID') : '-'} />
                  <DetailField
                    label="Usia Saat Ini"
                    value={
                      p.tanggalLahir
                        ? `${Math.floor((Date.now() - new Date(p.tanggalLahir).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} Tahun`
                        : '-'
                    }
                  />
                  <DetailField label="BUP" value={p.jenisPegawai === 'Guru' ? '60 Tahun' : '58 Tahun'} />
                  <DetailField label="Tahun Pensiun" value={p.tahunPensiun?.toString() ?? '-'} />
                  <DetailField
                    label="Status BUP"
                    value={
                      p.statusBup === 'aktif' ? 'Aktif' :
                      p.statusBup === 'akan_pensiun' ? 'Akan Pensiun' :
                      p.statusBup === 'sudah_pensiun' ? 'Sudah Pensiun' : '-'
                    }
                  />
                  <DetailField label="Keterangan" value={p.keteranganBup} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 7: Riwayat */}
          <TabsContent value="riwayat">
            <div className="space-y-6">
              {/* Riwayat Jabatan */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-blue-800">Riwayat Jabatan</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openRiwayatForm('jabatan')} className="border-blue-300 text-blue-700">
                    <Plus className="size-3.5 mr-1" /> Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  {p.riwayatJabatan && p.riwayatJabatan.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Jabatan</TableHead>
                            <TableHead>Unit Kerja</TableHead>
                            <TableHead>TMT</TableHead>
                            <TableHead>Nomor SK</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.riwayatJabatan.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.jabatan ?? '-'}</TableCell>
                              <TableCell>{r.unitKerja ?? '-'}</TableCell>
                              <TableCell>{r.tmtJabatan ? new Date(r.tmtJabatan).toLocaleDateString('id-ID') : '-'}</TableCell>
                              <TableCell>{r.nomorSk ?? '-'}</TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteRiwayatTarget({ id: r.id, jenis: 'jabatan' })} title="Hapus">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Belum ada riwayat jabatan</p>
                  )}
                </CardContent>
              </Card>

              {/* Riwayat Mutasi */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-blue-800">Riwayat Mutasi</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openRiwayatForm('mutasi')} className="border-blue-300 text-blue-700">
                    <Plus className="size-3.5 mr-1" /> Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  {p.riwayatMutasi && p.riwayatMutasi.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sekolah Asal</TableHead>
                            <TableHead>Sekolah Tujuan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Nomor SK</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.riwayatMutasi.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.sekolahAsal ?? '-'}</TableCell>
                              <TableCell>{r.sekolahTujuan ?? '-'}</TableCell>
                              <TableCell>{r.tanggalMutasi ? new Date(r.tanggalMutasi).toLocaleDateString('id-ID') : '-'}</TableCell>
                              <TableCell>{r.nomorSk ?? '-'}</TableCell>
                              <TableCell>{r.keterangan ?? '-'}</TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteRiwayatTarget({ id: r.id, jenis: 'mutasi' })} title="Hapus">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Belum ada riwayat mutasi</p>
                  )}
                </CardContent>
              </Card>

              {/* Riwayat Pelatihan */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-blue-800">Riwayat Pelatihan</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openRiwayatForm('pelatihan')} className="border-blue-300 text-blue-700">
                    <Plus className="size-3.5 mr-1" /> Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  {p.riwayatPelatihan && p.riwayatPelatihan.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Pelatihan</TableHead>
                            <TableHead>Penyelenggara</TableHead>
                            <TableHead>Tahun</TableHead>
                            <TableHead>Nomor Sertifikat</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.riwayatPelatihan.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.namaPelatihan ?? '-'}</TableCell>
                              <TableCell>{r.penyelenggara ?? '-'}</TableCell>
                              <TableCell>{r.tahunPelatihan ?? '-'}</TableCell>
                              <TableCell>{r.nomorSertifikat ?? '-'}</TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteRiwayatTarget({ id: r.id, jenis: 'pelatihan' })} title="Hapus">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Belum ada riwayat pelatihan</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 8: Dokumen */}
          <TabsContent value="dokumen">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-blue-800">Dokumen Pegawai</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setDokumenFormOpen(true)} className="border-blue-300 text-blue-700">
                  <Plus className="size-3.5 mr-1" /> Tambah
                </Button>
              </CardHeader>
              <CardContent>
                {p.dokumenPegawai && p.dokumenPegawai.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jenis Dokumen</TableHead>
                          <TableHead>Nama File</TableHead>
                          <TableHead>Ukuran</TableHead>
                          <TableHead>Tanggal Upload</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {p.dokumenPegawai.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell>
                              <Badge variant="secondary">{d.jenisDokumen?.replace(/_/g, ' ') ?? '-'}</Badge>
                            </TableCell>
                            <TableCell>{d.namaFile ?? '-'}</TableCell>
                            <TableCell>{d.ukuranFile ? `${(d.ukuranFile / 1024).toFixed(1)} KB` : '-'}</TableCell>
                            <TableCell>{new Date(d.uploadedAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteDokumenTarget(d.id)} title="Hapus">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Belum ada dokumen yang diupload</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menonaktifkan pegawai &quot;{deleteTarget?.nama}&quot;? Tindakan ini dapat dibatalkan oleh admin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit form dialog */}
        <PegawaiFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          editingPegawai={editingPegawai}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          isAdmin={isAdmin}
          sekolahId={sekolahId}
          sekolahList={sekolahList}
        />

        {/* Riwayat Form Dialog */}
        <Dialog open={riwayatFormOpen} onOpenChange={setRiwayatFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-blue-800">
                Tambah Riwayat {riwayatFormJenis === 'jabatan' ? 'Jabatan' : riwayatFormJenis === 'mutasi' ? 'Mutasi' : 'Pelatihan'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {riwayatFormJenis === 'jabatan' && (
                <>
                  <FormField label="Jabatan" required>
                    <Input value={riwayatForm.jabatan ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, jabatan: e.target.value }))} placeholder="Nama jabatan" />
                  </FormField>
                  <FormField label="Unit Kerja">
                    <Input value={riwayatForm.unitKerja ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, unitKerja: e.target.value }))} placeholder="Unit kerja" />
                  </FormField>
                  <FormField label="TMT">
                    <Input type="date" value={riwayatForm.tmtJabatan ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, tmtJabatan: e.target.value }))} />
                  </FormField>
                  <FormField label="Nomor SK">
                    <Input value={riwayatForm.nomorSk ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, nomorSk: e.target.value }))} placeholder="No. SK" />
                  </FormField>
                </>
              )}
              {riwayatFormJenis === 'mutasi' && (
                <>
                  <FormField label="Sekolah Asal">
                    <Input value={riwayatForm.sekolahAsal ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, sekolahAsal: e.target.value }))} placeholder="Nama sekolah asal" />
                  </FormField>
                  <FormField label="Sekolah Tujuan">
                    <Input value={riwayatForm.sekolahTujuan ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, sekolahTujuan: e.target.value }))} placeholder="Nama sekolah tujuan" />
                  </FormField>
                  <FormField label="Tanggal">
                    <Input type="date" value={riwayatForm.tanggalMutasi ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, tanggalMutasi: e.target.value }))} />
                  </FormField>
                  <FormField label="Nomor SK">
                    <Input value={riwayatForm.nomorSk ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, nomorSk: e.target.value }))} placeholder="No. SK" />
                  </FormField>
                  <FormField label="Keterangan">
                    <Input value={riwayatForm.keterangan ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="Keterangan" />
                  </FormField>
                </>
              )}
              {riwayatFormJenis === 'pelatihan' && (
                <>
                  <FormField label="Nama Pelatihan" required>
                    <Input value={riwayatForm.namaPelatihan ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, namaPelatihan: e.target.value }))} placeholder="Nama pelatihan" />
                  </FormField>
                  <FormField label="Penyelenggara">
                    <Input value={riwayatForm.penyelenggara ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, penyelenggara: e.target.value }))} placeholder="Penyelenggara" />
                  </FormField>
                  <FormField label="Tahun">
                    <Input value={riwayatForm.tahunPelatihan ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, tahunPelatihan: e.target.value }))} placeholder="Tahun" />
                  </FormField>
                  <FormField label="Nomor Sertifikat">
                    <Input value={riwayatForm.nomorSertifikat ?? ''} onChange={e => setRiwayatForm(f => ({ ...f, nomorSertifikat: e.target.value }))} placeholder="No. Sertifikat" />
                  </FormField>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRiwayatFormOpen(false)}>Batal</Button>
              <Button onClick={handleRiwayatSubmit} disabled={submitting} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dokumen Form Dialog */}
        <Dialog open={dokumenFormOpen} onOpenChange={setDokumenFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Tambah Dokumen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FormField label="Jenis Dokumen" required>
                <Select value={dokumenForm.jenisDokumen} onValueChange={v => setDokumenForm(f => ({ ...f, jenisDokumen: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KTP">KTP</SelectItem>
                    <SelectItem value="KK">KK</SelectItem>
                    <SelectItem value="Ijazah">Ijazah</SelectItem>
                    <SelectItem value="SK_Pengangkatan">SK Pengangkatan</SelectItem>
                    <SelectItem value="SK_Pangkat">SK Pangkat</SelectItem>
                    <SelectItem value="Sertifikat_Pendidik">Sertifikat Pendidik</SelectItem>
                    <SelectItem value="Kartu_ASN_PPPK">Kartu ASN/PPPK</SelectItem>
                    <SelectItem value="Dokumen_Lainnya">Dokumen Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Nama File" required>
                <Input value={dokumenForm.namaFile} onChange={e => setDokumenForm(f => ({ ...f, namaFile: e.target.value }))} placeholder="Nama file" />
              </FormField>
              <FormField label="URL / Link">
                <Input value={dokumenForm.urlFile} onChange={e => setDokumenForm(f => ({ ...f, urlFile: e.target.value }))} placeholder="URL file (opsional)" />
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDokumenFormOpen(false)}>Batal</Button>
              <Button onClick={handleDokumenSubmit} disabled={submitting} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Riwayat confirmation */}
        <AlertDialog open={!!deleteRiwayatTarget} onOpenChange={(open) => !open && setDeleteRiwayatTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus riwayat ini?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRiwayat} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dokumen confirmation */}
        <AlertDialog open={!!deleteDokumenTarget} onOpenChange={(open) => !open && setDeleteDokumenTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus dokumen ini?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDokumen} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // =====================================================================
  // LIST VIEW
  // =====================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <Users className="size-5 text-blue-600" />
          Data Pegawai
        </h2>
        <Button
          onClick={openAddForm}
          className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white"
        >
          <Plus className="size-4" /> Tambah Pegawai
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIP, NIK..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            {/* Jenis Pegawai */}
            <Select
              value={filterJenisPegawai}
              onValueChange={(v) => {
                setFilterJenisPegawai(v === '__all__' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Jenis Pegawai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Jenis</SelectItem>
                <SelectItem value="Guru">Guru</SelectItem>
                <SelectItem value="Tendik">Tendik</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Kepegawaian */}
            <Select
              value={filterStatusKepegawaian}
              onValueChange={(v) => {
                setFilterStatusKepegawaian(v === '__all__' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status Kepegawaian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Status</SelectItem>
                {STATUS_KEPEGAWAIAN_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_KEPEGAWAIAN_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Aktif */}
            <Select
              value={filterStatusAktif}
              onValueChange={(v) => {
                setFilterStatusAktif(v === '__all__' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status Aktif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                <SelectItem value="pensiun">Pensiun</SelectItem>
                <SelectItem value="mutasi">Mutasi</SelectItem>
              </SelectContent>
            </Select>

            {/* Sekolah (admin only) */}
            {isAdmin && (
              <Select
                value={filterSekolahId}
                onValueChange={(v) => {
                  setFilterSekolahId(v === '__all__' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sekolah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Sekolah</SelectItem>
                  {sekolahList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.namaSekolah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground"
            >
              <X className="size-4" /> Reset Filter
            </Button>
            <p className="text-sm text-muted-foreground">
              Total: {pegawaiTotal} pegawai
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">NIP</TableHead>
                <TableHead className="hidden sm:table-cell">JK</TableHead>
                <TableHead className="hidden lg:table-cell">Sekolah/Unit</TableHead>
                <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                <TableHead className="hidden sm:table-cell">Jenis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Sertifikasi</TableHead>
                <TableHead className="hidden md:table-cell">Status Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pegawaiList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Tidak ada data pegawai
                  </TableCell>
                </TableRow>
              ) : (
                pegawaiList.map((p, idx) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-blue-50/50"
                    onClick={() => {
                      setSelectedPegawaiId(p.id)
                      setDetailTab('identitas')
                    }}
                  >
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{p.nama}</p>
                        <p className="text-xs text-muted-foreground md:hidden">NIP: {p.nip ?? '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.nip ?? '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.jenisKelamin ?? '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{p.sekolah?.namaSekolah ?? '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.jabatan ?? '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {p.jenisPegawai ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {STATUS_KEPEGAWAIAN_LABELS[p.statusKepegawaian ?? ''] ?? p.statusKepegawaian ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <SertifikasiBadge status={p.sertifikasi} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusAktifBadge status={p.statusPegawai} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedPegawaiId(p.id)
                            setDetailTab('identitas')
                          }}
                          title="Detail"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          onClick={() => openEditForm(p)}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(p)}
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-muted-foreground">
            Menampilkan {Math.min((page - 1) * limit + 1, pegawaiTotal)}–{Math.min(page * limit, pegawaiTotal)} dari {pegawaiTotal} pegawai
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
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? 'default' : 'outline'}
                  className={p === page ? 'bg-blue-800 hover:bg-blue-700' : ''}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menonaktifkan pegawai &quot;{deleteTarget?.nama}&quot;? Tindakan ini dapat dibatalkan oleh admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Form Dialog */}
      <PegawaiFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingPegawai={editingPegawai}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        submitting={submitting}
        isAdmin={isAdmin}
        sekolahId={sekolahId}
        sekolahList={sekolahList}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pegawai Form Dialog
// ---------------------------------------------------------------------------

function PegawaiFormDialog({
  open,
  onOpenChange,
  editingPegawai,
  formData,
  setFormData,
  onSubmit,
  submitting,
  isAdmin,
  sekolahId,
  sekolahList,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPegawai: Pegawai | null
  formData: PegawaiFormData
  setFormData: React.Dispatch<React.SetStateAction<PegawaiFormData>>
  onSubmit: () => void
  submitting: boolean
  isAdmin: boolean
  sekolahId: string
  sekolahList: Sekolah[]
}) {
  const handleChange = (field: keyof PegawaiFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const tahunPensiunPreview = calculateTahunPensiun(formData.tanggalLahir, formData.jenisPegawai)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-blue-800">
            {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
          </DialogTitle>
          <DialogDescription>
            {editingPegawai
              ? 'Perbarui data pegawai di bawah ini.'
              : 'Isi formulir berikut untuk menambah pegawai baru.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-4">
            {/* Section A: Identitas Pegawai */}
            <section>
              <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
                A. Identitas Pegawai
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="NIK" required>
                  <Input
                    value={formData.nik}
                    onChange={(e) => handleChange('nik', e.target.value)}
                    placeholder="16 digit NIK"
                    maxLength={16}
                  />
                </FormField>
                <FormField label="NIP">
                  <Input
                    value={formData.nip}
                    onChange={(e) => handleChange('nip', e.target.value)}
                    placeholder="NIP"
                  />
                </FormField>
                <FormField label="NUPTK">
                  <Input
                    value={formData.nuptk}
                    onChange={(e) => handleChange('nuptk', e.target.value)}
                    placeholder="NUPTK"
                  />
                </FormField>
                <FormField label="Nama Lengkap" required>
                  <Input
                    value={formData.nama}
                    onChange={(e) => handleChange('nama', e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </FormField>
                <FormField label="Tempat Lahir">
                  <Input
                    value={formData.tempatLahir}
                    onChange={(e) => handleChange('tempatLahir', e.target.value)}
                    placeholder="Kota/Kabupaten"
                  />
                </FormField>
                <FormField label="Tanggal Lahir">
                  <Input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                  />
                </FormField>
                <FormField label="Jenis Kelamin">
                  <Select value={formData.jenisKelamin} onValueChange={(v) => handleChange('jenisKelamin', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Agama">
                  <Select value={formData.agama} onValueChange={(v) => handleChange('agama', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih agama" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGAMA_OPTIONS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Nomor HP">
                  <Input
                    value={formData.noHp}
                    onChange={(e) => handleChange('noHp', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </FormField>
                <FormField label="Email">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@contoh.com"
                  />
                </FormField>
                <div className="sm:col-span-2 lg:col-span-3">
                  <FormField label="Alamat">
                    <Textarea
                      value={formData.alamat}
                      onChange={(e) => handleChange('alamat', e.target.value)}
                      placeholder="Alamat lengkap"
                      rows={2}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* Section B: Data Kepegawaian */}
            <section>
              <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
                B. Data Kepegawaian
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Sekolah/Unit Kerja" required>
                  {isAdmin ? (
                    <Select value={formData.sekolahId} onValueChange={(v) => handleChange('sekolahId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sekolah" />
                      </SelectTrigger>
                      <SelectContent>
                        {sekolahList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.namaSekolah}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={sekolahList.find((s) => s.id === sekolahId)?.namaSekolah ?? sekolahId}
                      disabled
                      className="bg-muted"
                    />
                  )}
                </FormField>
                <FormField label="Jabatan">
                  <Input
                    value={formData.jabatan}
                    onChange={(e) => handleChange('jabatan', e.target.value)}
                    placeholder="Jabatan"
                  />
                </FormField>
                <FormField label="Jenis Pegawai">
                  <Select value={formData.jenisPegawai} onValueChange={(v) => handleChange('jenisPegawai', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guru">Guru</SelectItem>
                      <SelectItem value="Tendik">Tendik</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Status Kepegawaian">
                  <Select value={formData.statusKepegawaian} onValueChange={(v) => handleChange('statusKepegawaian', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_KEPEGAWAIAN_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_KEPEGAWAIAN_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Status Aktif">
                  <Select value={formData.statusPegawai} onValueChange={(v) => handleChange('statusPegawai', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                      <SelectItem value="pensiun">Pensiun</SelectItem>
                      <SelectItem value="mutasi">Mutasi</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Tanggal Mulai Tugas">
                  <Input
                    type="date"
                    value={formData.tmtTugas}
                    onChange={(e) => handleChange('tmtTugas', e.target.value)}
                  />
                </FormField>
                <FormField label="TMT Sekolah">
                  <Input
                    type="date"
                    value={formData.tmtSekolah}
                    onChange={(e) => handleChange('tmtSekolah', e.target.value)}
                  />
                </FormField>
                <FormField label="TMT Jabatan">
                  <Input
                    type="date"
                    value={formData.tmtJabatan}
                    onChange={(e) => handleChange('tmtJabatan', e.target.value)}
                  />
                </FormField>
                <FormField label="TMT Pangkat">
                  <Input
                    type="date"
                    value={formData.tmtPangkat}
                    onChange={(e) => handleChange('tmtPangkat', e.target.value)}
                  />
                </FormField>
                <FormField label="Masa Kerja Tahun">
                  <Input
                    type="number"
                    min={0}
                    value={formData.masaKerjaTahun}
                    onChange={(e) => handleChange('masaKerjaTahun', parseInt(e.target.value) || 0)}
                  />
                </FormField>
                <FormField label="Masa Kerja Bulan">
                  <Input
                    type="number"
                    min={0}
                    max={11}
                    value={formData.masaKerjaBulan}
                    onChange={(e) => handleChange('masaKerjaBulan', parseInt(e.target.value) || 0)}
                  />
                </FormField>
                {tahunPensiunPreview && (
                  <div className="flex items-end">
                    <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm">
                      <span className="text-blue-600">Estimasi Tahun Pensiun: </span>
                      <span className="font-bold text-blue-800">{tahunPensiunPreview}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Section C: Pangkat & Golongan */}
            <section>
              <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
                C. Pangkat & Golongan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Pangkat">
                  <Input
                    value={formData.pangkat}
                    onChange={(e) => handleChange('pangkat', e.target.value)}
                    placeholder="Pangkat"
                  />
                </FormField>
                <FormField label="Golongan/Ruang">
                  <Input
                    value={formData.golongan}
                    onChange={(e) => handleChange('golongan', e.target.value)}
                    placeholder="Contoh: III/a"
                  />
                </FormField>
                <FormField label="TMT Pangkat">
                  <Input
                    type="date"
                    value={formData.tmtPangkat}
                    onChange={(e) => handleChange('tmtPangkat', e.target.value)}
                  />
                </FormField>
              </div>
            </section>

            {/* Section D: Pendidikan */}
            <section>
              <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
                D. Pendidikan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Pendidikan Terakhir">
                  <Select value={formData.pendidikanTerakhir} onValueChange={(v) => handleChange('pendidikanTerakhir', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      {PENDIDIKAN_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Jurusan">
                  <Input
                    value={formData.jurusan}
                    onChange={(e) => handleChange('jurusan', e.target.value)}
                    placeholder="Jurusan/Prodi"
                  />
                </FormField>
                <FormField label="Nomor Ijazah">
                  <Input
                    value={''}
                    onChange={(e) => e.target.value}
                    placeholder="Nomor Ijazah"
                    disabled
                  />
                </FormField>
              </div>
            </section>

            {/* Section E: Sertifikasi */}
            <section>
              <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-2 mb-4">
                E. Sertifikasi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Status Sertifikasi">
                  <Select value={formData.sertifikasi} onValueChange={(v) => handleChange('sertifikasi', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Belum">Belum</SelectItem>
                      <SelectItem value="Proses">Proses</SelectItem>
                      <SelectItem value="Terisi">Terisi</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Nomor Sertifikat">
                  <Input
                    value={formData.nomorSertifikat}
                    onChange={(e) => handleChange('nomorSertifikat', e.target.value)}
                    placeholder="Nomor sertifikat"
                  />
                </FormField>
                <FormField label="Bidang Sertifikasi">
                  <Input
                    value={formData.bidangSertifikasi}
                    onChange={(e) => handleChange('bidangSertifikasi', e.target.value)}
                    placeholder="Bidang studi"
                  />
                </FormField>
                <FormField label="Tahun Sertifikasi">
                  <Input
                    value={formData.tahunSertifikasi}
                    onChange={(e) => handleChange('tahunSertifikasi', e.target.value)}
                    placeholder="Tahun"
                  />
                </FormField>
                <FormField label="NRG">
                  <Input
                    value={formData.nrg}
                    onChange={(e) => handleChange('nrg', e.target.value)}
                    placeholder="NRG"
                  />
                </FormField>
                <FormField label="Status TPG">
                  <Input
                    value={formData.statusTpg}
                    onChange={(e) => handleChange('statusTpg', e.target.value)}
                    placeholder="Status TPG"
                  />
                </FormField>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {editingPegawai ? 'Simpan Perubahan' : 'Tambah Pegawai'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Utility components & helpers
// ---------------------------------------------------------------------------

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value || '-'}</p>
    </div>
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

function StatusAktifBadge({ status }: { status: string }) {
  switch (status) {
    case 'aktif':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Aktif</Badge>
    case 'tidak_aktif':
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs">Tidak Aktif</Badge>
    case 'pensiun':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">Pensiun</Badge>
    case 'mutasi':
      return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-xs">Mutasi</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function calculateTahunPensiun(tanggalLahir: string, jenisPegawai: string): number | null {
  if (!tanggalLahir) return null
  const birthYear = new Date(tanggalLahir).getFullYear()
  const retirementAge = jenisPegawai === 'Guru' ? 60 : 58
  return birthYear + retirementAge
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = [1]

  if (current > 3) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  pages.push(total)

  return pages
}
