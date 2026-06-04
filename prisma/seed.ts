import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function loadJSON<T>(filename: string): T {
  const filePath = path.join(__dirname, '..', filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw.replace(/^\uFEFF/, ''))
}

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function mapStatusKepegawaian(status: string): string {
  const map: Record<string, string> = {
    'PNS': 'PNS',
    'PPPK': 'PPPK',
    'PPPK Paruh Waktu': 'PPPK_Paruh_Waktu',
    'Honor Daerah TK.II Kab/Kota': 'Honorer',
    'Tenaga Honor Sekolah': 'Honorer',
    'Guru Honor Sekolah': 'Honorer',
  }
  return map[status] || 'Honorer'
}

function mapJenisPegawai(jenis: string): string {
  const map: Record<string, string> = {
    'Guru': 'Guru',
    'Tenaga Kependidikan': 'Tendik',
    'Kepala Sekolah': 'Guru',
  }
  return map[jenis] || 'Guru'
}

async function main() {
  console.log('Seeding database with real data...\n')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.logAktivitas.deleteMany()
  await prisma.absensiPegawai.deleteMany()
  await prisma.mutasiPegawai.deleteMany()
  await prisma.validasiData.deleteMany()
  await prisma.dokumenPegawai.deleteMany()
  await prisma.riwayatPelatihan.deleteMany()
  await prisma.riwayatMutasi.deleteMany()
  await prisma.riwayatSertifikasi.deleteMany()
  await prisma.riwayatPangkat.deleteMany()
  await prisma.riwayatJabatan.deleteMany()
  await prisma.riwayatPendidikan.deleteMany()
  await prisma.pegawai.deleteMany()
  await prisma.user.deleteMany()
  await prisma.sekolah.deleteMany()
  await prisma.pengaturan.deleteMany()
  console.log('All data cleared.\n')

  // ── Users ────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      nama: 'Admin Kecamatan',
      email: 'admin@simpeg.id',
      role: 'admin_kecamatan',
      status: 'aktif',
    },
  })
  console.log(`Admin: ${admin.email}`)

  const operator = await prisma.user.create({
    data: {
      nama: 'Operator Default',
      email: 'operator@simpeg.id',
      role: 'operator',
      status: 'aktif',
    },
  })
  console.log(`Operator: ${operator.email}`)

  // ── Sekolah ──────────────────────────────────────────────────────
  type SekolahJSON = {
    nama: string
    npsn: string
    desa: string
    jenjang: string
    address?: string
  }

  const sekolahData = loadJSON<SekolahJSON[]>('data-sekolah.json')
  const sekolahByNama: Record<string, string> = {}

  for (const s of sekolahData) {
    const sekolah = await prisma.sekolah.create({
      data: {
        npsn: s.npsn,
        namaSekolah: s.nama,
        jenjang: s.jenjang,
        desa: s.desa || '',
        alamat: s.address || '',
        kecamatan: 'Lemahabang',
        status: 'aktif',
      },
    })
    sekolahByNama[s.nama] = sekolah.id
  }
  console.log(`Imported ${sekolahData.length} sekolah\n`)

  // ── Pegawai ──────────────────────────────────────────────────────
  type PegawaiJSON = {
    nik: string
    nama: string
    jk: string
    nuptk?: string
    tanggal_lahir?: string
    nip?: string
    status_kepegawaian: string
    jenis_ptk: string
    tugas_tambahan?: string
    sertifikasi?: string
    tmt: string
    sekolah: string
  }

  const pegawaiData = loadJSON<PegawaiJSON[]>('data-pegawai.json')
  let imported = 0
  let skipped = 0

  for (const p of pegawaiData) {
    const sekolahId = sekolahByNama[p.sekolah]
    if (!sekolahId) {
      skipped++
      continue
    }

    const jenisPegawai = mapJenisPegawai(p.jenis_ptk)
    const tmtDate = parseDate(p.tmt)
    const lahir = parseDate(p.tanggal_lahir)
    const tahunPensiun = jenisPegawai === 'Guru' && lahir ? lahir.getFullYear() + 60 : null

    let statusBup = 'aktif'
    if (tahunPensiun) {
      const currentYear = new Date().getFullYear()
      if (tahunPensiun < currentYear) statusBup = 'sudah_pensiun'
      else if (tahunPensiun <= currentYear + 1) statusBup = 'akan_pensiun'
    }

    const hasSertifikasi = p.sertifikasi && p.sertifikasi.trim() !== ''

    await prisma.pegawai.upsert({
      where: { nik: p.nik?.toString() || '' },
      update: {},
      create: {
        sekolahId,
        nik: p.nik?.toString() || '',
        nip: p.nip || null,
        nuptk: p.nuptk || null,
        nama: p.nama,
        tempatLahir: null,
        tanggalLahir: lahir,
        jenisKelamin: p.jk || null,
        agama: null,
        alamat: null,
        noHp: null,
        email: null,
        jabatan: p.tugas_tambahan || null,
        jenisPegawai,
        statusKepegawaian: mapStatusKepegawaian(p.status_kepegawaian),
        statusPegawai: 'aktif',
        sertifikasi: hasSertifikasi ? 'Terisi' : 'Belum',
        bidangSertifikasi: hasSertifikasi ? p.sertifikasi : null,
        tmtTugas: tmtDate || undefined,
        masaKerjaTahun: 0,
        masaKerjaBulan: 0,
        tahunPensiun: tahunPensiun || undefined,
        statusBup,
      },
    })
    imported++
  }
  console.log(`Imported ${imported} pegawai (skipped ${skipped} without matching sekolah)\n`)

  // ── PLT ──────────────────────────────────────────────────────────
  type PltJSON = {
    sekolah: string
    plt_dari: string
    plt_nama: string
    plt_nip: string
    npsn: string
  }

  const pltData = loadJSON<PltJSON[]>('data-plt.json')
  let pltUpdated = 0

  for (const plt of pltData) {
    const sekolah = await prisma.sekolah.findUnique({ where: { npsn: plt.npsn } })
    if (sekolah) {
      await prisma.sekolah.update({
        where: { id: sekolah.id },
        data: {
          kepalaSekolah: plt.plt_nama,
        },
      })
      pltUpdated++
    }
  }
  console.log(`Updated ${pltUpdated} schools with PLT data\n`)

  // ── Pengaturan ───────────────────────────────────────────────────
  await prisma.pengaturan.createMany({
    data: [
      { key: 'kecamatan', value: 'Lemahabang' },
      { key: 'kabupaten', value: 'Cirebon' },
      { key: 'provinsi', value: 'Jawa Barat' },
    ],
  })
  console.log('Created pengaturan\n')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
