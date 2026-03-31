'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, FileText, Info, ListTodo, Loader2, Mic, Search, Stethoscope } from 'lucide-react';
import { getPatientFolderRecords, type SttRecord } from '@/lib/api/sttMetrics';
import { normalizeOutputFormatToken, outputFormatToReviewRoute } from '@/lib/outputFormat';

type FilterTab = 'all' | 'soap' | 'ehr' | 'operative' | 'todo';

function formatDateTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDuration(seconds?: number) {
  const sec = Math.max(0, Math.round(seconds ?? 0));
  const min = Math.floor(sec / 60);
  const remain = sec % 60;
  return `${min}m ${remain}s`;
}

function getTypeIndicator(format: ReturnType<typeof normalizeOutputFormatToken>) {
  if (format === 'soap_note') {
    return {
      Icon: FileText,
      iconClassName: 'text-accent-blue',
      containerClassName: 'bg-accent-blue/10',
    };
  }
  if (format === 'ehr') {
    return {
      Icon: Stethoscope,
      iconClassName: 'text-[#0D9488]',
      containerClassName: 'bg-[#F0FDFA]',
    };
  }
  if (format === 'operative_note') {
    return {
      Icon: Stethoscope,
      iconClassName: 'text-[#0EA5E9]',
      containerClassName: 'bg-[#EFF6FF]',
    };
  }
  if (format === 'to-do') {
    return {
      Icon: ListTodo,
      iconClassName: 'text-[#7C3AED]',
      containerClassName: 'bg-[#F5F3FF]',
    };
  }
  return {
    Icon: FileText,
    iconClassName: 'text-[#2563EB]',
    containerClassName: 'bg-[#EFF6FF]',
  };
}

export default function PatientFolderRecordsPage() {
  const t = useTranslations('PatientRecords');
  const r = useTranslations('Review');
  const localeKey = useLocale();
  const locale = localeKey === 'vi' ? 'vi-VN' : 'en-US';
  const router = useRouter();
  const params = useParams<{ folderName: string }>();
  const folderName = decodeURIComponent(params.folderName ?? '');

  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPatientFolderRecords(folderName, 0, 100);
      const next = Array.isArray(res?.items) ? res.items : [];
      setItems(next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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

    return items.filter((item) => {
      const format = normalizeOutputFormatToken(item.output_format ?? undefined);
      if (activeTab === 'soap' && format !== 'soap_note') return false;
      if (activeTab === 'ehr' && format !== 'ehr') return false;
      if (activeTab === 'operative' && format !== 'operative_note') return false;
      if (activeTab === 'todo' && format !== 'to-do') return false;

      if (!q) return true;
      const name = (item.display_name || '').toLowerCase();
      const content = (item.content || item.refined_text || item.raw_text || '').toLowerCase();
      return name.includes(q) || content.includes(q);
    });
  }, [activeTab, items, searchText]);

  const tabs = useMemo(
    () => [
      { id: 'all' as const, label: t('tabAll') },
      { id: 'soap' as const, label: r('soapNote') },
      { id: 'ehr' as const, label: r('ehrSummary') },
      { id: 'operative' as const, label: r('operativeNote') },
      { id: 'todo' as const, label: r('todoList') },
    ],
    [r, t]
  );

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg-page">
        <header className="border-b border-border/80 bg-bg-card px-4 pt-1.5">
          <div className="flex h-12 items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/patients')}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('back')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-[16px] font-semibold text-text-primary">{folderName}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/patients/${encodeURIComponent(folderName)}/records`)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('patientInfo')}
            >
              <Info className="h-4.5 w-4.5 text-text-muted" />
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

          <div className="-mx-4 flex border-t border-border/80 px-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'flex-1 border-b-2 py-2.5 text-[12px] font-medium transition-colors',
                    isActive ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-3 pb-28">
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
            <ul className="divide-y divide-divider rounded-xl bg-bg-card">
              {filtered.map((item) => {
                const format = normalizeOutputFormatToken(item.output_format ?? undefined);
                const route = outputFormatToReviewRoute(item.output_format ?? undefined);
                const statusDone = item.status === 'completed';
                const preview = item.content || item.refined_text || item.raw_text || t('noPreview');
                const { Icon, iconClassName, containerClassName } = getTypeIndicator(format);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-2 py-3 text-left hover:bg-bg-surface"
                      onClick={() => router.push(`/${route}?id=${item.id}`)}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${containerClassName}`}>
                        <Icon className={`h-4.5 w-4.5 ${iconClassName}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[15px] font-semibold text-text-primary">
                            {item.display_name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-text-muted">{formatDuration(item.elapsed_time)}</span>
                            <span
                              className={[
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                statusDone
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                              ].join(' ')}
                            >
                              {statusDone ? t('done') : t('draft')}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-text-muted">{preview}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-bg-page/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-bg-page/85">
          <div className="mx-auto flex w-full max-w-md items-center justify-center">
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
