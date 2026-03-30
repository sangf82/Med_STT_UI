'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Trash2 } from 'lucide-react';
import {
  deleteMyPatientFolder,
  getPatientFolderRecords,
  getSttPatientProfile,
  patchSttPatientProfile,
  renameMyPatientFolder,
  type SttRecord,
} from '@/lib/api/sttMetrics';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';

function deriveInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PT';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function folderNameFromParams(folderNameParam: string | string[] | undefined): string {
  const raw = Array.isArray(folderNameParam) ? folderNameParam[0] : folderNameParam;
  if (raw == null || raw === '') return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const emptyProfileDraft = () => ({
  date_of_birth: '',
  gender: '',
  medical_record_number: '',
  notes: '',
});

export default function PatientInfoPage() {
  const t = useTranslations('PatientInfo');
  const router = useRouter();
  const params = useParams<{ folderName: string }>();
  const folderName = useMemo(() => folderNameFromParams(params?.folderName), [params?.folderName]);

  const isUnknownVirtual = folderName.trim().toLowerCase() === 'unknown patient';

  const [records, setRecords] = useState<SttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [nameDraft, setNameDraft] = useState(folderName);
  const [renaming, setRenaming] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | undefined>();

  const loadAll = useCallback(async () => {
    if (!folderName) {
      setRecords([]);
      setProfileDraft(emptyProfileDraft());
      setLoading(false);
      return;
    }
    setLoading(true);
    setProfileError(undefined);
    try {
      const recordsPromise = getPatientFolderRecords(folderName, 0, 100);
      const profilePromise =
        !isUnknownVirtual
          ? getSttPatientProfile(folderName).catch(() => null)
          : Promise.resolve(null);
      const [recRes, prof] = await Promise.all([recordsPromise, profilePromise]);
      setRecords(Array.isArray(recRes?.items) ? recRes.items : []);
      if (prof && typeof prof === 'object') {
        setProfileDraft({
          date_of_birth: prof.date_of_birth ?? '',
          gender: prof.gender ?? '',
          medical_record_number: prof.medical_record_number ?? '',
          notes: prof.notes ?? '',
        });
      } else {
        setProfileDraft(emptyProfileDraft());
      }
    } catch {
      setRecords([]);
      setProfileDraft(emptyProfileDraft());
    } finally {
      setLoading(false);
    }
  }, [folderName, isUnknownVirtual]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setNameDraft(folderName);
    setNameError(undefined);
  }, [folderName]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [records]);

  const latestTranscriptPreview =
    latestRecord?.content || latestRecord?.refined_text || latestRecord?.raw_text || '';

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    setNameError(undefined);
    if (!trimmed || trimmed === folderName) return;
    if (isUnknownVirtual) {
      setNameError(t('cannotRenameUnknown'));
      return;
    }
    setRenaming(true);
    try {
      const res = await renameMyPatientFolder(folderName, trimmed);
      const nextName = typeof res?.name === 'string' ? res.name : trimmed;
      router.replace(`/patients/${encodeURIComponent(nextName)}/records`);
    } catch (e: unknown) {
      const status = typeof e === 'object' && e && 'status' in e ? (e as { status?: number }).status : undefined;
      if (status === 409) {
        setNameError(t('renameConflict'));
      } else {
        setNameError(t('renameFailed'));
      }
    } finally {
      setRenaming(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isUnknownVirtual || !folderName) return;
    setProfileError(undefined);
    setSavingProfile(true);
    try {
      const dob = profileDraft.date_of_birth.trim();
      if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        setProfileError(t('invalidDateOfBirth'));
        setSavingProfile(false);
        return;
      }
      await patchSttPatientProfile(folderName, {
        date_of_birth: dob || null,
        gender: profileDraft.gender.trim() || null,
        medical_record_number: profileDraft.medical_record_number.trim() || null,
        notes: profileDraft.notes.trim() || null,
      });
      await loadAll();
    } catch {
      setProfileError(t('profileSaveFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

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

  const displayName = nameDraft.trim() || folderName;
  const nameDirty = nameDraft.trim() !== folderName.trim();

  if (!folderName) {
    return (
      <div className="min-h-screen bg-bg-card p-5">
        <p className="text-text-muted text-sm">{t('loading')}</p>
      </div>
    );
  }

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
                  <span className="text-[24px] font-bold text-text-on-accent">{deriveInitials(displayName)}</span>
                </div>
                <p className="text-[20px] font-bold text-text-primary">{displayName}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Input
                  label={t('fullName')}
                  value={nameDraft}
                  onChange={(ev) => setNameDraft(ev.target.value)}
                  disabled={isUnknownVirtual || renaming}
                  error={nameError}
                />
                {!isUnknownVirtual ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={renaming || !nameDraft.trim() || !nameDirty}
                    onClick={() => void handleSaveName()}
                  >
                    {renaming ? t('savingName') : t('saveName')}
                  </Button>
                ) : (
                  <p className="text-[12px] text-text-muted">{t('cannotRenameUnknown')}</p>
                )}
              </div>

              {!isUnknownVirtual ? (
                <div className="flex flex-col gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">
                    {t('clinicalProfileSection')}
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">
                      {t('dateOfBirth')}
                    </p>
                    <input
                      type="date"
                      value={profileDraft.date_of_birth}
                      onChange={(ev) => setProfileDraft((p) => ({ ...p, date_of_birth: ev.target.value }))}
                      className={cn(
                        'flex h-11 w-full rounded-lg border border-border-medium bg-bg-card px-3 text-[15px] text-text-primary',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue',
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">
                      {t('gender')}
                    </p>
                    <select
                      value={profileDraft.gender}
                      onChange={(ev) => setProfileDraft((p) => ({ ...p, gender: ev.target.value }))}
                      className={cn(
                        'flex h-11 w-full rounded-lg border border-border-medium bg-bg-card px-3 text-[15px] text-text-primary',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue',
                      )}
                    >
                      <option value="">{t('selectGender')}</option>
                      <option value="male">{t('male')}</option>
                      <option value="female">{t('female')}</option>
                    </select>
                  </div>

                  <Input
                    label={t('medicalRecordId')}
                    value={profileDraft.medical_record_number}
                    onChange={(ev) => setProfileDraft((p) => ({ ...p, medical_record_number: ev.target.value }))}
                  />

                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">{t('notes')}</p>
                    <textarea
                      value={profileDraft.notes}
                      onChange={(ev) => setProfileDraft((p) => ({ ...p, notes: ev.target.value }))}
                      rows={4}
                      className={cn(
                        'w-full resize-y rounded-lg border border-border-medium bg-bg-card px-3 py-2.5 text-[14px] text-text-primary',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue',
                      )}
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>

                  {profileError ? <p className="text-[12px] text-danger">{profileError}</p> : null}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={savingProfile}
                    onClick={() => void handleSaveProfile()}
                  >
                    {savingProfile ? t('savingProfile') : t('saveProfile')}
                  </Button>
                </div>
              ) : (
                <p className="text-[12px] text-text-muted">{t('noProfileForUnknown')}</p>
              )}

              {latestTranscriptPreview ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">
                    {t('latestRecordingPreview')}
                  </p>
                  <p className="text-[11px] text-text-muted">{t('latestRecordingPreviewHint')}</p>
                  <div className="min-h-16 rounded-lg border border-border-medium bg-bg-card px-3 py-2.5">
                    <p className="line-clamp-4 text-[14px] text-text-primary">{latestTranscriptPreview}</p>
                  </div>
                </div>
              ) : null}

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
