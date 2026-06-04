'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Sekolah, Pegawai } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2, MapPin, User, Phone, Mail, Pencil, Save, Users, GraduationCap,
  Briefcase, BadgeCheck, FileBadge, Clock, AlertTriangle, Globe, Home,
  BookOpen, Award, TrendingUp, Calendar, ChevronDown, Search, School,
  UserCircle
} from 'lucide-react'

// Hardcoded school data as fallback
const HARDCODED_SEKOLAH = [
  { id: 'sekolah-2010001', npsn: '2010001', namaSekolah: 'SDN Lemahabang 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2010002', npsn: '2010002', namaSekolah: 'SDN Lemahabang 02', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2010003', npsn: '2010003', namaSekolah: 'SDN Cipanas 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2010004', npsn: '2010004', namaSekolah: 'SDN Cipanas 02', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2010005', npsn: '2010005', namaSekolah: 'SDN Palalangan 01', jenjang: 'SD', kecamatan: 'Lemahabang', desa: 'Palalangan', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2020001', npsn: '2020001', namaSekolah: 'TKN Lemahabang 01', jenjang: 'TK', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2020002', npsn: '2020002', namaSekolah: 'TKN Cipanas 01', jenjang: 'TK', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2030001', npsn: '2030001', namaSekolah: 'KBN Melati Lemahabang', jenjang: 'KB/PAUD', kecamatan: 'Lemahabang', desa: 'Lemahabang', alamat: null, kepalaSekolah: null, status: 'aktif' },
  { id: 'sekolah-2030002', npsn: '2030002', namaSekolah: 'PAUDN Cempaka Cipanas', jenjang: 'KB/PAUD', kecamatan: 'Lemahabang', desa: 'Cipanas', alamat: null, kepalaSekolah: null, status: 'aktif' },
]

function getJenjangColor(jenjang: string): string {
  switch (jenjang) {
    case 'SD': return 'bg-blue-100 text-blue-800'
    case 'TK': return 'bg-purple-100 text-purple-800'
    case 'KB/PAUD': return 'bg-pink-100 text-pink-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getJenjangLabel(jenjang: string): string {
  switch (jenjang) {
    case 'SD': return 'Sekolah Dasar'
    case 'TK': return 'Taman Kanak-Kanak'
    case 'KB/PAUD': return 'Kelompok Bermain / PAUD'
    default: return jenjang
  }
}

function getJenjangIcon(jenjang: string): string {
  switch (jenjang) {
    case 'SD': return '🏫'
    case 'TK': return '🎨'
    case 'KB/PAUD': return '🌟'
    default: return '📋'
  }
}

export default function ProfilPage() {
  const { user, sekolahList, setNotification } = useSimpegStore()

  const [sekolah, setSekolah] = useState<Sekolah | null>(null)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditContact, setShowEditContact] = useState(false)
  const [formAlamat, setFormAlamat] = useState('')
  const [formKepalaSekolah, setFormKepalaSekolah] = useState('')
  const [formNoHp, setFormNoHp] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // For admin: school selector
  const [selectedNpsn, setSelectedNpsn] = useState<string>('')
  const [schoolSearch, setSchoolSearch] = useState('')

  const isAdmin = user?.role === 'admin_kecamatan'
  // For operator: use their school's NPSN
  const operatorNpsn = user?.sekolah?.npsn || null
  const npsn = isAdmin ? selectedNpsn : operatorNpsn

  // Fetch school data
  const fetchSekolahData = useCallback(async () => {
    if (!npsn) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch school data
      const sekolahRes = await fetch(`/api/sekolah?search=${npsn}`)
      if (sekolahRes.ok) {
        const sekolahJson = await sekolahRes.json()
        if (sekolahJson.success && sekolahJson.data?.length > 0) {
          const foundSekolah = sekolahJson.data.find((s: Sekolah) => s.npsn === npsn)
          if (foundSekolah) {
            setSekolah(foundSekolah)
            setFormAlamat(foundSekolah.alamat || '')
            setFormKepalaSekolah(foundSekolah.kepalaSekolah || '')

            // Fetch pegawai for this school
            const pegawaiRes = await fetch(`/api/pegawai?npsn=${npsn}&limit=500`)
            if (pegawaiRes.ok) {
              const pegawaiJson = await pegawaiRes.json()
              if (pegawaiJson.success) {
                setPegawaiList(pegawaiJson.data || [])
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch school data:', err)
      // Try fallback from hardcoded data
      const fallback = HARDCODED_SEKOLAH.find(s => s.npsn === npsn)
      if (fallback) {
        setSekolah(fallback as unknown as Sekolah)
        setFormAlamat(fallback.alamat || '')
        setFormKepalaSekolah(fallback.kepalaSekolah || '')
      }
    } finally {
      setLoading(false)
    }
  }, [npsn])

  useEffect(() => {
    fetchSekolahData()
  }, [fetchSekolahData])

  async function handleSaveContact() {
    if (!sekolah) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sekolah/${sekolah.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alamat: formAlamat || null,
          kepalaSekolah: formKepalaSekolah || null,
        }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setNotification({ type: 'success', message: 'Informasi sekolah berhasil diperbarui' })
      setShowEditContact(false)
      fetchSekolahData()
    } catch {
      setNotification({ type: 'error', message: 'Gagal menyimpan informasi sekolah' })
    } finally {
      setSubmitting(false)
    }
  }

  // Computed stats
  const totalPegawai = pegawaiList.length
  const totalGuru = pegawaiList.filter(p => p.jenisPegawai === 'Guru').length
  const totalTendik = pegawaiList.filter(p => p.jenisPegawai === 'Tendik').length
  const totalPns = pegawaiList.filter(p => p.statusKepegawaian === 'PNS').length
  const totalPppk = pegawaiList.filter(p => p.statusKepegawaian === 'PPPK' || p.statusKepegawaian === 'PPPK_Paruh_Waktu').length
  const totalHonorer = pegawaiList.filter(p => p.statusKepegawaian === 'Honorer' || p.statusKepegawaian === 'GTT').length
  const totalSertifikasi = pegawaiList.filter(p => p.sertifikasi === 'Terisi').length
  const akanPensiun = pegawaiList.filter(p => p.statusBup === 'akan_pensiun').length
  const guruL = pegawaiList.filter(p => p.jenisPegawai === 'Guru' && p.jenisKelamin === 'L').length
  const guruP = pegawaiList.filter(p => p.jenisPegawai === 'Guru' && p.jenisKelamin === 'P').length
  const tendikL = pegawaiList.filter(p => p.jenisPegawai === 'Tendik' && p.jenisKelamin === 'L').length
  const tendikP = pegawaiList.filter(p => p.jenisPegawai === 'Tendik' && p.jenisKelamin === 'P').length

  // Available schools for admin selector
  const availableSchools = sekolahList.length > 0 ? sekolahList : HARDCODED_SEKOLAH as unknown as Sekolah[]
  const filteredSchools = schoolSearch
    ? availableSchools.filter(s =>
        s.namaSekolah.toLowerCase().includes(schoolSearch.toLowerCase()) ||
        s.npsn.includes(schoolSearch)
      )
    : availableSchools

  // ========================================
  // ADMIN - No school selected yet
  // ========================================
  if (isAdmin && !npsn) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Sekolah</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih sekolah untuk melihat profil lengkap</p>
        </div>

        {/* School Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSchools
            .sort((a, b) => {
              const order: Record<string, number> = { 'SD': 0, 'TK': 1, 'KB/PAUD': 2 }
              return (order[a.jenjang] ?? 3) - (order[b.jenjang] ?? 3) || a.namaSekolah.localeCompare(b.namaSekolah)
            })
            .map(school => (
            <Card
              key={school.npsn}
              className="border-0 shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
              onClick={() => setSelectedNpsn(school.npsn)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                    <span className="text-xl">{getJenjangIcon(school.jenjang)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-800 transition-colors">
                      {school.namaSekolah}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getJenjangColor(school.jenjang)} text-xs`}>
                        {school.jenjang}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">NPSN: {school.npsn}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Desa {school.desa || '-'}, Kec. {school.kecamatan}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          {isAdmin && npsn && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedNpsn('')} className="text-blue-600">
              ← Kembali
            </Button>
          )}
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  // No school data found
  if (!sekolah) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-600">Profil Sekolah</h2>
          <p className="text-sm text-gray-500 mt-2">
            {isAdmin
              ? 'Pilih sekolah untuk melihat profil'
              : 'Data sekolah belum tersedia untuk akun Anda'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            NPSN: {npsn || 'Tidak tersedia'}
          </p>
          {isAdmin && (
            <Button
              variant="outline"
              className="mt-4 border-blue-300 text-blue-700"
              onClick={() => setSelectedNpsn('')}
            >
              ← Pilih Sekolah
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button for admin */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNpsn('')}
              className="text-blue-600 hover:bg-blue-50 shrink-0"
            >
              ← Kembali
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Sekolah</h1>
            <p className="text-sm text-gray-500 mt-1">Informasi identitas dan data sekolah</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowEditContact(true)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
          <Pencil className="w-4 h-4 mr-2" /> Edit Profil
        </Button>
      </div>

      {/* School Identity Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0a1628] to-blue-900 p-6 text-white">
          <div className="flex flex-col md:flex-row gap-6">
            {/* School Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="text-4xl">{getJenjangIcon(sekolah.jenjang)}</span>
              </div>
            </div>

            {/* School Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge className={`${getJenjangColor(sekolah.jenjang)} text-sm font-semibold`}>
                  {sekolah.jenjang}
                </Badge>
                <Badge className="bg-white/20 text-white text-sm">
                  Sekolah Negeri
                </Badge>
                {sekolah.status === 'aktif' && (
                  <Badge className="bg-green-500/30 text-green-200 text-sm border border-green-400/30">
                    Aktif
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold">{sekolah.namaSekolah}</h2>
              <p className="text-blue-200 text-sm mt-1">{getJenjangLabel(sekolah.jenjang)}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-blue-200 text-sm">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>NPSN: <span className="font-mono font-bold text-white">{sekolah.npsn}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Kec. {sekolah.kecamatan}, Desa {sekolah.desa || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalPegawai}</p>
            <p className="text-xs text-gray-500">Total Pegawai</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalGuru}</p>
            <p className="text-xs text-gray-500">Guru</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Briefcase className="w-6 h-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalTendik}</p>
            <p className="text-xs text-gray-500">Tendik</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <BadgeCheck className="w-6 h-6 text-sky-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalPns}</p>
            <p className="text-xs text-gray-500">PNS</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <FileBadge className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalPppk}</p>
            <p className="text-xs text-gray-500">PPPK</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalHonorer}</p>
            <p className="text-xs text-gray-500">Honorer/GTT</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Detail Sekolah */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Identitas */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-blue-600" /> Informasi Identitas Sekolah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nama Sekolah</p>
                  <p className="font-semibold text-gray-900">{sekolah.namaSekolah}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">NPSN</p>
                  <p className="font-mono font-bold text-gray-900">{sekolah.npsn}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Jenjang</p>
                  <Badge className={getJenjangColor(sekolah.jenjang)}>{getJenjangLabel(sekolah.jenjang)}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Status Sekolah</p>
                  <Badge className="bg-blue-100 text-blue-800">Negeri</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Kecamatan</p>
                  <p className="font-medium text-gray-900">{sekolah.kecamatan}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Desa/Kelurahan</p>
                  <p className="font-medium text-gray-900">{sekolah.desa || 'Belum diisi'}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Alamat Lengkap</p>
                  <p className="font-medium text-gray-900">{sekolah.alamat || 'Belum diisi'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rekap Komposisi Pegawai */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" /> Komposisi Pegawai
              </CardTitle>
              <CardDescription>Rincian berdasarkan jenis dan status kepegawaian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Kategori</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Laki-laki</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Perempuan</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2.5 px-3 font-medium">Guru</td>
                      <td className="text-center py-2.5 px-3">{guruL}</td>
                      <td className="text-center py-2.5 px-3">{guruP}</td>
                      <td className="text-center py-2.5 px-3 font-semibold">{totalGuru}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2.5 px-3 font-medium">Tenaga Pendidik</td>
                      <td className="text-center py-2.5 px-3">{tendikL}</td>
                      <td className="text-center py-2.5 px-3">{tendikP}</td>
                      <td className="text-center py-2.5 px-3 font-semibold">{totalTendik}</td>
                    </tr>
                    <tr className="bg-blue-50 font-semibold">
                      <td className="py-2.5 px-3">Total</td>
                      <td className="text-center py-2.5 px-3">{guruL + tendikL}</td>
                      <td className="text-center py-2.5 px-3">{guruP + tendikP}</td>
                      <td className="text-center py-2.5 px-3 text-blue-800">{totalPegawai}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Status Kepegawaian Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-sky-50 p-3 text-center">
                  <p className="text-lg font-bold text-sky-800">{totalPns}</p>
                  <p className="text-xs text-sky-600">PNS</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center">
                  <p className="text-lg font-bold text-purple-800">{totalPppk}</p>
                  <p className="text-xs text-purple-600">PPPK</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <p className="text-lg font-bold text-orange-800">{totalHonorer}</p>
                  <p className="text-xs text-orange-600">Honorer/GTT</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-lg font-bold text-green-800">{totalSertifikasi}</p>
                  <p className="text-xs text-green-600">Sertifikasi</p>
                </div>
              </div>

              {akanPensiun > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">{akanPensiun} pegawai</span> akan memasuki masa pensiun dalam waktu dekat
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Kepala Sekolah & Operator */}
        <div className="space-y-6">
          {/* Kepala Sekolah */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" /> Kepala Sekolah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-9 h-9 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{sekolah.kepalaSekolah || 'Belum ditentukan'}</p>
                  <p className="text-sm text-gray-500">Kepala Sekolah</p>
                  {sekolah.kepalaSekolah && (
                    <Badge className="bg-green-100 text-green-800 text-xs mt-1">Aktif</Badge>
                  )}
                </div>
              </div>
              {!sekolah.kepalaSekolah && (
                <p className="text-xs text-gray-400 mt-3 italic">
                  Klik &quot;Edit Profil&quot; untuk mengisi nama kepala sekolah
                </p>
              )}
            </CardContent>
          </Card>

          {/* Operator Sekolah */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" /> Operator Sekolah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-9 h-9 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{user?.nama || '-'}</p>
                  <p className="text-sm text-gray-500">{user?.email || '-'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {isAdmin ? 'Admin Kecamatan' : 'Operator'}
                    </Badge>
                    {user?.status === 'aktif' && (
                      <Badge className="bg-green-100 text-green-800 text-xs">Aktif</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informasi Kontak */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-blue-600" /> Informasi Kontak
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => setShowEditContact(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">Alamat</p>
                    <p className="font-medium text-gray-900">{sekolah.alamat || 'Belum diisi'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">Wilayah</p>
                    <p className="font-medium text-gray-900">Desa {sekolah.desa || '-'}, Kec. {sekolah.kecamatan}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">NPSN</p>
                    <p className="font-mono font-bold text-gray-900">{sekolah.npsn}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan Singkat */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Ringkasan
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Pegawai</span>
                  <span className="font-bold text-blue-900">{totalPegawai}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Guru</span>
                  <span className="font-bold text-blue-900">{totalGuru}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tenaga Pendidik</span>
                  <span className="font-bold text-blue-900">{totalTendik}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-blue-700">Sertifikasi Terisi</span>
                  <span className="font-bold text-green-700">{totalSertifikasi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Akan Pensiun</span>
                  <span className="font-bold text-amber-700">{akanPensiun}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profil Dialog */}
      <Dialog open={showEditContact} onOpenChange={setShowEditContact}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profil Sekolah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kepala Sekolah</Label>
              <Input
                value={formKepalaSekolah}
                onChange={e => setFormKepalaSekolah(e.target.value)}
                placeholder="Nama kepala sekolah"
              />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input
                value={formAlamat}
                onChange={e => setFormAlamat(e.target.value)}
                placeholder="Alamat lengkap sekolah"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditContact(false)}>Batal</Button>
            <Button
              onClick={handleSaveContact}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
