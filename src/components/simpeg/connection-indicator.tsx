'use client';

import { useSimpegStore } from '@/lib/store';
import type { DbStatus } from '@/lib/types';

const statusConfig: Record<DbStatus, { color: string; label: string; pulse: boolean }> = {
  connected: { color: 'bg-blue-500', label: 'Tersambung', pulse: false },
  slow: { color: 'bg-yellow-500', label: 'Lambat', pulse: true },
  disconnected: { color: 'bg-red-500', label: 'Gagal tersambung', pulse: true },
  syncing: { color: 'bg-sky-500', label: 'Menyinkronkan', pulse: true },
};

export function ConnectionIndicator() {
  const dbStatus = useSimpegStore((s) => s.dbStatus);
  const config = statusConfig[dbStatus];

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="relative flex size-2">
        {config.pulse && (
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full ${config.color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex size-2 rounded-full ${config.color}`}
        />
      </span>
      <span className="hidden text-muted-foreground sm:inline">{config.label}</span>
    </div>
  );
}
