'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { deleteMyPatientFolder, getPatientFolderRecords, type SttRecord } from '@/lib/api/sttMetrics';

function deriveInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PT';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function deriveMrn(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `MRN-${String(hash).padStart(8, '0').slice(0, 8)}`;
}

function formatLongDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function PatientInfoPage() {
  const t = useTranslations('PatientInfo');
  const localeKey = useLocale();
  const locale = localeKey === 'vi' ? 'vi-VN' : 'en-US';
  const router = useRouter();
  const params = useParams<{ folderName: string }>();
  const folderName = decodeURIComponent(params.folderName ?? '');

  const [records, setRecords] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPatientFolderRecords(folderName, 0, 100);
      setRecords(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [folderName]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [records]);

  const dobText = latestRecord ? formatLongDate(latestRecord.created_at, locale) : t('unknown');
  const notesText = latestRecord?.content || latestRecord?.refined_text || latestRecord?.raw_text || t('notesPlaceholder');

  const handleDeletePatient = async () => {
    const confirmed = confirm(t('deleteConfirm'));
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteMyPatientFolder(folderName, true);
      router.push('/patients');
    } catch {
      alert(t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-card">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg-card">
        <header className="flex h-12 items-center justify-between border-b border-border-medium bg-bg-card px-4">
          <button
            type="button"
            onClick={() => router.push(`/patients/${encodeURIComponent(folderName)}`)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
            aria-label={t('back')}
          >
            <ChevronLeft className="h-5 w-5 text-text-primary" />
          </button>
          <h1 className="text-[18px] font-bold text-text-primary">{t('title')}</h1>
          <div className="h-10 w-10" />
        </header>

        <main className="flex-1 px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-text-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex h-18 w-18 items-center justify-center rounded-full bg-avatar-bg">
                  <span className="text-[24px] font-bold text-text-on-accent">{deriveInitials(folderName)}</span>
                </div>
                <p className="text-[20px] font-bold text-text-primary">{folderName}</p>
              </div>

              <InfoField label={t('fullName')} value={folderName} />

              <InfoField
                label={t('dateOfBirth')}
                value={dobText}
                rightNode={<Calendar className="h-4.5 w-4.5 text-text-secondary" />}
              />

              <InfoField
                label={t('gender')}
                value={t('male')}
                rightNode={<ChevronDown className="h-4.5 w-4.5 text-text-secondary" />}
              />

              <InfoField label={t('medicalRecordId')} value={deriveMrn(folderName)} />

              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">{t('notes')}</p>
                <div className="min-h-20 rounded-lg border border-border-medium bg-bg-card px-3 py-2.5">
                  <p className="line-clamp-4 text-[14px] text-text-primary">{notesText}</p>
                </div>
              </div>

              <div className="h-px w-full bg-border-medium" />

              <div className="flex items-center justify-between">
                <span className="text-[14px] text-text-secondary">{t('totalRecordings')}</span>
                <span className="text-[14px] font-semibold text-text-primary">{records.length}</span>
              </div>

              <button
                type="button"
                onClick={() => void handleDeletePatient()}
                disabled={deleting}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-danger bg-bg-card text-[15px] font-semibold text-danger disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
                <span>{t('deletePatient')}</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  rightNode,
}: {
  label: string;
  value: string;
  rightNode?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">{label}</p>
      <div className="flex h-11 items-center justify-between rounded-lg border border-border-medium bg-bg-card px-3">
        <span className="text-[15px] text-text-primary">{value}</span>
        {rightNode}
      </div>
    </div>
  );
}
