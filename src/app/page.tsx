'use client'

import { useSimpegStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import {
  LayoutDashboard, Users, ClipboardList, CheckSquare, ArrowRightLeft,
  CalendarClock, FileBarChart, History, Building2, Settings, User,
  LogOut, Menu, X, Bell, Shield, Map, School, FileUp, Send, Printer,
  BookOpen, Loader2, Eye, EyeOff, Lock, LogIn, AlertCircle,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Lazy-load page components for better performance
const PublicView = dynamic(() => import('@/components/simpeg/public-view'), { ssr: false })
const AdminDashboard = dynamic(() => import('@/components/simpeg/admin-dashboard'), { ssr: false })
const OperatorDashboard = dynamic(() => import('@/components/simpeg/operator-dashboard'), { ssr: false })
const PegawaiPage = dynamic(() => import('@/components/simpeg/pegawai-page'), { ssr: false })
const AbsensiPage = dynamic(() => import('@/components/simpeg/absensi-page'), { ssr: false })
const ValidasiPage = dynamic(() => import('@/components/simpeg/validasi-page'), { ssr: false })
const MutasiPage = dynamic(() => import('@/components/simpeg/mutasi-page'), { ssr: false })
const RiwayatPage = dynamic(() => import('@/components/simpeg/riwayat-page'), { ssr: false })
const DokumenPage = dynamic(() => import('@/components/simpeg/dokumen-page'), { ssr: false })
const BupPage = dynamic(() => import('@/components/simpeg/bup-page'), { ssr: false })
const LaporanPage = dynamic(() => import('@/components/simpeg/laporan-page'), { ssr: false })
const LogPage = dynamic(() => import('@/components/simpeg/log-page'), { ssr: false })
const SekolahPage = dynamic(() => import('@/components/simpeg/sekolah-page'), { ssr: false })
const PengaturanPage = dynamic(() => import('@/components/simpeg/pengaturan-page'), { ssr: false })
const ProfilPage = dynamic(() => import('@/components/simpeg/profil-page'), { ssr: false })

// Page titles map
const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  pegawai: 'Data Pegawai',
  absensi: 'Absensi Pegawai',
  validasi: 'Validasi Data',
  mutasi: 'Mutasi Pegawai',
  bup: 'BUP / Pensiun',
  laporan: 'Laporan',
  sekolah: 'Data Sekolah',
  'log-aktivitas': 'Log Aktivitas',
  pengaturan: 'Pengaturan',
  profil: 'Profil Sekolah',
  'mapping-pegawai': 'Mapping Pegawai',
  'riwayat-pegawai': 'Riwayat Pegawai',
  'dokumen-pegawai': 'Dokumen Pegawai',
  pengajuan: 'Pengajuan',
  cetak: 'Cetak',
  'pegawai-detail': 'Detail Pegawai',
}

// Admin menu items
const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pegawai', label: 'Data Pegawai', icon: Users },
  { id: 'sekolah', label: 'Data Sekolah', icon: School },
  { id: 'validasi', label: 'Validasi Data', icon: CheckSquare, badge: true },
  { id: 'mapping-pegawai', label: 'Mapping Pegawai', icon: Map },
  { id: 'mutasi', label: 'Mutasi Pegawai', icon: ArrowRightLeft, badge: true },
  { id: 'bup', label: 'BUP / Pensiun', icon: CalendarClock },
  { id: 'absensi', label: 'Absensi Pegawai', icon: ClipboardList },
  { id: 'laporan', label: 'Laporan', icon: FileBarChart },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  { id: 'log-aktivitas', label: 'Log Aktivitas', icon: History },
]

