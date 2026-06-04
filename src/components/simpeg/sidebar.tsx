'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSimpegStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  School,
  CheckCircle,
  Map,
  ArrowLeftRight,
  Clock,
  CalendarCheck,
  FileText,
  Settings,
  History,
  BookOpen,
  FileUp,
  Send,
  Printer,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  page: string;
  icon: LucideIcon;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Data Pegawai', page: 'pegawai', icon: Users },
  { label: 'Data Sekolah', page: 'sekolah', icon: School },
  { label: 'Validasi Data', page: 'validasi', icon: CheckCircle },
  { label: 'Mapping Pegawai', page: 'mapping', icon: Map },
  { label: 'Mutasi Pegawai', page: 'mutasi', icon: ArrowLeftRight },
  { label: 'BUP / Pensiun', page: 'bup', icon: Clock },
  { label: 'Absensi Pegawai', page: 'absensi', icon: CalendarCheck },
  { label: 'Laporan', page: 'laporan', icon: FileText },
  { label: 'Pengaturan', page: 'pengaturan', icon: Settings },
  { label: 'Log Aktivitas', page: 'log-aktivitas', icon: History },
];

const operatorNavItems: NavItem[] = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Data Pegawai Sekolah', page: 'pegawai', icon: Users },
  { label: 'Riwayat Pegawai', page: 'riwayat', icon: BookOpen },
  { label: 'Dokumen Pegawai', page: 'dokumen', icon: FileUp },
  { label: 'Absensi Pegawai', page: 'absensi', icon: CalendarCheck },
  { label: 'Pengajuan', page: 'pengajuan', icon: Send },
  { label: 'Cetak', page: 'cetak', icon: Printer },
  { label: 'Profil Sekolah', page: 'profil-sekolah', icon: Building2 },
];

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const user = useSimpegStore((s) => s.user);
  const currentPage = useSimpegStore((s) => s.currentPage);
  const setCurrentPage = useSimpegStore((s) => s.setCurrentPage);
  const logout = useSimpegStore((s) => s.logout);

  const navItems =
    user?.role === 'admin_kecamatan' ? adminNavItems : operatorNavItems;

  const roleLabel =
    user?.role === 'admin_kecamatan' ? 'Admin Kecamatan' : 'Operator Sekolah';

  const initials = user?.nama
    ? user.nama
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0a1628] to-[#071225] text-white">
      {/* Logo area */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center">
          <Image
            src="/logokab.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight tracking-wide">
              SIMPEG
            </h1>
            <p className="truncate text-xs text-blue-300">
              Sistem Informasi Manajemen Pegawai
            </p>
            <p className="truncate text-[10px] text-blue-400/70 mt-0.5">
              Tim Kerja Dinas Pendidikan Kec. Lemahabang
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-blue-800/30" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => {
                  setCurrentPage(item.page);
                  onNavigate?.();
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-gradient-to-r from-blue-800 to-blue-700 text-white shadow-md shadow-blue-900/30'
                    : 'text-blue-300/80 hover:bg-blue-800/40 hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-blue-800/30" />

      {/* User info */}
      <div className={cn('p-3', collapsed && 'px-2')}>
        <div
          className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="size-9 border-2 border-blue-500">
            <AvatarFallback className="bg-blue-800 text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.nama}</p>
              <Badge
                variant="secondary"
                className="mt-0.5 bg-blue-800/50 text-[10px] text-blue-300 hover:bg-blue-800/50"
              >
                {roleLabel}
              </Badge>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="mt-2 w-full justify-start gap-2 text-blue-400 hover:bg-blue-800/50 hover:text-white"
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="mt-2 w-full text-blue-400 hover:bg-blue-800/50 hover:text-white"
            title="Keluar"
          >
            <LogOut className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useSimpegStore((s) => s.sidebarOpen);
  const setSidebarOpen = useSimpegStore((s) => s.setSidebarOpen);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Navigasi</SheetTitle>
          </SheetHeader>
          <SidebarContent
            collapsed={false}
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar (fixed) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 flex size-6 items-center justify-center rounded-full border border-blue-300 bg-white shadow-md hover:bg-blue-50"
          aria-label={isCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5 text-blue-800" />
          ) : (
            <ChevronLeft className="size-3.5 text-blue-800" />
          )}
        </button>
      </aside>

      {/* Spacer to push main content */}
      <div
        className={cn(
          'hidden shrink-0 transition-all duration-300 lg:block',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      />
    </>
  );
}
