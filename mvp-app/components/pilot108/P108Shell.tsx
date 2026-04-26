'use client';

import Link from 'next/link';
import { CalendarDays, Eye, LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';

export type P108ShellProps = {
  children: React.ReactNode;
  /** pen ERahL / VtdW0 — dòng tiêu đề phiên (Newsreader) */
  sessionTitle?: string;
  /** Hiện chip cảnh báo kiểu “GIAO BAN” */
  showSessionBadge?: boolean;
};

export function P108Shell({
  children,
  sessionTitle = 'Pilot 108',
  showSessionBadge = true,
}: P108ShellProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#020617] antialiased selection:bg-[#219EBC]/25">
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center gap-2 px-4 sm:h-14 sm:px-6 lg:px-8">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#FB8A0A] sm:h-5 sm:w-5" aria-hidden />
          <h1
            className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight text-[#020617] sm:text-lg"
            style={{ fontFamily: 'var(--font-p108-newsreader), "Newsreader", ui-serif, Georgia, serif' }}
          >
            {sessionTitle}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            {showSessionBadge ? (
              <span
                className="hidden rounded px-3 py-1 text-[11px] font-medium tracking-wide text-[#CA8A04] sm:inline sm:text-xs"
                style={{
                  fontFamily: 'var(--font-p108-be), "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif',
                  backgroundColor: 'rgba(234, 179, 8, 0.08)',
                }}
              >
                PILOT 108
              </span>
            ) : null}
            <Link
              href="/pilot108"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-2 text-[11px] font-medium text-[#64748B] transition hover:bg-[#E2E8F0] sm:h-9 sm:px-2.5 sm:text-xs"
              style={{ fontFamily: 'var(--font-p108-be), "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif' }}
            >
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="hidden sm:inline">Hub</span>
            </Link>
            <Link
              href="/pilot108/stt-upload"
              className="hidden text-[11px] font-medium text-[#219EBC] underline-offset-2 hover:underline sm:inline sm:text-xs"
              style={{ fontFamily: 'var(--font-p108-be), "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif' }}
            >
              STT
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-transparent px-1.5 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] sm:h-9 sm:px-2"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="sr-only">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[390px] px-[15px] py-4 sm:max-w-6xl sm:px-6 lg:px-8 lg:py-6">{children}</div>
    </div>
  );
}
