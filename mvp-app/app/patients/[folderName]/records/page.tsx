'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Mic, Search } from 'lucide-react';
import { getPatientFolderRecords, type SttRecord } from '@/lib/api/sttMetrics';
import { outputFormatToReviewRoute } from '@/lib/outputFormat';

type ItemStatus = 'done' | 'draft';

function toStatus(record: SttRecord): ItemStatus {
  return record.status === 'completed' ? 'done' : 'draft';
}

function formatDurationLabel(totalSec?: number) {
  const sec = Math.max(0, Math.round(totalSec ?? 0));
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}m ${remainSec}s`;
}

function formatTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function PatientRecordsHistoryPage() {
  const t = useTranslations('PatientRecords');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ folderName: string }>();
  const folderName = decodeURIComponent(params.folderName ?? '');

  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPatientFolderRecords(folderName, 0, 100);
      const next = Array.isArray(res?.items) ? res.items : [];
      setItems(
        next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [folderName]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = (item.display_name || '').toLowerCase();
      const content = (item.content || item.refined_text || item.raw_text || '').toLowerCase();
      return name.includes(q) || content.includes(q);
    });
  }, [items, searchText]);

  const monthLabel = useMemo(() => {
    if (filtered.length === 0) return '';
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(filtered[0].created_at));
    return month.toUpperCase();
  }, [filtered, locale]);

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg-page">
        <header className="border-b border-border/80 bg-bg-page px-4 pt-1.25">
          <div className="flex h-14 items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
                aria-label={t('back')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[20px] font-bold text-text-primary leading-tight">{t('title')}</p>
                <p className="truncate text-[11px] text-text-muted">{folderName}</p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('search')}
              onClick={() => {
                // Keep this icon action lightweight; real filtering is via inline search input.
              }}
            >
              <Search className="h-4 w-4 text-text-muted" />
            </button>
          </div>
          <div className="pb-2">
            <div className="flex h-9 items-center gap-2 rounded-xl bg-bg-surface px-3 text-text-muted">
              <Search className="h-4 w-4" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                placeholder={t('searchPlaceholder')}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-text-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-divider bg-bg-surface px-4 py-8 text-center">
              <p className="text-sm font-semibold text-text-primary">{t('empty')}</p>
            </div>
          ) : (
            <>
              <p className="mb-1 px-1 text-[11px] font-semibold tracking-wide text-text-muted">{monthLabel}</p>
              <ul className="divide-y divide-divider rounded-xl bg-bg-card">
                {filtered.map((item) => {
                  const status = toStatus(item);
                  const route = outputFormatToReviewRoute(item.output_format ?? undefined);
                  const summary = item.content || item.refined_text || item.raw_text || t('noPreview');
                  const durationSec = item.elapsed_time ?? 0;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-2 py-3 text-left hover:bg-bg-surface"
                        onClick={() => router.push(`/${route}?id=${item.id}`)}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10">
                          <span className="text-[14px] text-accent-blue">♪</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[15px] font-semibold text-text-primary">{formatTime(item.created_at, locale)}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-text-muted">{formatDurationLabel(durationSec)}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  status === 'done'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}
                              >
                                {status === 'done' ? t('done') : t('draft')}
                              </span>
                            </div>
                          </div>
                          <p className="mt-0.5 truncate text-[12px] text-text-muted">{summary}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </main>

        <footer className="border-t border-border/80 bg-bg-page px-4 py-3">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => router.push(`/recording?patient=${encodeURIComponent(folderName)}`)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-lg"
              aria-label={t('startRecording')}
            >
              <Mic className="h-6 w-6" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}