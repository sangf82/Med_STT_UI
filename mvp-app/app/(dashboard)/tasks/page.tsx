'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, EllipsisVertical, Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { getMyRecords, getRecordById, updateRecord, type SttRecord } from '@/lib/api/sttMetrics';

function toLocalDayKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function countUncheckedTasks(raw: string): number {
  if (!raw || typeof raw !== 'string') return 0;
  const matches = [...raw.matchAll(/^\s*[-*]\s*\[\s*([xX ]?)\s*\]/gm)];
  if (matches.length === 0) return 0;
  return matches.reduce((count, match) => {
    const checkedMarker = (match[1] || '').toLowerCase();
    return checkedMarker === 'x' ? count : count + 1;
  }, 0);
}

export default function TasksPage() {
  const t = useTranslations('Tasks');
  const router = useRouter();
  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('');
  const [contentById, setContentById] = useState<Record<string, string>>({});
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
    const keys = Array.from(new Set(items.map((item) => toLocalDayKey(item.created_at))));
    return keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [items]);

  useEffect(() => {
    if (dayKeys.length === 0) {
      setActiveDay('');
      return;
    }
    if (!activeDay || !dayKeys.includes(activeDay)) {
      setActiveDay(dayKeys[0]);
    }
  }, [activeDay, dayKeys]);

  const dayItems = useMemo(() => {
    if (!activeDay) return [];
    return items.filter((item) => toLocalDayKey(item.created_at) === activeDay);
  }, [activeDay, items]);

  const locale = typeof document !== 'undefined' && document.documentElement.lang === 'vi' ? 'vi-VN' : 'en-US';

  const groupedByPatient = useMemo(() => {
    const groups = new Map<string, SttRecord>();
    for (const item of dayItems) {
      const key = (item.patient_name || t('unknownPatient')).trim();
      if (!groups.has(key)) {
        groups.set(key, item);
      }
    }
    return Array.from(groups.entries());
  }, [dayItems, t]);

  const remainingCount = useMemo(() => {
    return groupedByPatient.reduce((sum, [, record]) => {
      const content =
        contentById[record.id] ??
        record.content ??
        record.refined_text ??
        record.raw_text ??
        '';
      return sum + countUncheckedTasks(content);
    }, 0);
  }, [contentById, groupedByPatient]);

  useEffect(() => {
    let canceled = false;

    const resolveContentByPatient = async () => {
      const records = groupedByPatient.map(([, record]) => record);
      const missing = records.filter((record) => contentById[record.id] === undefined);
      if (missing.length === 0) return;

      const resolved = await Promise.all(
        missing.map(async (record): Promise<[string, string]> => {
          let content = record.content || record.refined_text || record.raw_text || '';

          if (!content) {
            try {
              const detail = await getRecordById(record.id);
              content = detail.content || detail.refined_text || detail.raw_text || '';
            } catch {
              return [record.id, ''];
            }
          }

          return [record.id, content];
        }),
      );

      if (canceled) return;
      setContentById((prev) => {
        const next = { ...prev };
        for (const [id, content] of resolved) {
          next[id] = content;
        }
        return next;
      });
    };

    void resolveContentByPatient();
    return () => {
      canceled = true;
    };
  }, [contentById, groupedByPatient]);

  const persistContent = useCallback(async (item: SttRecord, nextContent: string) => {
    try {
      await updateRecord(item.id, {
        content: nextContent,
        patient_name: item.patient_name,
      });
      setItems((prev) => prev.map((record) => (record.id === item.id ? { ...record, content: nextContent } : record)));
    } catch (error) {
      console.error('Save task content failed', error);
    }
  }, []);

  const scheduleSaveContent = useCallback((item: SttRecord, nextValue: string) => {
    setContentById((prev) => ({ ...prev, [item.id]: nextValue }));

    const existingTimer = saveTimersRef.current[item.id];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    saveTimersRef.current[item.id] = setTimeout(() => {
      void persistContent(item, nextValue);
      delete saveTimersRef.current[item.id];
    }, 700);
  }, [persistContent]);

  useEffect(() => {
    return () => {
      const timers = saveTimersRef.current;
      const ids = Object.keys(timers);
      for (const id of ids) {
        clearTimeout(timers[id]);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F1F3]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#F0F1F3]">
        <header className="border-b border-[#D0D3D9] bg-white px-4">
          <div className="flex h-12 items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('back')}
            >
              <ChevronLeft className="h-5 w-5 text-text-primary" />
            </button>
            <h1 className="flex-1 text-left text-[17px] font-semibold text-[#1A1A1A]">{t('title')}</h1>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B6B6B]"
              aria-label={t('menu')}
            >
              <EllipsisVertical className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex h-11 items-center justify-between border-b border-[#D0D3D9] bg-white px-4">
          <div className="flex items-center gap-1.5 text-[#1A1A1A]">
            <Calendar className="h-4 w-4 text-brand-blue" />
            <select
              value={activeDay}
              onChange={(e) => setActiveDay(e.target.value)}
              className="bg-transparent text-[14px] font-semibold outline-none"
            >
              {dayKeys.map((dayKey) => (
                <option key={dayKey} value={dayKey}>
                  {formatDayLabel(dayKey, locale)}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[12px] text-[#555555]">{t('tasksRemaining', { count: remainingCount })}</span>
        </div>

        <main className="flex-1 px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-14 text-text-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : dayItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[16px] font-semibold text-text-primary">{t('emptyTitle')}</p>
              <p className="mt-1 text-[13px] text-text-muted">{t('emptySubtitle')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedByPatient.map(([patientName, record]) => {
                const content =
                  contentById[record.id] ??
                  record.content ??
                  record.refined_text ??
                  record.raw_text ??
                  '';
                const isLoadingContent =
                  contentById[record.id] === undefined &&
                  !(record.content || record.refined_text || record.raw_text);

                return (
                <section key={patientName} className="space-y-2.5">
                  <h2 className="text-[28px] leading-none font-bold text-[#1A1A1A]">{patientName}</h2>
                  <p className="text-[12px] text-[#555555]">{t('patientId')}: P-{record.id.slice(-8).toUpperCase()}</p>

                  <div className="rounded-xl border border-[#D0D3D9] bg-white">
                    {isLoadingContent ? (
                      <div className="flex items-center gap-2 px-4 py-4 text-sm text-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('loading')}</span>
                      </div>
                    ) : (
                      <RichTextEditor
                        content={content}
                        onChange={(nextValue) => scheduleSaveContent(record, nextValue)}
                        coerceTaskListOnLoad
                        showToolbar={false}
                        className="min-h-22"
                        minHeight="88px"
                      />
                    )}
                  </div>
                </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
