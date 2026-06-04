// ============================================================================
// SIMPEG Kecamatan - TypeScript Type Definitions
// Based on Prisma schema (SQLite - dates stored as strings)
// ============================================================================

// --- Core Model Interfaces ---

export interface User {
  id: string;
  nama: string;
  email: string;
  role: string; // 'admin_kecamatan' | 'operator'
  sekolahId: string | null;
  status: string; // 'aktif' | 'nonaktif'
  foto: string | null;
  createdAt: string;
  updatedAt: string;
  sekolah?: Sekolah;
  logAktivitas?: LogAktivitas[];
  absensiInput?: AbsensiPegawai[];
}

export interface Sekolah {
  id: string;
  npsn: string;
  namaSekolah: string;
  jenjang: string; // 'SD' | 'TK' | 'KB/PAUD'
  kecamatan: string;
  desa: string | null;
  alamat: string | null;
  kepalaSekolah: string | null;
  status: string; // 'aktif'
  createdAt: string;
  updatedAt: string;
  users?: User[];
  pegawai?: Pegawai[];
  absensi?: AbsensiPegawai[];
  validasi?: ValidasiData[];
  mutasiAsal?: MutasiPegawai[];
  mutasiTujuan?: MutasiPegawai[];
  _count?: {
    pegawai?: number;
  };
}

export interface Pegawai {
  id: string;
  sekolahId: string;
  nik: string;
  nip: string | null;
  nuptk: string | null;
  nama: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string | null; // 'L' | 'P'
  agama: string | null;
  alamat: string | null;
  noHp: string | null;
  email: string | null;
  foto: string | null;
  jabatan: string | null;
  jenisPegawai: string | null; // 'Guru' | 'Tendik'
  statusKepegawaian: string | null; // 'PNS' | 'PPPK' | 'PPPK_Paruh_Waktu' | 'Honorer' | 'GTY' | 'GTT' | 'Tenaga_Administrasi' | 'Penjaga_Sekolah' | 'Kepala_Sekolah'
  statusPegawai: string; // 'aktif' | 'tidak_aktif' | 'pensiun' | 'mutasi'
  pangkat: string | null;
  golongan: string | null;
  pendidikanTerakhir: string | null;
  jurusan: string | null;
  sertifikasi: string | null; // 'Belum' | 'Proses' | 'Terisi'
  nomorSertifikat: string | null;
  bidangSertifikasi: string | null;
  tahunSertifikasi: string | null;
  nrg: string | null;
  statusTpg: string | null;
  tmtTugas: string | null;
  tmtSekolah: string | null;
  tmtJabatan: string | null;
  tmtPangkat: string | null;
  masaKerjaTahun: number;
  masaKerjaBulan: number;
  tahunPensiun: number | null;
  statusBup: string | null; // 'aktif' | 'akan_pensiun' | 'sudah_pensiun'
  keteranganBup: string | null;
  createdAt: string;
  updatedAt: string;
  sekolah?: Sekolah;
  riwayatPendidikan?: RiwayatPendidikan[];
  riwayatJabatan?: RiwayatJabatan[];
  riwayatPangkat?: RiwayatPangkat[];
  riwayatSertifikasi?: RiwayatSertifikasi[];
  riwayatMutasi?: RiwayatMutasi[];
  riwayatPelatihan?: RiwayatPelatihan[];
  dokumenPegawai?: DokumenPegawai[];
  absensi?: AbsensiPegawai[];
  validasi?: ValidasiData[];
  mutasi?: MutasiPegawai[];
}

export interface RiwayatPendidikan {
  id: string;
  pegawaiId: string;
  jenjang: string | null;
  jurusan: string | null;
  namaSekolahKampus: string | null;
  tahunLulus: string | null;
  nomorIjazah: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
}

export interface RiwayatJabatan {
  id: string;
  pegawaiId: string;
  jabatan: string | null;
  unitKerja: string | null;
  tmtJabatan: string | null;
  nomorSk: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
}

