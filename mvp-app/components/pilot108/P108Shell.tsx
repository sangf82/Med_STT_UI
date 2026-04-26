'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Mic,
  PanelLeftClose,
  Settings,
  Stethoscope,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { logout } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { P108StatusBar, p108Be, p108News } from '@/components/pilot108/P108Design';

export type P108ShellProps = {
  children: React.ReactNode;
  /** pen ERahL / VtdW0 — dòng tiêu đề phiên (Newsreader) */
  sessionTitle?: string;
  /** Hiện chip cảnh báo kiểu “GIAO BAN” */
  showSessionBadge?: boolean;
  chrome?: 'mobile' | 'admin';
  backHref?: string;
  settingsHref?: string;
};

const SIDEBAR_NAV: { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean }[] = [
  {
    href: '/pilot108/stt-upload',
    label: 'Phiên ghi',
    icon: Mic,
    match: (path) =>
      path === '/pilot108/stt-upload' || path === '/pilot108' || path.startsWith('/pilot108/processing'),
  },
  {
    href: '/pilot108/individual',
    label: 'Việc cần làm',
    icon: ClipboardList,
    match: (path) => path.startsWith('/pilot108/individual'),
  },
  {
    href: '/pilot108/team',
    label: 'Thành viên',
    icon: Users,
    match: (path) => path.startsWith('/pilot108/team') && !path.startsWith('/pilot108/team-setup'),
  },
  {
    href: '/pilot108/team-setup',
    label: 'Thiết lập team',
    icon: UserPlus,
    match: (path) => path.startsWith('/pilot108/team-setup'),
  },
];

export function P108Shell({
  children,
  sessionTitle = 'Pilot 108',
  showSessionBadge = true,
  chrome = 'mobile',
  backHref,
  settingsHref = '/pilot108/team',
}: P108ShellProps) {
  const pathname = usePathname() || '';

  return (
    <div
      data-testid="p108-shell"
      className="min-h-screen bg-[#F8FAFC] text-[#020617] antialiased selection:bg-[#FB8A0A]/25"
    >
      <header
        data-testid="p108-header"
        className="sticky top-0 z-30 border-b border-[#CBD5E1] bg-white"
      >
        {chrome === 'mobile' ? (
          <div className="mx-auto max-w-[390px] sm:hidden">
            <P108StatusBar />
          </div>
        ) : null}
        <div className="mx-auto flex h-[52px] w-full max-w-[1440px] items-center gap-3 px-4 sm:h-16 sm:px-[15px]">
          {backHref ? (
            <Link
              href={backHref}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'text-[#475569]')}
              aria-label="Back"
            >
              <Home className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <CalendarDays className="h-4 w-4 shrink-0 text-[#FB8A0A] sm:h-5 sm:w-5" aria-hidden />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex shrink-0 flex-col leading-tight sm:hidden" aria-hidden>
              <span className={cn('text-[11px] font-bold tracking-tight text-[#FB8A0A] sm:text-[13px]', p108Be)}>
                MedMate
              </span>
              <span
                className={cn(
                  'text-[7px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8] sm:text-[8px]',
                  p108Be,
                )}
              >
                Scribe
              </span>
            </div>
            <h1
              data-testid="p108-session-title"
              className={cn(
                'min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight text-[#020617] sm:text-xl sm:font-semibold',
                p108News
              )}
            >
              {sessionTitle}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showSessionBadge ? (
              <Badge
                variant="outline"
                className={cn(
                  'hidden border-amber-200/80 bg-[#EAB30815] px-3 py-1 text-[11px] font-medium tracking-wide text-[#CA8A04] sm:inline sm:text-xs',
                  p108Be
                )}
              >
                PILOT 108
              </Badge>
            ) : null}
            <Link
              href={settingsHref}
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium text-[#475569] underline-offset-2 hover:underline sm:hidden',
                p108Be
              )}
            >
              <Settings className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              Team
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => logout()}
              className="text-muted-foreground hover:text-foreground sm:hidden"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="sr-only">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] min-h-0 flex-1">
        <aside
          data-testid="p108-sidebar"
          className="sticky top-[52px] z-20 hidden h-[calc(100dvh-52px)] w-64 shrink-0 flex-col gap-4 border-r border-[#CBD5E1] bg-white p-2 sm:top-16 sm:flex sm:h-[calc(100dvh-4rem)]"
        >
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-2 rounded-lg border border-[#CBD5E1] bg-[#FAFAFA] p-2',
              p108Be,
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#219EBC]"
                aria-hidden
              >
                <Stethoscope className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className={cn('flex min-w-0 flex-col leading-none', p108News)}>
                <div className="flex flex-wrap items-baseline text-lg font-semibold tracking-tight">
                  <span className="text-[#219EBC]">Med</span>
                  <span className="text-[#FB8A0A]">Mate</span>
                  <span className="text-[#05191E]"> Scribe</span>
                </div>
              </div>
            </div>
            <PanelLeftClose className="h-4 w-4 shrink-0 text-[#64748B]" aria-hidden />
          </div>

          <nav className={cn('flex flex-1 flex-col gap-1.5', p108Be)} aria-label="Pilot 108">
            {SIDEBAR_NAV.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#219EBC] text-[#FAFAFA]'
                      : 'text-[#020617] hover:bg-[#F1F5F9]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon
                      className={cn('h-4 w-4 shrink-0', active ? 'text-[#FAFAFA]' : 'text-[#475569]')}
                      aria-hidden
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  <ChevronRight
                    className={cn('h-4 w-4 shrink-0', active ? 'text-[#FAFAFA]/70' : 'text-[#CBD5E1]')}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div
            className={cn(
              'mt-auto flex shrink-0 items-center justify-between gap-2 rounded-lg border border-[#CBD5E1] bg-[#FAFAFA] p-2',
              p108Be,
            )}
          >
            <Link href={settingsHref} className="flex min-w-0 flex-1 items-center gap-2 rounded-md hover:bg-black/[0.03]">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[#64748B]"
                aria-hidden
              >
                <User className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-[#05191E]">Tài khoản</span>
                <span className="truncate text-xs text-[#475569]">Cài đặt team</span>
              </div>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => logout()}
              className="shrink-0 text-[#64748B] hover:text-[#020617]"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-[15px] py-[15px]">
          <div className="mx-auto w-full max-w-[390px] sm:max-w-none">{children}</div>
        </div>
      </div>
    </div>
  );
}
