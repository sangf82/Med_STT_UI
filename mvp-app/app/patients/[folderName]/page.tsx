'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  History,
  Mic,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { type Editor } from '@tiptap/react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { EditorToolbar } from '@/components/EditorToolbar';
import { getPatientFolderRecords, getRecordById, updateRecord, type SttRecord } from '@/lib/api/sttMetrics';
import { normalizeOutputFormatToken } from '@/lib/outputFormat';

type TabKey = 'soap' | 'ehr' | 'todo';

const TAB_ORDER: TabKey[] = ['soap', 'ehr', 'todo'];

function getRecordTimestamp(record: SttRecord): number {
  const created = Date.parse(record.created_at ?? '');
  if (Number.isFinite(created)) return created;
  const updated = Date.parse(record.updated_at ?? '');
  if (Number.isFinite(updated)) return updated;
  return 0;
}

function getTemplateForTab(tab: TabKey, t: ReturnType<typeof useTranslations<'PatientFolder'>>) {
  if (tab === 'soap') {
    return [
      `S — ${t('subjective')}`,
      t('subjectivePlaceholder'),
      '',
      `O — ${t('objective')}`,
      t('objectivePlaceholder'),
      '',
      `A — ${t('assessment')}`,
      t('assessmentPlaceholder'),
      '',
      `P — ${t('plan')}`,
      t('planPlaceholder'),
    ].join('\n');
  }
  if (tab === 'ehr') {
    return [
      `# ${t('ehrSummary')}`,
      '',
      t('ehrPlaceholder'),
    ].join('\n');
  }
  return [
    `# ${t('todoList')}`,
    '',
    `- [ ] ${t('todoPlaceholder1')}`,
    `- [ ] ${t('todoPlaceholder2')}`,
  ].join('\n');
}

export default function PatientFolderPage() {
  const t = useTranslations('PatientFolder');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ folderName: string }>();
  const folderName = decodeURIComponent(params.folderName ?? '');

  const [loadingFolder, setLoadingFolder] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('soap');
  const [recordsByTab, setRecordsByTab] = useState<Record<TabKey, SttRecord | null>>({
    soap: null,
    ehr: null,
    todo: null,
  });
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const lastLoadedContentRef = useRef('');

  const tabLabels = useMemo(
    () => ({
      soap: t('soapNote'),
      ehr: t('ehrSummary'),
      todo: t('todoList'),
    }),
    [t]
  );

  const activeRecord = recordsByTab[activeTab];

  const loadFolder = useCallback(async () => {
    setLoadingFolder(true);
    try {
      const res = await getPatientFolderRecords(folderName, 0, 50);
      const next: Record<TabKey, SttRecord | null> = { soap: null, ehr: null, todo: null };

      for (const item of res.items ?? []) {
        const normalized = normalizeOutputFormatToken(item.output_format ?? undefined);
        const key: TabKey | null = normalized === 'soap_note' ? 'soap' : normalized === 'ehr' ? 'ehr' : normalized === 'to-do' ? 'todo' : null;
        if (!key) continue;
        if (!next[key]) {
          next[key] = item;
          continue;
        }
        if (getRecordTimestamp(item) > getRecordTimestamp(next[key]!)) {
          next[key] = item;
        }
      }

      setRecordsByTab(next);
      const firstAvailable = TAB_ORDER.find((k) => Boolean(next[k])) ?? 'soap';
      setActiveTab(firstAvailable);
    } catch {
      setRecordsByTab({ soap: null, ehr: null, todo: null });
      setActiveTab('soap');
    } finally {
      setLoadingFolder(false);
    }
  }, [folderName]);

  useEffect(() => {
    loadFolder();
  }, [loadFolder]);

  useEffect(() => {
    let isMounted = true;

    const loadTabContent = async () => {
      if (!activeRecord?.id) {
        const fallback = getTemplateForTab(activeTab, t);
        if (!isMounted) return;
        setContent(fallback);
        lastLoadedContentRef.current = fallback;
        setSaveStatus('idle');
        return;
      }

      setLoadingRecord(true);
      try {
        const detail = await getRecordById(activeRecord.id);
        const nextContent = detail.content || detail.refined_text || detail.raw_text || getTemplateForTab(activeTab, t);
        if (!isMounted) return;
        setContent(nextContent);
        lastLoadedContentRef.current = nextContent;
        setSaveStatus('idle');
      } catch {
        if (!isMounted) return;
        const fallback = getTemplateForTab(activeTab, t);
        setContent(fallback);
        lastLoadedContentRef.current = fallback;
        setSaveStatus('error');
      } finally {
        if (isMounted) setLoadingRecord(false);
      }
    };

    loadTabContent();
    return () => {
      isMounted = false;
    };
  }, [activeRecord?.id, activeTab, t]);

  useEffect(() => {
    if (!activeRecord?.id) return;
    if (content === lastLoadedContentRef.current) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateRecord(activeRecord.id, { content });
        lastLoadedContentRef.current = content;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [activeRecord?.id, content]);

  const subtitle = useMemo(() => {
    const d = activeRecord?.created_at ? new Date(activeRecord.created_at) : null;
    const formattedDate = d ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d) : '--';
    const mrn = activeRecord?.id ? activeRecord.id.slice(-6).toUpperCase() : '------';
    return `${t('dobLabel')}: ${formattedDate}  ·  ${t('mrnLabel')}: ${mrn}`;
  }, [activeRecord?.created_at, activeRecord?.id, locale, t]);

  const saveBadge = useMemo(() => {
    if (!activeRecord?.id) return null;
    if (saveStatus === 'saving') return <span className="text-[11px] text-accent-blue">{t('saving')}</span>;
    if (saveStatus === 'saved') return <span className="text-[11px] text-green-600 dark:text-green-400">{t('saved')}</span>;
    if (saveStatus === 'error') return <span className="text-[11px] text-red-500">{t('saveError')}</span>;
    return null;
  }, [activeRecord?.id, saveStatus, t]);

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg-page">
        <header className="border-b border-border/80 bg-bg-page px-4 pb-2 pt-1.25">
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
                <p className="truncate text-[15px] font-semibold text-text-primary">{folderName}</p>
                <p className="truncate text-[10px] text-text-muted">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/patients/${encodeURIComponent(folderName)}/records`)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-bg-surface"
              aria-label={t('refresh')}
            >
              <History className="h-4 w-4 text-text-muted" />
            </button>
          </div>
          <div className="mt-1 flex border-b border-border/80">
            {TAB_ORDER.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 border-b-2 px-2 py-3 text-[12px] ${
                    isActive
                      ? 'border-accent-blue font-semibold text-accent-blue'
                      : 'border-transparent text-text-muted'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>
          <div id="editor-toolbar" className="flex items-center border-b border-border/80 bg-bg-page">
            <div className="min-w-0 flex-1">
              <EditorToolbar editor={editorInstance} />
            </div>
            <div className="ml-2 shrink-0 pr-2">{saveBadge}</div>
          </div>
        </header>

        <main className="relative flex-1 bg-bg-page">
          {loadingFolder || loadingRecord ? (
            <div className="flex h-full items-center justify-center text-text-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : (
            <RichTextEditor
              content={content}
              onChange={setContent}
              minHeight="320px"
              coerceTaskListOnLoad={activeTab === 'todo'}
              showToolbar={false}
              onEditorReady={setEditorInstance}
            />
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