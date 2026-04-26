'use client';

import Link from 'next/link';
import { CalendarDays, Home, LogOut, Settings } from 'lucide-react';
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

export function P108Shell({
  children,
  sessionTitle = 'Pilot 108',
  showSessionBadge = true,
  chrome = 'mobile',
  backHref,
  settingsHref = '/pilot108/team',
}: P108ShellProps) {
  return (
    <div
      data-testid="p108-shell"
      className="min-h-screen bg-[#F8FAFC] text-[#020617] antialiased selection:bg-[#FB8A0A]/25"
    >
      <header data-testid="p108-header" className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
        {chrome === 'mobile' ? (
          <div className="mx-auto max-w-[390px] sm:hidden">
            <P108StatusBar />
          </div>
        ) : null}
        <div className="mx-auto flex h-[52px] max-w-[390px] items-center gap-2 px-4 sm:h-14 sm:max-w-6xl sm:px-6 lg:px-8">
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
          <h1
            data-testid="p108-session-title"
            className={cn(
              'min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight text-[#020617] sm:text-lg',
              p108News
            )}
          >
            {sessionTitle}
          </h1>
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
                'hidden text-[11px] font-medium text-[#475569] underline-offset-2 hover:underline sm:inline sm:text-xs',
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
              className="text-muted-foreground hover:text-foreground"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="sr-only">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[390px] px-[15px] py-4 sm:max-w-6xl sm:px-6 lg:px-8 lg:py-6">{children}</div>
    </div>
  );
}
