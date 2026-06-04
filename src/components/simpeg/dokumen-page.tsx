'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Loader2, FileText } from 'lucide-react'

interface DokumenItem {
  id: string
  pegawaiId: string
  jenisDokumen: string | null
  namaFile: string | null
  urlFile: string | null
  ukuranFile: number | null
  uploadedAt: string
  pegawai?: { nama: string; nip: string | null; nik: string | null } | null
  sekolah?: { namaSekolah: string } | null
}

const JENIS_DOKUMEN_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'KTP', label: 'KTP' },
  { value: 'KK', label: 'KK' },
  { value: 'Ijazah', label: 'Ijazah' },
  { value: 'SK_Pengangkatan', label: 'SK Pengangkatan' },
  { value: 'SK_Pangkat', label: 'SK Pangkat' },
  { value: 'Sertifikat_Pendidik', label: 'Sertifikat Pendidik' },
  { value: 'Kartu_ASN_PPPK', label: 'Kartu ASN/PPPK' },
  { value: 'Dokumen_Lainnya', label: 'Dokumen Lainnya' },
]

export default function DokumenPage() {
  const { user } = useSimpegStore()

  const isAdmin = user?.role === 'admin_kecamatan'
  const sekolahId = user?.sekolahId ?? ''

  const [data, setData] = useState<DokumenItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterJenis, setFilterJenis] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (!isAdmin && sekolahId) {
        params.set('sekolahId', sekolahId)
      }
      if (filterJenis) {
        params.set('jenisDokumen', filterJenis)
      }
      const res = await fetch(`/api/dokumen?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const json = await res.json()
      setData(json.data ?? [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin, sekolahId, filterJenis])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <FileText className="size-5 text-blue-600" />
          Dokumen Pegawai
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filterJenis} onValueChange={setFilterJenis}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua Jenis" />
            </SelectTrigger>
            <SelectContent>
              {JENIS_DOKUMEN_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pegawai</TableHead>
                <TableHead>Sekolah</TableHead>
                <TableHead>Jenis Dokumen</TableHead>
                <TableHead>Nama File</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Tanggal Upload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="size-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada dokumen yang diupload</TableCell></TableRow>
              ) : data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.pegawai?.nama ?? '-'}</TableCell>
                  <TableCell>{d.sekolah?.namaSekolah ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {d.jenisDokumen?.replace(/_/g, ' ') ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{d.namaFile ?? '-'}</TableCell>
                  <TableCell>{d.ukuranFile ? `${(d.ukuranFile / 1024).toFixed(1)} KB` : '-'}</TableCell>
                  <TableCell>{new Date(d.uploadedAt).toLocaleDateString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
