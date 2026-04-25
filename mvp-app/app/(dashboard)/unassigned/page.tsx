'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/Badge';
import { SaveDialog } from '@/components/SaveDialog';
import { getMyRecords, getRecordById, updateRecord, type SttRecord } from '@/lib/api/sttMetrics';
import { outputFormatToReviewRoute, outputFormatToViLabel } from '@/lib/outputFormat';
import { ChevronLeft, Loader2, Search, UserPlus } from 'lucide-react';

export default function UnassignedPage() {
  const t = useTranslations('Unassigned');
  const b = useTranslations('Badge');
  const router = useRouter();

  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SttRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const recordsRes = await getMyRecords(0, 120);
      const unassigned = (recordsRes.items || []).filter((item) => !item.patient_name?.trim());
      unassigned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(unassigned);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = (item.display_name || '').toLowerCase();
      const content = (item.content || item.refined_text || item.raw_text || '').toLowerCase();
      return name.includes(q) || content.includes(q);
    });
  }, [items, query]);

  const handleOpenAssignDialog = (record: SttRecord) => {
    setSelectedRecord(record);
    setAssignDialogOpen(true);
  };

  const handleAssign = async (_name: string, _format: string, patientName: string) => {
    if (!selectedRecord) return;
    const trimmed = patientName.trim();
    if (!trimmed) return;

    setAssigningId(selectedRecord.id);
    try {
      const fullRecord = await getRecordById(selectedRecord.id);
      const content = fullRecord.content || fullRecord.refined_text || fullRecord.raw_text || '';
      await updateRecord(selectedRecord.id, {
        content,
        patient_name: trimmed,
      });
      setAssignDialogOpen(false);
      setSelectedRecord(null);
      await loadData();
    } catch {
      alert(t('assignFailed'));
    } finally {
      setAssigningId(null);
    }
  };

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
          <div className="pb-3">
            <div className="flex h-9 items-center gap-2 rounded-xl bg-bg-card-2 px-3 text-text-secondary">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                placeholder={t('searchPlaceholder')}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-14 text-text-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[16px] font-semibold text-text-primary">{t('emptyTitle')}</p>
              <p className="mt-1 text-[13px] text-text-muted">{t('emptySubtitle')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((item) => {
                const isProcessing = item.status === 'processing' || item.status === 'pending';
                return (
                  <div key={item.id} className="rounded-2xl bg-bg-card px-4 py-3">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => router.push(`/${outputFormatToReviewRoute(item.output_format)}?id=${item.id}`)}
                      className="w-full text-left disabled:opacity-70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-text-primary">
                            {item.display_name || t('recordFallback')}
                          </p>
                          <p className="mt-1 truncate text-[12px] text-text-secondary">
                            {outputFormatToViLabel(item.output_format)} · {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={isProcessing ? 'progress' : item.status === 'completed' ? 'success' : 'warn'}>
                          {item.status === 'completed' ? b('transcribed') : isProcessing ? b('transcribing') : b('error')}
                        </Badge>
                      </div>
                    </button>
                    <button
                      type="button"
                      disabled={assigningId === item.id}
                      onClick={() => handleOpenAssignDialog(item)}
                      className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium text-accent-blue disabled:opacity-60"
                    >
                      {assigningId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {t('assignAction')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {assignDialogOpen && (
          <SaveDialog
            onCancel={() => {
              setAssignDialogOpen(false);
              setSelectedRecord(null);
            }}
            onSave={(name, format, patientName) => {
              void handleAssign(name, format, patientName);
            }}
            initialPatientName={selectedRecord?.patient_name || ''}
          />
        )}
      </div>
    </div>
  );
}