// Operator menu items
const operatorMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pegawai', label: 'Data Pegawai', icon: Users },
  { id: 'riwayat-pegawai', label: 'Riwayat Pegawai', icon: BookOpen },
  { id: 'dokumen-pegawai', label: 'Dokumen Pegawai', icon: FileUp },
  { id: 'absensi', label: 'Absensi Pegawai', icon: ClipboardList },
  { id: 'pengajuan', label: 'Pengajuan', icon: Send },
  { id: 'bup', label: 'BUP / Pensiun', icon: CalendarClock },
  { id: 'laporan', label: 'Cetak & Laporan', icon: Printer },
  { id: 'profil', label: 'Profil Sekolah', icon: Building2 },
]

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage() {
  const { login, loading, notification, setNotification } = useSimpegStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (!username.trim() || !password.trim()) {
      setLoginError('Username dan password wajib diisi')
      return
    }
    await login(username.trim(), password.trim())
  }, [login, username, password])

  // Auto-detect role based on username
  const detectedRole = username === 'admin-kepeg' ? 'admin' : username && /^\d+$/.test(username) ? 'operator' : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-[#0c1a3a] to-blue-900 p-4">


      <div className="w-full max-w-md relative z-10">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/logokab.png"
              alt="Logo Kabupaten Cirebon"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white">SIMPEG</h1>
          <p className="text-blue-300 font-medium">Sistem Informasi Manajemen Pegawai</p>
          <p className="text-sm text-blue-400 mt-1">Tim Kerja Dinas Pendidikan Kecamatan Lemahabang</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-blue-700/30 rounded-2xl p-6 shadow-2xl shadow-blue-950/50">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role indicator */}
            {detectedRole && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                detectedRole === 'admin'
                  ? 'bg-blue-800/40 text-blue-200 border border-blue-600/30'
                  : 'bg-sky-800/40 text-sky-200 border border-sky-600/30'
              }`}>
                {detectedRole === 'admin' ? <Shield className="w-4 h-4" /> : <School className="w-4 h-4" />}
                {detectedRole === 'admin' ? 'Admin Kecamatan' : 'Operator Sekolah'}
              </div>
            )}

            {/* Username field */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin-kepeg atau NPSN sekolah"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-blue-600/30 rounded-lg text-white placeholder:text-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-blue-600/30 rounded-lg text-white placeholder:text-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {(loginError || (notification?.type === 'error' && notification.message)) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loginError || notification?.message}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Public view link */}
        <div className="text-center mt-6">
          <button
            onClick={() => useSimpegStore.getState().setCurrentPage('public')}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline inline-flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Lihat Data Publik
          </button>
        </div>

        <p className="text-center text-xs text-blue-500 mt-4">
          SIMPEG &mdash; Tim Kerja Dinas Pendidikan Kec. Lemahabang &copy; 2026
        </p>
      </div>
    </div>
  )
}

// ============================================================
// MAIN APP LAYOUT
// ============================================================
function MainApp() {
  const {
    user, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen,
    sidebarCollapsed, toggleSidebar,
    logout, notification, setNotification, dbStatus, validasiList,
    loadValidasi, loadDashboard, loadSekolah,
    mustChangePassword, setMustChangePassword, changePassword
  } = useSimpegStore()

  const isAdmin = user?.role === 'admin_kecamatan'
  const menuItems = isAdmin ? adminMenuItems : operatorMenuItems

  // Load initial data sequentially to avoid SQLite concurrency crashes
  useEffect(() => {
    async function loadData() {
      await loadDashboard()
      await loadSekolah()
      await loadValidasi({ statusValidasi: 'pending' })
    }
    loadData()
  }, [loadDashboard, loadSekolah, loadValidasi])

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, setNotification])

  // Change Password dialog
  const [cpwCurrent, setCpwCurrent] = useState('')
  const [cpwNew, setCpwNew] = useState('')
  const [cpwConfirm, setCpwConfirm] = useState('')
  const [cpwError, setCpwError] = useState('')
  const [cpwSubmitting, setCpwSubmitting] = useState(false)

  const handleChangePassword = useCallback(async () => {
    setCpwError('')
    if (!cpwCurrent) { setCpwError('Password saat ini wajib diisi'); return }
    if (!cpwNew) { setCpwError('Password baru wajib diisi'); return }
    if (cpwNew.length < 6) { setCpwError('Password baru minimal 6 karakter'); return }
    if (cpwNew !== cpwConfirm) { setCpwError('Konfirmasi password tidak cocok'); return }
    if (!user) return
    setCpwSubmitting(true)
    try {
      const ok = await changePassword(user.id, cpwCurrent, cpwNew)
      if (ok) {
        setCpwCurrent('')
        setCpwNew('')
        setCpwConfirm('')
      }
    } finally {
      setCpwSubmitting(false)
    }
  }, [cpwCurrent, cpwNew, cpwConfirm, user, changePassword])

  // Show change password dialog on mount if mustChangePassword
  useEffect(() => {
    if (mustChangePassword) {
      setCpwError('')
      setCpwCurrent('')
      setCpwNew('')
      setCpwConfirm('')
    }
  }, [mustChangePassword])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const page = (e.state as { page?: string })?.page
      if (page) setCurrentPage(page)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setCurrentPage])

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    const s = useSimpegStore.getState()
    try {
      switch (currentPage) {
        case 'dashboard':
          await s.loadDashboard()
          await s.loadSekolah()
          await s.loadValidasi({ statusValidasi: 'pending' })
          break
        case 'pegawai':
        case 'mapping-pegawai':
        case 'riwayat-pegawai':
        case 'dokumen-pegawai':
        case 'bup':
        case 'pegawai-detail':
          await s.loadPegawai()
          break
        case 'absensi':
          await s.loadAbsensi()
          break
        case 'validasi':
        case 'pengajuan':
          await s.loadValidasi()
          break
        case 'mutasi':
          await s.loadMutasi()
          break
        case 'laporan':
        case 'cetak':
          await s.loadPegawai()
          break
        case 'log-aktivitas':
          await s.loadLog()
          break
        case 'sekolah':
        case 'profil':
          await s.loadSekolah()
          break
        case 'pengaturan':
          await s.loadPengaturan()
          break
      }
    } finally {
      setRefreshing(false)
    }
  }, [currentPage])

  // Close sidebar on page change (mobile)
  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page)
    setSidebarOpen(false)
  }, [setCurrentPage, setSidebarOpen])

  // Render current page
  function renderPage() {
    // Admin-specific dashboard
    if (currentPage === 'dashboard' && isAdmin) {
      return <AdminDashboard />
    }
    // Operator-specific dashboard
    if (currentPage === 'dashboard' && !isAdmin) {
      return <OperatorDashboard />
    }

    switch (currentPage) {
      case 'pegawai': return <PegawaiPage />
      case 'absensi': return <AbsensiPage />
      case 'validasi': return <ValidasiPage />
      case 'mutasi': return <MutasiPage />
      case 'bup': return <BupPage />
      case 'laporan': return <LaporanPage />
      case 'log-aktivitas': return <LogPage />
      case 'sekolah': return <SekolahPage />
      case 'pengaturan': return <PengaturanPage />
      case 'profil': return <ProfilPage />
      // Alias routes for operator-specific pages
      case 'mapping-pegawai': return <PegawaiPage />
      case 'riwayat-pegawai': return <RiwayatPage />
      case 'dokumen-pegawai': return <DokumenPage />
      case 'pengajuan': return <ValidasiPage />
      case 'cetak': return <LaporanPage />
      case 'pegawai-detail': return <PegawaiPage />
      default: return isAdmin ? <AdminDashboard /> : <OperatorDashboard />
    }
  }

  // Connection status indicator
  const dbStatusConfig = {
    connected: { color: 'bg-green-500', text: 'Tersambung', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    slow: { color: 'bg-yellow-500', text: 'Lambat', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    disconnected: { color: 'bg-red-500', text: 'Gagal tersambung', textColor: 'text-red-700', bgColor: 'bg-red-50' },
    syncing: { color: 'bg-blue-500', text: 'Menyinkronkan', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  }

  const status = dbStatusConfig[dbStatus]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#0a1628] to-[#071225] border-r border-blue-900/50 transform transition-all duration-300 ease-in-out flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      }`}>
        {/* Logo */}
        <div className={`p-4 border-b border-blue-800/30 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Image
                src="/logokab.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <h2 className="font-bold text-white text-sm whitespace-nowrap">SIMPEG</h2>
              <p className="text-[10px] text-blue-400/70 leading-tight whitespace-nowrap">Sistem Informasi<br/>Manajemen Pegawai</p>
              <p className="text-[9px] text-blue-500/60 leading-tight mt-0.5 whitespace-nowrap">Tim Kerja Dinas Pendidikan<br/>Kec. Lemahabang</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`mx-3 mt-3 px-3 py-1.5 rounded-lg ${status.bgColor === 'bg-green-50' ? 'bg-blue-900/30' : status.bgColor === 'bg-yellow-50' ? 'bg-yellow-900/30' : status.bgColor === 'bg-red-50' ? 'bg-red-900/30' : status.bgColor === 'bg-blue-50' ? 'bg-blue-900/30' : status.bgColor} flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${status.color} ${dbStatus === 'slow' || dbStatus === 'syncing' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} ${status.textColor === 'text-green-700' ? 'text-blue-300' : status.textColor === 'text-yellow-700' ? 'text-yellow-300' : status.textColor === 'text-red-700' ? 'text-red-300' : status.textColor === 'text-blue-700' ? 'text-blue-300' : status.textColor}`}>{status.text}</span>
        </div>

        {/* Menu Items */}
        <nav className={`flex-1 p-3 space-y-0.5 overflow-y-auto mt-1`}>
          {menuItems.map((item) => {
            const isActive = currentPage === item.id
            const badgeCount = item.badge && item.id === 'validasi' ? validasiList.length : 0
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  sidebarCollapsed ? 'justify-center px-0' : ''
                } ${
                  isActive
                    ? 'bg-blue-800/50 text-blue-200 shadow-sm'
                    : 'text-blue-300/80 hover:bg-blue-800/30 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                <span className={`flex-1 text-left overflow-hidden transition-all duration-300 whitespace-nowrap ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.label}</span>
                {badgeCount > 0 && !sidebarCollapsed && (
                  <Badge className="bg-blue-600 text-white text-xs px-1.5 hover:bg-blue-600">
                    {badgeCount}
                  </Badge>
                )}
                {badgeCount > 0 && sidebarCollapsed && (
                  <span className="relative -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Collapse Toggle Button (desktop only) */}
        <div className="hidden lg:block px-3 py-1">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-400/60 hover:text-blue-300 hover:bg-blue-800/30 transition-all ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            title={sidebarCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span className="text-xs">Perkecil</span>
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-3 border-t border-blue-800/30 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''} px-1 py-1`}>
            <div className="w-9 h-9 rounded-full bg-blue-800/50 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-blue-300">
                {user?.nama?.charAt(0) || 'U'}
              </span>
            </div>
            <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 h-0 opacity-0' : 'w-auto opacity-100'}`}>
              <p className="text-sm font-medium text-white truncate">{user?.nama}</p>
              <Badge variant="outline" className={`text-xs mt-0.5 ${
                isAdmin ? 'border-blue-600 text-blue-300' : 'border-amber-300 text-amber-700'
              }`}>
                {isAdmin ? 'Admin' : 'Operator'}
              </Badge>
            </div>
            <button
              onClick={() => {
                logout()
                setCurrentPage('login')
              }}
              className={`flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-500/10 ${sidebarCollapsed ? '' : 'w-full'}`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={`text-xs overflow-hidden transition-all duration-300 whitespace-nowrap ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-blue-800/20 px-4 py-3 border-t-2 border-t-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              {/* Desktop sidebar toggle */}
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                title={sidebarCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
              >
                {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">
                    {pageTitles[currentPage] || 'Dashboard'}
                  </h2>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {user?.sekolah && !isAdmin && (
                  <p className="text-xs text-gray-500">{user.sekolah.namaSekolah}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <Bell className="w-5 h-5" />
                {validasiList.length > 0 && isAdmin && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* User Info (desktop) */}
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200 ml-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-800">
                    {user?.nama?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.nama}</p>
                  <p className="text-xs text-gray-500">{isAdmin ? 'Admin Kecamatan' : 'Operator Sekolah'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={mustChangePassword} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" /> Ubah Password Default
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Anda masih menggunakan password default. Silakan ubah password untuk keamanan akun Anda.
          </p>
          <div className="space-y-4">
            {cpwError && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{cpwError}</div>}
            <div>
              <Label>Password Saat Ini</Label>
              <Input type="password" value={cpwCurrent} onChange={e => setCpwCurrent(e.target.value)} placeholder="Masukkan password saat ini" />
            </div>
            <div>
              <Label>Password Baru</Label>
              <Input type="password" value={cpwNew} onChange={e => setCpwNew(e.target.value)} placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <Label>Konfirmasi Password Baru</Label>
              <Input type="password" value={cpwConfirm} onChange={e => setCpwConfirm(e.target.value)} placeholder="Ulangi password baru" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword} disabled={cpwSubmitting} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white">
              {cpwSubmitting ? 'Menyimpan...' : 'Ubah Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-right">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white' :
            notification.type === 'error' ? 'bg-red-600 text-white' :
            'bg-gray-800 text-white'
          }`}>
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-80 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// HOME PAGE (Root)
// ============================================================
export default function Home() {
  const { isAuthenticated, currentPage, setCurrentPage } = useSimpegStore()

  // Show public view
  if (currentPage === 'public' && !isAuthenticated) {
    return <PublicView />
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Show main app
  return <MainApp />
}
