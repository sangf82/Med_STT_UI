'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { getMyRecords, type SttRecord } from '@/lib/api/sttMetrics';
import { outputFormatToReviewRoute } from '@/lib/outputFormat';
import { Loader2, FileText, AlertCircle } from 'lucide-react';

function formatDate(created_at: string) {
  try {
    const d = new Date(created_at);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return created_at;
  }
}

export default function RecordsPage() {
  const t = useTranslations('Records');
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [items, setItems] = useState<SttRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRecords(0, 50);
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('loadError'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll when there are processing items so list updates when they complete
  useEffect(() => {
    const hasProcessing = items.some((r) => r.status === 'processing' || r.status === 'pending');
    if (!hasProcessing) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [items, load]);

  const openRecord = (r: SttRecord) => {
    if (r.status === 'processing' || r.status === 'pending') return;
    const raw = r.output_format ?? (r as { output_type?: string }).output_type;
    const formatRoute = outputFormatToReviewRoute(raw);
    router.push(`/${formatRoute}?id=${r.id}`);
  };

  const statusLabel: Record<string, string> = {
    processing: t('status.processing'),
    completed: t('status.completed'),
    failed: t('status.failed'),
    pending: t('status.pending'),
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <Header
        title={t('title')}
        subtitle={t('subtitle', { total })}
        onBack={() => router.back()}
      />
      <div className="flex-1 px-4 pb-6">
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-3" />
            <p className="text-text-muted text-sm">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">{t('empty')}</div>
        ) : (
          <ul className="space-y-2">
            {items.map((r) => {
              const isProcessing = r.status === 'processing' || r.status === 'pending';
              const isHighlight = highlightId === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openRecord(r)}
                    disabled={isProcessing}
                    className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                      isHighlight ? 'border-accent-blue bg-accent-blue/10' : 'border-border bg-bg-surface'
                    } ${isProcessing ? 'opacity-90 cursor-not-allowed' : 'hover:bg-bg-hover active:scale-[0.99]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 text-accent-blue animate-spin shrink-0" />
                      ) : r.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-text-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {r.display_name || t('recordFallback', { idSuffix: r.id.slice(-6) })}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatDate(r.created_at)} · {statusLabel[r.status] ?? r.status}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
