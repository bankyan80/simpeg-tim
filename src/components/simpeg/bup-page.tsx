'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { Pegawai } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Clock, CalendarCheck, Calculator, Printer, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  } catch { return '-' }
}

function calculateAge(tanggalLahir: string | null): number {
  if (!tanggalLahir) return 0
  try {
    const birth = new Date(tanggalLahir)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  } catch { return 0 }
}

function getBUP(jenisPegawai: string | null): number {
  return jenisPegawai === 'Guru' ? 60 : 58
}

function getSisaWaktuColor(sisa: number): string {
  if (sisa <= 0) return 'text-red-600 font-bold'
  if (sisa === 1) return 'text-amber-600 font-semibold'
  return 'text-blue-600'
}

function getStatusBupColor(statusBup: string | null): string {
  switch (statusBup) {
    case 'akan_pensiun': return 'bg-red-100 text-red-800'
    case 'sudah_pensiun': return 'bg-gray-100 text-gray-800'
    case 'aktif': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function BupPage() {
  const { user, pegawaiList, pegawaiTotal, loadPegawai, sekolahList, loadSekolah, setNotification } = useSimpegStore()
  const isAdmin = user?.role === 'admin_kecamatan'

  const [activeTab, setActiveTab] = useState('akan_pensiun')
  const [filterSekolah, setFilterSekolah] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [page, setPage] = useState(1)
  const pageSize = 10

  const sekolahId = isAdmin ? filterSekolah : (user?.sekolahId || '')
  const currentYear = new Date().getFullYear()

  const load = useCallback(() => {
    const filters: Record<string, string> = {
      page: page.toString(),
      limit: '1000',
    }
    if (sekolahId) filters.sekolahId = sekolahId
    if (activeTab === 'akan_pensiun') filters.statusBup = 'akan_pensiun'
    if (activeTab === 'sudah_pensiun') filters.statusBup = 'sudah_pensiun'
    if (activeTab === 'rekap') filters.statusPegawai = 'aktif'
    loadPegawai(filters)
  }, [page, sekolahId, activeTab, loadPegawai])

  useEffect(() => { loadSekolah() }, [loadSekolah])
  useEffect(() => { load() }, [load])

  // Calculate BUP data
  const bupData = pegawaiList
    .filter(p => p.tanggalLahir)
    .map(p => {
      const usia = calculateAge(p.tanggalLahir)
      const bup = getBUP(p.jenisPegawai)
      const tahunPensiun = p.tahunPensiun || (p.tanggalLahir ? new Date(p.tanggalLahir).getFullYear() + bup : 0)
      const sisaWaktu = tahunPensiun - currentYear
      return { ...p, usia, bup, tahunPensiun, sisaWaktu }
    })

  const akanPensiunList = bupData.filter(p => p.sisaWaktu <= 1 && p.statusPegawai !== 'pensiun')
  const sudahPensiunList = bupData.filter(p => p.statusPegawai === 'pensiun' || p.statusBup === 'sudah_pensiun')

  const displayList = activeTab === 'akan_pensiun' ? akanPensiunList
    : activeTab === 'sudah_pensiun' ? sudahPensiunList
    : bupData

  const totalPages = Math.max(1, Math.ceil(displayList.length / pageSize))
  const paginatedList = displayList.slice((page - 1) * pageSize, page * pageSize)

  // Rekap per tahun
  const rekapByYear = (() => {
    const yearMap: Record<number, number> = {}
    bupData.forEach(p => {
      if (p.tahunPensiun && p.tahunPensiun >= currentYear) {
        yearMap[p.tahunPensiun] = (yearMap[p.tahunPensiun] || 0) + 1
      }
    })
    return Object.entries(yearMap)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year)
  })()

  function handleCetak() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BUP / Pensiun</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data Batas Usia Pensiun pegawai</p>
        </div>
        <Button variant="outline" onClick={handleCetak} className="border-blue-300 text-blue-700">
          <Printer className="w-4 h-4 mr-2" /> Cetak Daftar BUP
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <Card className="border-0 bg-red-50">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-lg font-bold text-red-800">{akanPensiunList.length}</p>
              <p className="text-xs text-red-600">Akan Pensiun</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gray-50">
          <CardContent className="p-3 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-lg font-bold text-gray-800">{sudahPensiunList.length}</p>
              <p className="text-xs text-gray-600">Sudah Pensiun</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-800">{bupData.length}</p>
              <p className="text-xs text-blue-600">Total Pegawai</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
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
            <div>
              <Label className="text-xs mb-1 block">Tahun</Label>
              <Select value={filterTahun} onValueChange={setFilterTahun}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map(i => {
                    const y = currentYear + i
                    return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1) }}>
        <TabsList className="bg-blue-50">
          <TabsTrigger value="akan_pensiun">Akan Pensiun</TabsTrigger>
          <TabsTrigger value="sudah_pensiun">Sudah Pensiun</TabsTrigger>
          <TabsTrigger value="rekap">Rekap per Tahun</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {activeTab === 'rekap' ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Tahun Pensiun</TableHead>
                      <TableHead>Jumlah Pegawai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapByYear.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                          <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Belum ada data rekap BUP</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rekapByYear.map((item, idx) => (
                        <TableRow key={item.year} className="hover:bg-blue-50/50">
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.year}</TableCell>
                          <TableCell>
                            <Badge className={item.year === currentYear ? 'bg-red-100 text-red-800' : item.year === currentYear + 1 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>
                              {item.count} pegawai
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead className="hidden sm:table-cell">Sekolah</TableHead>
                        <TableHead className="hidden md:table-cell">Jenis</TableHead>
                        <TableHead className="hidden md:table-cell">Tgl Lahir</TableHead>
                        <TableHead>Usia</TableHead>
                        <TableHead>BUP</TableHead>
                        <TableHead>Thn Pensiun</TableHead>
                        <TableHead>Sisa</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Tidak ada data</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedList.map((p, idx) => (
                          <TableRow key={p.id} className="hover:bg-blue-50/50">
                            <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                            <TableCell className="font-medium">{p.nama}</TableCell>
                            <TableCell className="whitespace-nowrap">{p.nip || '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell">{p.sekolah?.namaSekolah || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge className={p.jenisPegawai === 'Guru' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                {p.jenisPegawai || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell whitespace-nowrap">{formatDate(p.tanggalLahir)}</TableCell>
                            <TableCell>{p.usia} th</TableCell>
                            <TableCell>{p.bup} th</TableCell>
                            <TableCell className="font-medium">{p.tahunPensiun}</TableCell>
                            <TableCell>
                              <span className={getSisaWaktuColor(p.sisaWaktu)}>
                                {p.sisaWaktu <= 0 ? 'Sudah' : `${p.sisaWaktu} th`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusBupColor(p.statusBup)} text-xs`}>
                                {p.statusBup === 'akan_pensiun' ? 'Akan Pensiun' : p.statusBup === 'sudah_pensiun' ? 'Sudah Pensiun' : 'Aktif'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {displayList.length > pageSize && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-gray-500">
                      Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, displayList.length)} dari {displayList.length}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
