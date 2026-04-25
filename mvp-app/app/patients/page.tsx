'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, FolderOpen, FolderPlus, Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createMyPatientFolder, getMyPatientFolders } from '@/lib/api/sttMetrics';

type FolderItem = {
  id?: string | null;
  name: string;
  record_count: number;
  latest_record_at?: string | null;
  is_virtual?: boolean;
};

const UNKNOWN_FOLDER_NAMES = new Set([
  'unknown patient',
  'unknown',
  'unassigned',
]);

const isUnknownFolder = (folder: FolderItem) => {
  if (!folder.is_virtual) return false;
  return UNKNOWN_FOLDER_NAMES.has(folder.name.trim().toLowerCase());
};

const formatVisitDate = (iso: string | null | undefined, locale: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: '2-digit' }).format(date);
};

export default function PatientsPage() {
  const t = useTranslations('Patients');
  const router = useRouter();
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPatientFolders();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((f) => (!f.is_virtual || f.record_count > 0) && !isUnknownFolder(f));
    return filtered.sort((a, b) => {
      const aTime = a.latest_record_at ? new Date(a.latest_record_at).getTime() : 0;
      const bTime = b.latest_record_at ? new Date(b.latest_record_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [searchText, visibleItems]);

  const monthLabel = useMemo(() => {
    const baseDate = filteredItems[0]?.latest_record_at ? new Date(filteredItems[0].latest_record_at) : new Date();
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(baseDate).toUpperCase();
  }, [filteredItems]);

  const handleAddPatient = async () => {
    const name = prompt(t('newPatientPrompt'));
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createMyPatientFolder(trimmed);
      await loadFolders();
      router.push(`/patients/${encodeURIComponent(trimmed)}`);
    } catch {
      alert(t('createFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg-page">
        <header className="h-12 border-b border-border bg-bg-card px-4">
          <div className="flex h-full items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('back')}
            >
              <ChevronLeft className="h-5 w-5 text-text-primary" />
            </button>
            <h1 className="text-[16px] font-semibold text-text-primary">{t('title')}</h1>
          </div>
        </header>

        <div className="h-13 bg-bg-card px-4 py-2">
          <div className="h-full">
            <div className="flex h-9 items-center gap-2 rounded-xl bg-bg-card-2 px-3 text-text-muted">
              <Search className="h-4 w-4" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                placeholder={t('searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 pt-1 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <Loader2 className="mb-2 h-8 w-8 animate-spin" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-divider bg-bg-card px-4 py-8 text-center">
              <p className="text-[14px] font-medium text-text-primary">{t('empty')}</p>
              <button
                type="button"
                onClick={handleAddPatient}
                disabled={creating}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-70"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                {t('addPatient')}
              </button>
            </div>
          ) : (
            <>
              <p className="h-7 px-0.5 text-[11px] font-semibold text-text-secondary">{monthLabel}</p>
              <ul>
                {filteredItems.map((folder, index) => {
                  const visitDate = formatVisitDate(folder.latest_record_at, 'en-US');
                  const subtitle = visitDate
                    ? t('lastVisitAndCount', {
                        date: visitDate,
                        countLabel: t(folder.record_count === 1 ? 'recordCountSingle' : 'recordCountPlural', {
                          count: folder.record_count,
                        }),
                      })
                    : t('recordsCount', { count: folder.record_count });

                  return (
                    <li key={folder.id || folder.name}>
                      <Link
                        href={`/patients/${encodeURIComponent(folder.name)}`}
                        className="flex items-center gap-3 px-0 py-3 hover:bg-bg-surface"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <FolderOpen className="h-5 w-5 text-[#2563EB]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium text-text-primary">{folder.name}</p>
                          <p className="mt-0.75 truncate text-[12px] text-text-secondary">{subtitle}</p>
                        </div>
                        <ChevronRight className="h-4.5 w-4.5 shrink-0 text-text-light" />
                      </Link>
                      {index < filteredItems.length - 1 ? <div className="h-px w-full bg-bg-card-2" /> : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