export interface RiwayatPangkat {
  id: string;
  pegawaiId: string;
  pangkat: string | null;
  golongan: string | null;
  tmtPangkat: string | null;
  nomorSk: string | null;
  tanggalSk: string | null;
  pejabatSk: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
}

export interface RiwayatSertifikasi {
  id: string;
  pegawaiId: string;
  statusSertifikasi: string | null;
  nomorSertifikat: string | null;
  bidangSertifikasi: string | null;
  tahunSertifikasi: string | null;
  nrg: string | null;
  statusTpg: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
}

export interface RiwayatMutasi {
  id: string;
  pegawaiId: string;
  sekolahAsal: string | null;
  sekolahTujuan: string | null;
  tanggalMutasi: string | null;
  nomorSk: string | null;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
}

export interface RiwayatPelatihan {
  id: string;
  pegawaiId: string;
  namaPelatihan: string | null;
  penyelenggara: string | null;
  tahunPelatihan: string | null;
  nomorSertifikat: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
}

export interface DokumenPegawai {
  id: string;
  pegawaiId: string;
  jenisDokumen: string | null; // 'KTP' | 'KK' | 'Ijazah' | 'SK_Pengangkatan' | 'SK_Pangkat' | 'Sertifikat_Pendidik' | 'Kartu_ASN_PPPK' | 'Dokumen_Lainnya'
  namaFile: string | null;
  urlFile: string | null;
  ukuranFile: number | null;
  uploadedAt: string;
  pegawai?: Pegawai;
}

export interface AbsensiPegawai {
  id: string;
  tanggal: string;
  pegawaiId: string;
  nip: string | null;
  namaPegawai: string;
  unitKerja: string;
  statusPegawai: string | null; // 'PNS' | 'PPPK' | 'PPPK_Paruh_Waktu'
  jamMasuk: string | null;
  jamKeluar: string | null;
  keterangan: string | null; // 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alfa' | 'Dinas_Luar' | 'Cuti' | 'lainnya'
  sekolahId: string;
  inputBy: string;
  statusValidasi: string; // 'pending' | 'divalidasi' | 'ditolak'
  validatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
  sekolah?: Sekolah;
  inputByUser?: User;
}

export interface ValidasiData {
  id: string;
  pegawaiId: string | null;
  sekolahId: string | null;
  jenisPengajuan: string | null; // 'data_baru' | 'perubahan_data' | 'mutasi' | 'pensiun' | 'tidak_aktif'
  statusValidasi: string; // 'pending' | 'divalidasi' | 'ditolak'
  catatanAdmin: string | null;
  dataPerubahan: string | null; // JSON string of changes
  tanggalPengajuan: string;
  tanggalValidasi: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai | null;
  sekolah?: Sekolah | null;
}

export interface MutasiPegawai {
  id: string;
  pegawaiId: string;
  sekolahAsalId: string;
  sekolahTujuanId: string;
  tanggalMutasi: string | null;
  nomorSk: string | null;
  keterangan: string | null;
  status: string; // 'pending' | 'disetujui' | 'ditolak'
  createdAt: string;
  updatedAt: string;
  pegawai?: Pegawai;
  sekolahAsal?: Sekolah;
  sekolahTujuan?: Sekolah;
}

export interface LogAktivitas {
  id: string;
  userId: string;
  aksi: string | null; // 'login' | 'tambah' | 'edit' | 'hapus' | 'validasi' | 'export' | 'cetak'
  modul: string | null; // 'pegawai' | 'absensi' | 'validasi' | 'mutasi' | 'sekolah' | 'pengaturan'
  keterangan: string | null;
  createdAt: string;
  user?: User;
}

