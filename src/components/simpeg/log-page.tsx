'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import type { LogAktivitas } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  History, ChevronLeft, ChevronRight, Search, RotateCcw, Activity
} from 'lucide-react'

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`
  } catch { return '-' }
}

function getAksiColor(aksi: string | null): string {
  switch (aksi) {
    case 'login': return 'bg-blue-100 text-blue-800'
    case 'tambah': return 'bg-blue-100 text-blue-800'
    case 'edit': return 'bg-amber-100 text-amber-800'
    case 'hapus': return 'bg-red-100 text-red-800'
    case 'validasi': return 'bg-purple-100 text-purple-800'
    case 'export': return 'bg-sky-100 text-sky-800'
    case 'cetak': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getModulColor(modul: string | null): string {
  switch (modul) {
    case 'pegawai': return 'bg-blue-100 text-blue-800'
    case 'absensi': return 'bg-blue-100 text-blue-800'
    case 'validasi': return 'bg-purple-100 text-purple-800'
    case 'mutasi': return 'bg-amber-100 text-amber-800'
    case 'sekolah': return 'bg-sky-100 text-sky-800'
    case 'pengaturan': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const AKSI_OPTIONS = ['login', 'tambah', 'edit', 'hapus', 'validasi', 'export', 'cetak'] as const
const MODUL_OPTIONS = ['pegawai', 'absensi', 'validasi', 'mutasi', 'sekolah', 'pengaturan'] as const

export default function LogPage() {
  const { logList, logTotal, loadLog } = useSimpegStore()

  const [filterUser, setFilterUser] = useState('')
  const [filterAksi, setFilterAksi] = useState('')
  const [filterModul, setFilterModul] = useState('')
  const [filterDari, setFilterDari] = useState('')
  const [filterSampai, setFilterSampai] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const load = useCallback(() => {
    const filters: Record<string, string> = {
      page: page.toString(),
      limit: pageSize.toString(),
    }
    if (filterAksi) filters.aksi = filterAksi
    if (filterModul) filters.modul = filterModul
    if (filterDari) filters.dari = filterDari
    if (filterSampai) filters.sampai = filterSampai
    if (filterUser) filters.search = filterUser
    loadLog(filters)
  }, [page, filterAksi, filterModul, filterDari, filterSampai, filterUser, loadLog])

  useEffect(() => { load() }, [load])

  function resetFilters() {
    setFilterUser('')
    setFilterAksi('')
    setFilterModul('')
    setFilterDari('')
    setFilterSampai('')
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(logTotal / pageSize))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas</h1>
        <p className="text-sm text-gray-500 mt-1">Riwayat aktivitas pengguna sistem</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-800">{logTotal}</p>
              <p className="text-xs text-blue-600">Total Aktivitas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs mb-1 block">User</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <Input className="pl-9" placeholder="Cari user..." value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1) }} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Aksi</Label>
              <Select value={filterAksi} onValueChange={v => { setFilterAksi(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Semua Aksi" /></SelectTrigger>
                <SelectContent>
                  {AKSI_OPTIONS.map(a => (
                    <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Modul</Label>
              <Select value={filterModul} onValueChange={v => { setFilterModul(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Semua Modul" /></SelectTrigger>
                <SelectContent>
                  {MODUL_OPTIONS.map(m => (
                    <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Dari</Label>
              <Input type="date" value={filterDari} onChange={e => { setFilterDari(e.target.value); setPage(1) }} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Sampai</Label>
              <Input type="date" value={filterSampai} onChange={e => { setFilterSampai(e.target.value); setPage(1) }} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Modul</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Belum ada log aktivitas</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logList.map((log, idx) => (
                    <TableRow key={log.id} className="hover:bg-blue-50/50">
                      <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</TableCell>
                      <TableCell className="font-medium">{log.user?.nama || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${getAksiColor(log.aksi)} text-xs`}>
                          {(log.aksi || '-').charAt(0).toUpperCase() + (log.aksi || '-').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getModulColor(log.modul)} text-xs`}>
                          {(log.modul || '-').charAt(0).toUpperCase() + (log.modul || '-').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-sm text-gray-600">{log.keterangan || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {logTotal > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, logTotal)} dari {logTotal}
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
    </div>
  )
}
