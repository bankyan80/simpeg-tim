import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

interface SimpegStore {
  user: User | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  setMustChangePassword: (v: boolean) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;

  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  sekolahList: Sekolah[];
  loadSekolah: () => Promise<void>;

  pegawaiList: Pegawai[];
  pegawaiTotal: number;
  loadPegawai: (filters?: Record<string, string>) => Promise<void>;

  currentPegawai: Pegawai | null;
  loadPegawaiDetail: (id: string) => Promise<void>;

  absensiList: AbsensiPegawai[];
  absensiTotal: number;
  loadAbsensi: (filters?: Record<string, string>) => Promise<void>;

  validasiList: ValidasiData[];
  loadValidasi: (filters?: Record<string, string>) => Promise<void>;

  mutasiList: MutasiPegawai[];
  loadMutasi: (filters?: Record<string, string>) => Promise<void>;

  logList: LogAktivitas[];
  logTotal: number;
  loadLog: (filters?: Record<string, string>) => Promise<void>;

  dashboardStats: DashboardStats | null;
  loadDashboard: () => Promise<void>;

  pengaturan: Pengaturan[];
  loadPengaturan: () => Promise<void>;

  dbStatus: DbStatus;
  setDbStatus: (status: DbStatus) => void;

  loading: boolean;

  showPegawaiForm: boolean;
  editingPegawai: Pegawai | null;
  setShowPegawaiForm: (show: boolean, pegawai?: Pegawai | null) => void;

  showAbsensiForm: boolean;
  editingAbsensi: AbsensiPegawai | null;
  setShowAbsensiForm: (show: boolean, absensi?: AbsensiPegawai | null) => void;

  notification: Notification | null;
  setNotification: (n: Notification | null) => void;
}

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

export const useSimpegStore = create<SimpegStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      mustChangePassword: false,

      setMustChangePassword: (v: boolean) => set({ mustChangePassword: v }),

      changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
        try {
          const res = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, currentPassword, newPassword }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Gagal mengubah password' }));
            throw new Error(err.error || 'Gagal mengubah password');
          }
          set({ mustChangePassword: false });
          set({ notification: { type: 'success', message: 'Password berhasil diubah' } });
          return true;
        } catch (error) {
          set({
            notification: {
              type: 'error',
              message: error instanceof Error ? error.message : 'Gagal mengubah password',
            },
          });
          return false;
        }
      },

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
          const userData = data.data || data.user;
          set({
            user: userData,
            isAuthenticated: true,
            mustChangePassword: userData.mustChangePassword === true,
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

      currentPage: 'dashboard',
      setCurrentPage: (page: string) => {
        set({ currentPage: page });
        if (typeof window !== 'undefined') {
          window.history.pushState({ page }, '', window.location.pathname);
        }
      },

      sidebarOpen: false,
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

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

      dbStatus: 'connected',
      setDbStatus: (status: DbStatus) => set({ dbStatus: status }),

      loading: false,

      showPegawaiForm: false,
      editingPegawai: null,
      setShowPegawaiForm: (show: boolean, pegawai?: Pegawai | null) =>
        set({
          showPegawaiForm: show,
          editingPegawai: pegawai ?? null,
        }),

      showAbsensiForm: false,
      editingAbsensi: null,
      setShowAbsensiForm: (show: boolean, absensi?: AbsensiPegawai | null) =>
        set({
          showAbsensiForm: show,
          editingAbsensi: absensi ?? null,
        }),

      notification: null,
      setNotification: (n: Notification | null) => set({ notification: n }),
    }),
    {
      name: 'simpeg-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