export interface Pengaturan {
  id: string;
  key: string;
  value: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Aggregate / Summary Interfaces ---

export interface DashboardStats {
  totalPegawai: number;
  totalGuru: number;
  totalTendik: number;
  totalPns: number;
  totalPppk: number;
  totalHonorer: number;
  totalGtt: number;
  totalGty: number;
  totalSekolah: number;
  totalSd: number;
  totalTk: number;
  totalPaud: number;
  pegawaiAktif: number;
  pegawaiPensiun: number;
  pegawaiMutasi: number;
  akanPensiun: number;
  sertifikasiTerisi: number;
  sertifikasiBelum: number;
  sertifikasiProses: number;
  validasiPending: number;
  mutasiPending: number;
  absensiHariIni: number;
}

export interface RekapSekolah {
  id: string;
  npsn: string;
  namaSekolah: string;
  jenjang: string;
  desa: string | null;
  kecamatan: string;
  totalPegawai: number;
  totalGuru: number;
  totalTendik: number;
  totalPns: number;
  totalPppk: number;
  totalHonorer: number;
  totalGtt: number;
  totalGty: number;
  sertifikasiTerisi: number;
  sertifikasiBelum: number;
  akanPensiun: number;
}

export interface AbsensiRekap {
  sekolahId: string;
  namaSekolah: string;
  tanggal: string;
  totalHadir: number;
  totalTerlambat: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalDinasLuar: number;
  totalCuti: number;
  totalPegawai: number;
}

// --- Page Route Type ---

export type PageRoute =
  | 'dashboard'
  | 'pegawai'
  | 'pegawai-detail'
  | 'absensi'
  | 'validasi'
  | 'mutasi'
  | 'sekolah'
  | 'log-aktivitas'
  | 'pengaturan'
  | 'rekap-sekolah'
  | 'profil';

// --- Enum-like constant types (for reference / type narrowing) ---

export type UserRole = 'admin_kecamatan' | 'operator';
export type UserStatus = 'aktif' | 'nonaktif';
export type JenjangSekolah = 'SD' | 'TK' | 'KB/PAUD';
export type JenisKelamin = 'L' | 'P';
export type JenisPegawai = 'Guru' | 'Tendik';
export type StatusKepegawaian =
  | 'PNS'
  | 'PPPK'
  | 'PPPK_Paruh_Waktu'
  | 'Honorer'
  | 'GTY'
  | 'GTT'
  | 'Tenaga_Administrasi'
  | 'Penjaga_Sekolah'
  | 'Kepala_Sekolah';
export type StatusPegawai = 'aktif' | 'tidak_aktif' | 'pensiun' | 'mutasi';
export type StatusSertifikasi = 'Belum' | 'Proses' | 'Terisi';
export type StatusBup = 'aktif' | 'akan_pensiun' | 'sudah_pensiun';
export type JenisDokumen =
  | 'KTP'
  | 'KK'
  | 'Ijazah'
  | 'SK_Pengangkatan'
  | 'SK_Pangkat'
  | 'Sertifikat_Pendidik'
  | 'Kartu_ASN_PPPK'
  | 'Dokumen_Lainnya';
export type KeteranganAbsensi = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alfa' | 'Dinas_Luar' | 'Cuti' | 'lainnya';
export type StatusValidasi = 'pending' | 'divalidasi' | 'ditolak';
export type JenisPengajuan = 'data_baru' | 'perubahan_data' | 'mutasi' | 'pensiun' | 'tidak_aktif';
export type StatusMutasi = 'pending' | 'disetujui' | 'ditolak';
export type AksiLog = 'login' | 'tambah' | 'edit' | 'hapus' | 'validasi' | 'export' | 'cetak';
export type ModulLog = 'pegawai' | 'absensi' | 'validasi' | 'mutasi' | 'sekolah' | 'pengaturan';

// --- Notification Type ---

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  type: NotificationType;
  message: string;
}

// --- Db Connection Status ---

export type DbStatus = 'connected' | 'slow' | 'disconnected' | 'syncing';
