'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Loader2, Mic, FileText, AlertCircle } from 'lucide-react';
import { getPatientFolderRecords, type SttRecord } from '@/lib/api/sttMetrics';

const STATUS_LABEL: Record<string, string> = {
  processing: 'Đang xử lý',
  pending: 'Đang chờ',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
};

function openRouteByFormat(record: SttRecord): string {
  const raw = (record.output_format ?? '').trim().toLowerCase();
  if (raw === 'soap_note' || raw === 'soap') return `/soap?id=${record.id}`;
  if (raw === 'ehr' || raw === 'clinical') return `/ehr?id=${record.id}`;
  if (raw === 'to-do' || raw === 'todo') return `/todo?id=${record.id}`;
  return `/soap?id=${record.id}`;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ folderName: string }>();
  const folderName = decodeURIComponent(params?.folderName || '');
  const [items, setItems] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!folderName) return;
    setLoading(true);
    try {
      const res = await getPatientFolderRecords(folderName, 0, 100);
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(res?.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [folderName]);

  useEffect(() => {
    load();
  }, [load]);

  const hasAnyContext = useMemo(
    () => items.some((r) => (r.context_text || '').trim().length > 0 || r.context_status === 'available'),
    [items]
  );

  return (
    <div className="min-h-screen bg-bg-page">
      <Header
        title={folderName || 'Folder bệnh nhân'}
        subtitle={`${total} bản ghi`}
        onBack={() => router.back()}
        rightNode={
          <button
            type="button"
            onClick={() => router.push(`/recording?patient=${encodeURIComponent(folderName)}`)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-bg-surface"
            title="Tạo voice mới"
          >
            <Mic className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pb-8">
        {!loading && !hasAnyContext && (
          <div className="mb-3 rounded-xl border border-border bg-bg-surface px-3 py-2">
            <p className="text-[12px] font-semibold text-text-primary mb-1">Context cũ</p>
            <p className="text-[13px] text-text-muted">
              Chưa có dữ liệu khám cũ. Bản SOAP này sẽ được khởi tạo mới hoàn toàn.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Đang tải bản ghi...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-divider bg-bg-surface p-8 text-center">
            <p className="text-[14px] font-semibold text-text-primary">Folder này chưa có bản ghi nào.</p>
            <p className="mt-1 text-[12px] text-text-muted">Nhấn biểu tượng micro để tạo bản ghi mới cho bệnh nhân này.</p>
          </div>
        ) : (
          <ul className="space-y-2 pt-1">
            {items.map((r) => {
              const processing = r.status === 'processing' || r.status === 'pending';
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (processing) return;
                      router.push(openRouteByFormat(r));
                    }}
                    className="w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-left hover:bg-bg-hover disabled:opacity-80"
                    disabled={processing}
                  >
                    <div className="flex items-start gap-3">
                      {processing ? (
                        <Loader2 className="w-5 h-5 mt-0.5 animate-spin text-accent-blue shrink-0" />
                      ) : r.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 mt-0.5 text-danger shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 mt-0.5 text-text-muted shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-text-primary truncate">
                          {r.display_name || 'Bản ghi không tên'}
                        </p>
                        <p className="text-[12px] text-text-muted mt-0.5">
                          {new Date(r.created_at).toLocaleString('vi-VN')} · {STATUS_LABEL[r.status] ?? r.status}
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

