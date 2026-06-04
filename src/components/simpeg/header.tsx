'use client';

import { useSimpegStore } from '@/lib/store';
import { ConnectionIndicator } from './connection-indicator';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  pegawai: 'Data Pegawai',
  pegawai_detail: 'Detail Pegawai',
  sekolah: 'Data Sekolah',
  validasi: 'Validasi Data',
  mapping: 'Mapping Pegawai',
  mutasi: 'Mutasi Pegawai',
  bup: 'BUP / Pensiun',
  absensi: 'Absensi Pegawai',
  laporan: 'Laporan',
  pengaturan: 'Pengaturan',
  'log-aktivitas': 'Log Aktivitas',
  riwayat: 'Riwayat Pegawai',
  dokumen: 'Dokumen Pegawai',
  pengajuan: 'Pengajuan',
  cetak: 'Cetak',
  'profil-sekolah': 'Profil Sekolah',
  profil: 'Profil',
  public: 'Data Publik',
};

export function Header() {
  const user = useSimpegStore((s) => s.user);
  const currentPage = useSimpegStore((s) => s.currentPage);
  const setSidebarOpen = useSimpegStore((s) => s.setSidebarOpen);
  const setCurrentPage = useSimpegStore((s) => s.setCurrentPage);
  const logout = useSimpegStore((s) => s.logout);
  const validasiList = useSimpegStore((s) => s.validasiList);

  const pendingCount = validasiList.filter(
    (v) => v.statusValidasi === 'pending'
  ).length;

  const title = pageTitles[currentPage] || 'Dashboard';

  const initials = user?.nama
    ? user.nama
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur-sm lg:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title */}
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      {/* Search bar (hidden on small screens) */}
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari pegawai, sekolah..."
          className="h-8 pl-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Connection status */}
        <ConnectionIndicator />

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifikasi"
        >
          <Bell className="size-5" />
          {pendingCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white">
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-2 pr-1"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.nama}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.nama}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setCurrentPage('profil')}
              className="cursor-pointer"
            >
              <User className="mr-2 size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setCurrentPage('pengaturan')}
              className="cursor-pointer"
            >
              <Settings className="mr-2 size-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
