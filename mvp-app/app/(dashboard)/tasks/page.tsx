'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { getMyRecords, type SttRecord } from '@/lib/api/sttMetrics';

function getDayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string, locale: string) {
  const date = new Date(`${dayKey}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function TasksPage() {
  const t = useTranslations('Tasks');
  const b = useTranslations('Badge');
  const router = useRouter();
  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyRecords(0, 100, 'to-do');
      const next = Array.isArray(res?.items) ? res.items : [];
      next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(next);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const dayKeys = useMemo(() => {
    const keys = Array.from(new Set(items.map((item) => getDayKey(item.created_at))));
    return keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [items]);

  useEffect(() => {
    if (dayIndex >= dayKeys.length) {
      setDayIndex(0);
    }
  }, [dayIndex, dayKeys.length]);

  const activeDay = dayKeys[dayIndex];

  const dayItems = useMemo(() => {
    if (!activeDay) return [];
    return items.filter((item) => getDayKey(item.created_at) === activeDay);
  }, [activeDay, items]);

  const locale = typeof document !== 'undefined' && document.documentElement.lang === 'vi' ? 'vi-VN' : 'en-US';

  const allDone = dayItems.length > 0 && dayItems.every((item) => item.status === 'completed');

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg-page">
        <header className="border-b border-border bg-bg-card px-4">
          <div className="flex h-12 items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('back')}
            >
              <ChevronLeft className="h-5 w-5 text-text-primary" />
            </button>
            <h1 className="text-[16px] font-semibold text-text-primary">{t('title')}</h1>
            <div className="h-10 w-10" />
          </div>
        </header>

        <div className="flex h-11 items-center justify-between border-b border-border bg-bg-card px-4">
          <button
            type="button"
            onClick={() => setDayIndex((prev) => Math.min(dayKeys.length - 1, prev + 1))}
            disabled={dayIndex >= dayKeys.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary disabled:opacity-40"
            aria-label={t('prevDay')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[14px] font-medium text-text-primary">
            {activeDay ? formatDayLabel(activeDay, locale) : t('today')}
          </span>
          <button
            type="button"
            onClick={() => setDayIndex((prev) => Math.max(0, prev - 1))}
            disabled={dayIndex <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary disabled:opacity-40"
            aria-label={t('nextDay')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <main className="flex-1 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-14 text-text-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : dayItems.length === 0 || allDone ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[16px] font-semibold text-text-primary">{t('emptyTitle')}</p>
              <p className="mt-1 text-[13px] text-text-muted">{t('emptySubtitle')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {dayItems.map((item) => {
                const done = item.status === 'completed';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(`/todo?id=${item.id}`)}
                    className="w-full rounded-2xl bg-bg-card px-4 py-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-text-primary">
                          {item.display_name || t('taskFallback')}
                        </p>
                        <p className="mt-1 truncate text-[12px] text-text-secondary">
                          {item.patient_name || t('unknownPatient')}
                        </p>
                      </div>
                      <Badge variant={done ? 'success' : 'warn'}>
                        {done ? b('transcribed') : b('transcribing')}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
