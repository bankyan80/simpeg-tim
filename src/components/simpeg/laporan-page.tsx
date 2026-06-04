'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Pegawai, AbsensiPegawai } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  FileBarChart, FileSpreadsheet, FileText, Printer, Eye, Users, Building2, GraduationCap,
  Briefcase, Clock, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react'

interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  filterType: 'none' | 'date_range' | 'school' | 'year' | 'school_year'
  apiEndpoint: string
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'pegawai_kecamatan',
    title: 'Laporan Pegawai Kecamatan',
    description: 'Rekap seluruh pegawai di wilayah kecamatan',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    filterType: 'none',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'pegawai_sekolah',
    title: 'Laporan Pegawai per Sekolah',
    description: 'Data pegawai berdasarkan unit kerja/sekolah',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    filterType: 'school',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'pns',
    title: 'Laporan ASN (PNS)',
    description: 'Data pegawai berstatus PNS',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    filterType: 'school',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'pppk',
    title: 'Laporan PPPK',
    description: 'Data pegawai PPPK',
    icon: Briefcase,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    filterType: 'school',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'pppk_paruh_waktu',
    title: 'Laporan PPPK Paruh Waktu',
    description: 'Data pegawai PPPK Paruh Waktu',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    filterType: 'school',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'honorer',
    title: 'Laporan Honorer',
    description: 'Data pegawai honorer (GTT/GTY)',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    filterType: 'school',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'bup',
    title: 'Laporan BUP',
    description: 'Data Batas Usia Pensiun pegawai',
    icon: Calendar,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    filterType: 'year',
    apiEndpoint: '/api/pegawai',
  },
  {
    id: 'absensi',
    title: 'Laporan Absensi',
    description: 'Rekap kehadiran pegawai',
    icon: FileBarChart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    filterType: 'date_range',
    apiEndpoint: '/api/absensi',
  },
]

export default function LaporanPage() {
  const { user, sekolahList, loadSekolah, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  const [showPreview, setShowPreview] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [previewData, setPreviewData] = useState<Pegawai[] | AbsensiPegawai[]>([])
  const [loading, setLoading] = useState(false)

  // Filters for preview
  const [filterSekolah, setFilterSekolah] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterDari, setFilterDari] = useState('')
  const [filterSampai, setFilterSampai] = useState('')

  useEffect(() => { loadSekolah() }, [loadSekolah])

  async function openPreview(report: ReportType) {
    setSelectedReport(report)
    setLoading(true)
    setShowPreview(true)

    try {
      const params = new URLSearchParams()
      params.set('limit', '50')

      if (report.id === 'pns') params.set('statusKepegawaian', 'PNS')
      else if (report.id === 'pppk') params.set('statusKepegawaian', 'PPPK')
      else if (report.id === 'pppk_paruh_waktu') params.set('statusKepegawaian', 'PPPK_Paruh_Waktu')
      else if (report.id === 'honorer') params.set('statusKepegawaian', 'Honorer,GTY,GTT')
      else if (report.id === 'bup') params.set('statusBup', 'akan_pensiun')

      if (filterSekolah && report.filterType !== 'none') params.set('sekolahId', filterSekolah)
      if (filterTahun && report.id === 'bup') params.set('tahun', filterTahun)

      if (report.id === 'absensi') {
        if (filterDari) params.set('tanggalDari', filterDari)
        if (filterSampai) params.set('tanggalSampai', filterSampai)
        if (filterSekolah) params.set('sekolahId', filterSekolah)
      }

      const res = await fetch(`${report.apiEndpoint}?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const data = await res.json()
      setPreviewData(data.data ?? data)
    } catch {
      setNotification({ type: 'error', message: 'Gagal memuat data laporan' })
      setPreviewData([])
    } finally {
      setLoading(false)
    }
  }

  function handleExport(report: ReportType, format: 'csv' | 'pdf') {
    const params = new URLSearchParams({ type: report.id, format })
    if (filterSekolah) params.set('sekolahId', filterSekolah)
    if (filterTahun) params.set('tahun', filterTahun)
    if (filterDari) params.set('dari', filterDari)
    if (filterSampai) params.set('sampai', filterSampai)
    window.open(`/api/export?${params.toString()}`)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Cetak dan export berbagai laporan data pegawai</p>
      </div>

      {/* Global Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs mb-1 block">Sekolah</Label>
              <Select value={filterSekolah} onValueChange={setFilterSekolah}>
                <SelectTrigger className="w-52"><SelectValue placeholder="Semua Sekolah" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sekolah</SelectItem>
                  {sekolahList.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.namaSekolah}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tahun</Label>
              <Select value={filterTahun} onValueChange={setFilterTahun}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Dari Tanggal</Label>
              <Input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Sampai Tanggal</Label>
              <Input type="date" value={filterSampai} onChange={e => setFilterSampai(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {REPORT_TYPES.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${report.bgColor}`}>
                  <report.icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold text-gray-900 leading-tight">{report.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-500 mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => openPreview(report)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleExport(report, 'csv')}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleExport(report, 'pdf')}>
                  <FileText className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title || 'Preview Laporan'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : previewData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileBarChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada data untuk ditampilkan</p>
              </div>
            ) : selectedReport?.id === 'absensi' ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead>No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previewData as AbsensiPegawai[]).map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</TableCell>
                      <TableCell>{item.nip || '-'}</TableCell>
                      <TableCell>{item.namaPegawai}</TableCell>
                      <TableCell>{(item.keterangan || '-').replace('_', ' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead>No</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Sekolah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jabatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previewData as Pegawai[]).map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.nip || '-'}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell>{item.sekolah?.namaSekolah || '-'}</TableCell>
                      <TableCell>
                        <Badge className="text-xs bg-blue-100 text-blue-800">
                          {(item.statusKepegawaian || '-').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.jabatan || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Tutup</Button>
            {selectedReport && (
              <>
                <Button variant="outline" onClick={() => handleExport(selectedReport, 'csv')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport(selectedReport, 'pdf')}>
                  <FileText className="w-4 h-4 mr-2" /> Export PDF
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
