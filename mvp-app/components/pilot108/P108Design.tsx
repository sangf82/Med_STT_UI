'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Loader2,
  Mic,
  Pause,
  Settings,
  Square,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const p108Be =
  '[font-family:var(--font-p108-be),"Be Vietnam Pro",ui-sans-serif,system-ui,sans-serif]';
export const p108News =
  '[font-family:var(--font-p108-newsreader),Newsreader,ui-serif,Georgia,serif]';
export const p108Mono =
  '[font-family:var(--font-p108-mono),"Fira Code","Geist Mono",ui-monospace,monospace]';

export function P108PhoneFrame({
  children,
  className,
  'data-testid': testId,
}: {
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-[#F8FAFC] text-[#020617] shadow-sm sm:rounded-[28px] sm:ring-1 sm:ring-slate-200',
        p108Be,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function P108StatusBar() {
  return (
    <div className="flex h-[62px] items-center justify-between bg-[#F8FAFC] px-5 pt-2 text-[15px] font-semibold text-[#020617]">
      <span>9:41</span>
      <div className="flex items-center gap-1.5 text-[#020617]">
        <span className="h-2.5 w-4 rounded-[2px] border border-current" />
        <span className="h-3 w-4 rounded-[3px] bg-current" />
      </div>
    </div>
  );
}

export function P108MobileTopBar({
  title,
  subtitle,
  backHref,
  actionHref,
  actionLabel = 'Settings',
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex h-[52px] items-center gap-3 border-b border-[#E2E8F0] bg-white px-4">
      {backHref ? (
        <Link href={backHref} aria-label="Back" className="rounded-full p-2 text-[#475569] hover:bg-[#F1F5F9]">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className={cn('truncate text-[15px] font-semibold text-[#020617]', p108News)}>{title}</h1>
        {subtitle ? <p className="truncate text-[12px] font-medium text-[#64748B]">{subtitle}</p> : null}
      </div>
      {actionHref ? (
        <Link href={actionHref} aria-label={actionLabel} className="rounded-full p-2 text-[#475569] hover:bg-[#F1F5F9]">
          <Settings className="h-5 w-5" />
        </Link>
      ) : null}
    </div>
  );
}

export function P108PrimaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn('h-12 rounded-lg bg-[#FB8A0A] px-7 text-white shadow-lg hover:bg-[#E07A09]', p108Be, className)}
    >
      {children}
    </Button>
  );
}

export function P108GhostButton({ children, className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props} variant="ghost" className={cn('h-12 rounded-lg px-7 text-[#475569] hover:bg-[#F1F5F9]', p108Be, className)}>
      {children}
    </Button>
  );
}

export function P108Chip({ label, tone = 'warning', testId }: { label: string; tone?: 'warning' | 'success' | 'info'; testId?: string }) {
  const toneClass =
    tone === 'success'
      ? 'bg-[#22C55E15] text-[#16A34A] ring-[#22C55E33]'
      : tone === 'info'
        ? 'bg-[#0EA5E915] text-[#0369A1] ring-[#0EA5E933]'
        : 'bg-[#EAB30815] text-[#CA8A04] ring-[#EAB30833]';
  return (
    <span
      data-testid={testId}
      className={cn('inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide ring-1', toneClass, p108Be)}
    >
      {label}
    </span>
  );
}

export function P108RecordFab({ href = '/pilot108/stt-upload', testId = 'p108-h1-record-fab' }: { href?: string; testId?: string }) {
  return (
    <Link
      href={href}
      data-testid={testId}
      aria-label="Record"
      className="fixed bottom-6 right-6 z-[500] flex h-14 w-14 items-center justify-center rounded-full bg-[#FB8A0A] text-white shadow-lg transition hover:bg-[#E07A09] active:scale-95"
    >
      <Mic className="h-7 w-7" />
    </Link>
  );
}

export function P108Waveform({ active = false }: { active?: boolean }) {
  const bars = [0.35, 0.58, 0.42, 0.78, 0.55, 0.9, 0.5, 0.7, 0.45, 0.62, 0.38, 0.74, 0.48, 0.66, 0.4];
  return (
    <div className="flex h-[120px] w-full max-w-[800px] items-center justify-center gap-3">
      {bars.map((bar, i) => (
        <span
          key={i}
          className={cn('w-2 rounded-full bg-[#FB8A0A]', active && 'animate-waveform')}
          style={{ height: `${Math.round(bar * 96)}px`, animationDelay: `${i * 45}ms` }}
        />
      ))}
    </div>
  );
}

export function P108RecordingControls({
  recording,
  paused,
  busy,
  onStart,
  onPause,
  onStop,
}: {
  recording: boolean;
  paused?: boolean;
  busy?: boolean;
  onStart: () => void;
  onPause?: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-10">
      <Button
        type="button"
        variant="outline"
        className="h-16 w-16 rounded-full border-[#E2E8F0] bg-white text-[#475569]"
        disabled={!recording || busy}
        onClick={onPause}
        aria-label="Pause recording"
      >
        <Pause className="h-7 w-7" />
      </Button>
      <button
        type="button"
        data-testid="p108-h2-record-toggle"
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        disabled={busy}
        onClick={recording ? onStop : onStart}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 disabled:opacity-70',
          recording ? 'bg-[#EF4444]' : 'bg-[#FB8A0A]',
        )}
      >
        {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : recording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-9 w-9" />}
      </button>
      <Button
        type="button"
        variant="outline"
        className="h-16 w-16 rounded-full border-[#E2E8F0] bg-white text-[#475569]"
        disabled={!recording || busy}
        onClick={onStop}
        aria-label="Finish recording"
      >
        <CheckCircle2 className="h-7 w-7" />
      </Button>
      <span className="sr-only">{paused ? 'Paused' : 'Ready'}</span>
    </div>
  );
}

export type P108ProcessingStepStatus = 'done' | 'active' | 'pending' | 'error';

export function P108ProcessingSteps({
  steps,
  activeIndex,
  error,
}: {
  steps: readonly string[];
  activeIndex: number;
  error?: boolean;
}) {
  return (
    <div className="space-y-5">
      {steps.map((step, index) => {
        const status: P108ProcessingStepStatus = error && index === activeIndex ? 'error' : index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending';
        return (
          <div key={step} className="flex items-center gap-4">
            {status === 'done' ? (
              <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
            ) : status === 'error' ? (
              <XCircle className="h-6 w-6 text-[#EF4444]" />
            ) : status === 'active' ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#FB8A0A]" />
            ) : (
              <Circle className="h-6 w-6 text-[#94A3B8]" />
            )}
            <span className={cn('text-[18px]', status === 'active' ? 'font-semibold text-[#0F172A]' : 'text-[#94A3B8]', p108Be)}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function P108OfflineBanner({ children = 'Waiting for connection...' }: { children?: ReactNode }) {
  return (
    <div data-testid="p108-offline-banner" className="fixed inset-x-0 top-0 z-[400] flex h-10 items-center justify-center bg-[#FEF3C7] px-4 text-[13px] font-medium text-[#92400E]">
      <WifiOff className="mr-2 h-4 w-4" />
      {children}
    </div>
  );
}

