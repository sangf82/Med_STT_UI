'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, ChevronLeft, EllipsisVertical, Loader2 } from 'lucide-react';
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

function deriveTodoCheckedState(raw: string): boolean | null {
  if (!raw || typeof raw !== 'string') return null;
  const matches = [...raw.matchAll(/^\s*[-*]\s*\[\s*([xX ]?)\s*\]/gm)];
  if (matches.length === 0) return null;
  return matches.every((m) => (m[1] || '').toLowerCase() === 'x');
}

export default function TasksPage() {
  const t = useTranslations('Tasks');
  const router = useRouter();
  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [todoCheckedById, setTodoCheckedById] = useState<Record<string, boolean>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const remainingCount = dayItems.filter((item) => !(todoCheckedById[item.id] ?? false)).length;

  const groupedByPatient = useMemo(() => {
    const groups = new Map<string, SttRecord[]>();
    for (const item of dayItems) {
      const key = (item.patient_name || t('unknownPatient')).trim();
      const current = groups.get(key) || [];
      current.push(item);
      groups.set(key, current);
    }
    return Array.from(groups.entries());
  }, [dayItems, t]);

  useEffect(() => {
    let canceled = false;

    const resolveCheckedStates = async () => {
      const missing = dayItems.filter((item) => todoCheckedById[item.id] === undefined);
      if (missing.length === 0) return;

      const resolved = await Promise.all(
        missing.map(async (item): Promise<[string, boolean]> => {
          let raw = item.content || item.refined_text || item.raw_text || '';

          if (!raw) {
            try {
              const detail = await getRecordById(item.id);
              raw = detail.content || detail.refined_text || detail.raw_text || '';
            } catch {
              return [item.id, false];
            }
          }

          const parsed = deriveTodoCheckedState(raw);
          return [item.id, parsed ?? false];
        }),
      );

      if (canceled) return;
      setTodoCheckedById((prev) => {
        const next = { ...prev };
        for (const [id, checked] of resolved) {
          next[id] = checked;
        }
        return next;
      });
    };

    void resolveCheckedStates();
    return () => {
      canceled = true;
    };
  }, [dayItems, todoCheckedById]);

  const persistTitle = useCallback(async (item: SttRecord, nextTitle: string) => {
    const trimmed = nextTitle.trim();
    const currentTitle = (item.display_name || '').trim();
    if (!trimmed || trimmed === currentTitle) return;

    try {
      const detail = await getRecordById(item.id);
      const content = detail.content || detail.refined_text || detail.raw_text || '';
      await updateRecord(item.id, {
        content,
        display_name: trimmed,
        patient_name: detail.patient_name,
      });
      setItems((prev) => prev.map((record) => (record.id === item.id ? { ...record, display_name: trimmed } : record)));
    } catch (error) {
      console.error('Save task title failed', error);
    }
  }, []);

  const startEditing = useCallback((item: SttRecord) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setEditingId(item.id);
    setDraftTitle(item.display_name || t('taskFallback'));
  }, [t]);

  const scheduleSave = useCallback((item: SttRecord, nextValue: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void persistTitle(item, nextValue);
    }, 700);
  }, [persistTitle]);

  const stopEditing = useCallback((item: SttRecord) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistTitle(item, draftTitle);
    setEditingId(null);
  }, [draftTitle, persistTitle]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
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
            <ChevronDown className="h-4 w-4 text-[#555555]" />
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
              {groupedByPatient.map(([patientName, records]) => (
                <section key={patientName} className="space-y-2.5">
                  <h2 className="text-[28px] leading-none font-bold text-[#1A1A1A]">{patientName}</h2>
                  <p className="text-[12px] text-[#555555]">{t('patientId')}: P-{records[0].id.slice(-8).toUpperCase()}</p>

                  <div className="space-y-2">
                    {records.map((item) => {
                      const done = todoCheckedById[item.id] ?? false;
                      const isEditing = editingId === item.id;
                      return (
                        <div key={item.id} className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={done}
                            readOnly
                            className="mt-1 h-4 w-4 rounded-[3px] border border-[#C7CBD4]"
                          />
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div onBlur={() => stopEditing(item)}>
                                <input
                                  autoFocus
                                  value={draftTitle}
                                  onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setDraftTitle(nextValue);
                                    scheduleSave(item, nextValue);
                                  }}
                                  onBlur={() => stopEditing(item)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      stopEditing(item);
                                    }
                                  }}
                                  className={`w-full bg-transparent text-[14px] leading-[1.4] text-[#1A1A1A] outline-none ${done ? 'line-through opacity-70' : ''}`}
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(item)}
                                className="w-full text-left"
                              >
                                <p className={`text-[14px] leading-[1.4] text-[#1A1A1A] ${done ? 'line-through opacity-70' : ''}`}>
                                  {item.display_name || t('taskFallback')}
                                </p>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
