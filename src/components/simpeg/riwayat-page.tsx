'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSimpegStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Briefcase, ArrowRightLeft, GraduationCap, Award, BookOpen } from 'lucide-react'

interface RiwayatItem {
  id: string
  pegawaiId: string
  pegawai?: { nama: string; nip: string | null; nik: string | null } | null
  [key: string]: unknown
}

export default function RiwayatPage() {
  const { user } = useSimpegStore()

  const isAdmin = user?.role === 'admin_kecamatan'
  const sekolahId = user?.sekolahId ?? ''

  const [tab, setTab] = useState('jabatan')
  const [data, setData] = useState<RiwayatItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (jenis: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ jenis })
      if (!isAdmin && sekolahId) {
        params.set('sekolahId', sekolahId)
      }
      const res = await fetch(`/api/riwayat?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const json = await res.json()
      setData(json.data ?? [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin, sekolahId])

  useEffect(() => {
    fetchData(tab)
  }, [tab, fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <BookOpen className="size-5 text-blue-600" />
          Riwayat Pegawai
        </h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <ScrollArea className="w-full">
          <TabsList className="w-max">
            <TabsTrigger value="jabatan"><Briefcase className="size-3.5 mr-1" /> Riwayat Jabatan</TabsTrigger>
            <TabsTrigger value="mutasi"><ArrowRightLeft className="size-3.5 mr-1" /> Riwayat Mutasi</TabsTrigger>
            <TabsTrigger value="pelatihan"><GraduationCap className="size-3.5 mr-1" /> Riwayat Pelatihan</TabsTrigger>
            <TabsTrigger value="pendidikan"><Award className="size-3.5 mr-1" /> Riwayat Pendidikan</TabsTrigger>
            <TabsTrigger value="pangkat"><Award className="size-3.5 mr-1" /> Riwayat Pangkat</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="jabatan">
          <Card>
            <CardHeader><CardTitle className="text-blue-800 text-base">Riwayat Jabatan</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>TMT</TableHead>
                    <TableHead>No. SK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="size-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.pegawai?.nama ?? '-'}</TableCell>
                      <TableCell>{r.pegawai?.nip ?? '-'}</TableCell>
                      <TableCell>{(r as { jabatan?: string }).jabatan ?? '-'}</TableCell>
                      <TableCell>{(r as { unitKerja?: string }).unitKerja ?? '-'}</TableCell>
                      <TableCell>{(r as { tmtJabatan?: string }).tmtJabatan ? new Date((r as { tmtJabatan: string }).tmtJabatan).toLocaleDateString('id-ID') : '-'}</TableCell>
                      <TableCell>{(r as { nomorSk?: string }).nomorSk ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mutasi">
          <Card>
            <CardHeader><CardTitle className="text-blue-800 text-base">Riwayat Mutasi</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Sekolah Asal</TableHead>
                    <TableHead>Sekolah Tujuan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. SK</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="size-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.pegawai?.nama ?? '-'}</TableCell>
                      <TableCell>{r.pegawai?.nip ?? '-'}</TableCell>
                      <TableCell>{(r as { sekolahAsal?: string }).sekolahAsal ?? '-'}</TableCell>
                      <TableCell>{(r as { sekolahTujuan?: string }).sekolahTujuan ?? '-'}</TableCell>
                      <TableCell>{(r as { tanggalMutasi?: string }).tanggalMutasi ? new Date((r as { tanggalMutasi: string }).tanggalMutasi).toLocaleDateString('id-ID') : '-'}</TableCell>
                      <TableCell>{(r as { nomorSk?: string }).nomorSk ?? '-'}</TableCell>
                      <TableCell>{(r as { keterangan?: string }).keterangan ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pelatihan">
          <Card>
            <CardHeader><CardTitle className="text-blue-800 text-base">Riwayat Pelatihan</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama Pelatihan</TableHead>
                    <TableHead>Penyelenggara</TableHead>
                    <TableHead>Tahun</TableHead>
                    <TableHead>No. Sertifikat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="size-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.pegawai?.nama ?? '-'}</TableCell>
                      <TableCell>{r.pegawai?.nip ?? '-'}</TableCell>
                      <TableCell>{(r as { namaPelatihan?: string }).namaPelatihan ?? '-'}</TableCell>
                      <TableCell>{(r as { penyelenggara?: string }).penyelenggara ?? '-'}</TableCell>
                      <TableCell>{(r as { tahunPelatihan?: string }).tahunPelatihan ?? '-'}</TableCell>
                      <TableCell>{(r as { nomorSertifikat?: string }).nomorSertifikat ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendidikan">
          <Card>
            <CardHeader><CardTitle className="text-blue-800 text-base">Riwayat Pendidikan</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Jenjang</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>PT/Sekolah</TableHead>
                    <TableHead>Tahun Lulus</TableHead>
                    <TableHead>No. Ijazah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="size-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.pegawai?.nama ?? '-'}</TableCell>
                      <TableCell>{r.pegawai?.nip ?? '-'}</TableCell>
                      <TableCell>{(r as { jenjang?: string }).jenjang ?? '-'}</TableCell>
                      <TableCell>{(r as { jurusan?: string }).jurusan ?? '-'}</TableCell>
                      <TableCell>{(r as { namaSekolahKampus?: string }).namaSekolahKampus ?? '-'}</TableCell>
                      <TableCell>{(r as { tahunLulus?: string }).tahunLulus ?? '-'}</TableCell>
                      <TableCell>{(r as { nomorIjazah?: string }).nomorIjazah ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pangkat">
          <Card>
            <CardHeader><CardTitle className="text-blue-800 text-base">Riwayat Pangkat</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Pangkat</TableHead>
                    <TableHead>Golongan</TableHead>
                    <TableHead>TMT</TableHead>
                    <TableHead>No. SK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="size-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.pegawai?.nama ?? '-'}</TableCell>
                      <TableCell>{r.pegawai?.nip ?? '-'}</TableCell>
                      <TableCell>{(r as { pangkat?: string }).pangkat ?? '-'}</TableCell>
                      <TableCell>{(r as { golongan?: string }).golongan ?? '-'}</TableCell>
                      <TableCell>{(r as { tmtPangkat?: string }).tmtPangkat ? new Date((r as { tmtPangkat: string }).tmtPangkat).toLocaleDateString('id-ID') : '-'}</TableCell>
                      <TableCell>{(r as { nomorSk?: string }).nomorSk ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
