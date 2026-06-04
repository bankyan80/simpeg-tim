'use client';

import React, { useState, useCallback } from 'react';
import { useSimpegStore } from '@/lib/store';
import {
  Shield,
  School,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  User,
  Lock,
  LogIn,
  AlertCircle,
} from 'lucide-react';

export function LoginPage() {
  const login = useSimpegStore((s) => s.login);
  const loading = useSimpegStore((s) => s.loading);
  const notification = useSimpegStore((s) => s.notification);
  const setNotification = useSimpegStore((s) => s.setNotification);
  const setCurrentPage = useSimpegStore((s) => s.setCurrentPage);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password.trim()) {
      setLoginError('Username dan password wajib diisi');
      return;
    }
    await login(username.trim(), password.trim());
  }, [login, username, password]);

  // Auto-detect role based on username
  const detectedRole =
    username === 'admin-kepeg'
      ? 'admin'
      : username && /^\d+$/.test(username)
        ? 'operator'
        : null;

  const errorToShow =
    loginError ||
    (notification?.type === 'error' ? notification.message : '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-[#0c1a3a] to-blue-900 p-4">


      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 shadow-lg shadow-blue-900/40">
            <Building2 className="size-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">SIMPEG</h1>
          <p className="mt-1 text-base font-medium text-blue-300">
            Sistem Informasi Manajemen Pegawai
          </p>
          <p className="mt-0.5 text-sm text-blue-400">
            Tim Kerja Dinas Pendidikan Kecamatan Lemahabang
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-blue-700/30 bg-white/5 p-6 shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role indicator */}
            {detectedRole && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                  detectedRole === 'admin'
                    ? 'border-blue-600/30 bg-blue-800/40 text-blue-200'
                    : 'border-sky-600/30 bg-sky-800/40 text-sky-200'
                }`}
              >
                {detectedRole === 'admin' ? (
                  <Shield className="size-4" />
                ) : (
                  <School className="size-4" />
                )}
                {detectedRole === 'admin'
                  ? 'Admin Kecamatan'
                  : 'Operator Sekolah'}
              </div>
            )}

            {/* Username field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin-kepeg atau NPSN sekolah"
                  className="w-full rounded-lg border border-blue-600/30 bg-white/10 py-2.5 pl-10 pr-4 text-white placeholder:text-blue-400/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-lg border border-blue-600/30 bg-white/10 py-2.5 pl-10 pr-10 text-white placeholder:text-blue-400/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 transition hover:text-blue-200"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorToShow && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="size-4 shrink-0" />
                {errorToShow}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-900 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-200 hover:from-blue-600 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Public data link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentPage('public')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
          >
            <Eye className="size-4" />
            Lihat Data Publik
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-blue-500">
          SIMPEG &mdash; Tim Kerja Dinas Pendidikan Kec. Lemahabang &copy; 2026
        </p>
      </div>
    </div>
  );
}
