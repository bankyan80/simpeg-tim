import { create } from 'zustand';
import type {
  User,
  Sekolah,
  Pegawai,
  AbsensiPegawai,
  ValidasiData,
  MutasiPegawai,
  LogAktivitas,
  Pengaturan,
  DashboardStats,
  DbStatus,
  Notification,
} from './types';

// ============================================================================
// Store Interface
// ============================================================================

interface SimpegStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;

  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Data - Sekolah
  sekolahList: Sekolah[];
  loadSekolah: () => Promise<void>;

  // Data - Pegawai
  pegawaiList: Pegawai[];
  pegawaiTotal: number;
  loadPegawai: (filters?: Record<string, string>) => Promise<void>;

  // Data - Pegawai Detail
  currentPegawai: Pegawai | null;
  loadPegawaiDetail: (id: string) => Promise<void>;

  // Data - Absensi
  absensiList: AbsensiPegawai[];
  absensiTotal: number;
  loadAbsensi: (filters?: Record<string, string>) => Promise<void>;

  // Data - Validasi
  validasiList: ValidasiData[];
  loadValidasi: (filters?: Record<string, string>) => Promise<void>;

  // Data - Mutasi
  mutasiList: MutasiPegawai[];
  loadMutasi: (filters?: Record<string, string>) => Promise<void>;

  // Data - Log Aktivitas
  logList: LogAktivitas[];
  logTotal: number;
  loadLog: (filters?: Record<string, string>) => Promise<void>;

  // Data - Dashboard
  dashboardStats: DashboardStats | null;
  loadDashboard: () => Promise<void>;

  // Data - Pengaturan
  pengaturan: Pengaturan[];
  loadPengaturan: () => Promise<void>;

  // Connection status
  dbStatus: DbStatus;
  setDbStatus: (status: DbStatus) => void;

  // Loading state
  loading: boolean;

  // Dialog states - Pegawai
  showPegawaiForm: boolean;
  editingPegawai: Pegawai | null;
  setShowPegawaiForm: (show: boolean, pegawai?: Pegawai | null) => void;

  // Dialog states - Absensi
  showAbsensiForm: boolean;
  editingAbsensi: AbsensiPegawai | null;
  setShowAbsensiForm: (show: boolean, absensi?: AbsensiPegawai | null) => void;

  // Notification
  notification: Notification | null;
  setNotification: (n: Notification | null) => void;
}

// ============================================================================
// Helper: Build query string from filters
// ============================================================================

function buildQueryString(filters?: Record<string, string>): string {
  if (!filters || Object.keys(filters).length === 0) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useSimpegStore = create<SimpegStore>((set, get) => ({
  // ---- Auth State ----
  user: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Login gagal' }));
        throw new Error(err.error || 'Login gagal');
      }
      const data = await res.json();
      set({
        user: data.data || data.user,
        isAuthenticated: true,
        loading: false,
      });
      set({ notification: { type: 'success', message: 'Login berhasil' } });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Login gagal',
        },
      });
    }
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      currentPage: 'dashboard',
      sekolahList: [],
      pegawaiList: [],
      pegawaiTotal: 0,
      currentPegawai: null,
      absensiList: [],
      absensiTotal: 0,
      validasiList: [],
      mutasiList: [],
      logList: [],
      logTotal: 0,
      dashboardStats: null,
      pengaturan: [],
    });
    set({ notification: { type: 'info', message: 'Anda telah logout' } });
  },

  // ---- Navigation State ----
  currentPage: 'dashboard',
  setCurrentPage: (page: string) => set({ currentPage: page }),

  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // ---- Sekolah Data ----
  sekolahList: [],

  loadSekolah: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/sekolah');
      if (!res.ok) throw new Error('Gagal memuat data sekolah');
      const data = await res.json();
      set({ sekolahList: data.data ?? data, loading: false });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat data sekolah',
        },
      });
    }
  },

  // ---- Pegawai Data ----
  pegawaiList: [],
  pegawaiTotal: 0,

  loadPegawai: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/pegawai${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data pegawai');
      const data = await res.json();
      set({
        pegawaiList: data.data ?? data,
        pegawaiTotal: data.total ?? (Array.isArray(data) ? data.length : 0),
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat data pegawai',
        },
      });
    }
  },

  // ---- Pegawai Detail ----
  currentPegawai: null,

  loadPegawaiDetail: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/pegawai/${id}`);
      if (!res.ok) throw new Error('Gagal memuat detail pegawai');
      const data = await res.json();
      set({ currentPegawai: data, loading: false });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat detail pegawai',
        },
      });
    }
  },

  // ---- Absensi Data ----
  absensiList: [],
  absensiTotal: 0,

  loadAbsensi: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/absensi${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data absensi');
      const data = await res.json();
      set({
        absensiList: data.data ?? data,
        absensiTotal: data.total ?? (Array.isArray(data) ? data.length : 0),
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat data absensi',
        },
      });
    }
  },

  // ---- Validasi Data ----
  validasiList: [],

  loadValidasi: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/validasi${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data validasi');
      const data = await res.json();
      set({
        validasiList: data.data ?? data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat data validasi',
        },
      });
    }
  },

  // ---- Mutasi Data ----
  mutasiList: [],

  loadMutasi: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/mutasi${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data mutasi');
      const data = await res.json();
      set({
        mutasiList: data.data ?? data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat data mutasi',
        },
      });
    }
  },

  // ---- Log Aktivitas ----
  logList: [],
  logTotal: 0,

  loadLog: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/log${qs}`);
      if (!res.ok) throw new Error('Gagal memuat log aktivitas');
      const data = await res.json();
      set({
        logList: data.data ?? data,
        logTotal: data.total ?? (Array.isArray(data) ? data.length : 0),
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat log aktivitas',
        },
      });
    }
  },

  // ---- Dashboard Stats ----
  dashboardStats: null,

  loadDashboard: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Gagal memuat dashboard');
      const data = await res.json();
      set({ dashboardStats: data, loading: false });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat dashboard',
        },
      });
    }
  },

  // ---- Pengaturan ----
  pengaturan: [],

  loadPengaturan: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/pengaturan');
      if (!res.ok) throw new Error('Gagal memuat pengaturan');
      const data = await res.json();
      set({ pengaturan: data, loading: false });
    } catch (error) {
      set({ loading: false });
      set({
        notification: {
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat pengaturan',
        },
      });
    }
  },

  // ---- Connection Status ----
  dbStatus: 'connected',
  setDbStatus: (status: DbStatus) => set({ dbStatus: status }),

  // ---- Loading State ----
  loading: false,

  // ---- Dialog States - Pegawai ----
  showPegawaiForm: false,
  editingPegawai: null,
  setShowPegawaiForm: (show: boolean, pegawai?: Pegawai | null) =>
    set({
      showPegawaiForm: show,
      editingPegawai: pegawai ?? null,
    }),

  // ---- Dialog States - Absensi ----
  showAbsensiForm: false,
  editingAbsensi: null,
  setShowAbsensiForm: (show: boolean, absensi?: AbsensiPegawai | null) =>
    set({
      showAbsensiForm: show,
      editingAbsensi: absensi ?? null,
    }),

  // ---- Notification ----
  notification: null,
  setNotification: (n: Notification | null) => set({ notification: n }),
}));
