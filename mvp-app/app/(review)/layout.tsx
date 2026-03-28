'use client';

import { Suspense, useState, useRef, createContext, useContext, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { BottomBar } from '@/components/BottomBar';
import { Badge } from '@/components/Badge';
import { MenuPopup } from '@/components/MenuPopup';
import { Copy, SquarePen, ChevronLeft, Loader, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAppContext } from '@/context/AppContext';
import {
    getRecordById,
    updateRecord,
    retryRecord,
    deleteRecord,
    sttChangeFormat,
    refinedTextFromChangeFormatResponse,
    AVAILABLE_OUTPUT_FORMATS,
    normalizeOutputFormat,
    type SttRecord,
    type OutputFormat,
} from '@/lib/api/sttMetrics';
import { formatDurationSec } from '@/lib/utils';


export const ReviewContext = createContext<{
    setSaveStatus: (status: 'saved' | 'saving' | 'error') => void;
    record: any;
} | null>(null);

export function useReview() {
    return useContext(ReviewContext)!;
}

export default function ReviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('Review');
    const d = useTranslations('Badge');
    const router = useRouter();
    const pathname = usePathname();
    const { recordings } = useAppContext();
    const searchParams = useSearchParams();
    const recordId = searchParams.get('id');
    const [menuOpen, setMenuOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [recordingName, setRecordingName] = useState('Patient Consultation');
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [copySuccess, setCopySuccess] = useState(false);
    const [recordData, setRecordData] = useState<SttRecord | null>(null);
    const [isLoadingRecord, setIsLoadingRecord] = useState(true);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryError, setRetryError] = useState<string | null>(null);
    const [timedOutAfterRetries, setTimedOutAfterRetries] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);
    const [convertTargetFormat, setConvertTargetFormat] = useState<OutputFormat>('soap_note');
    const [convertLoading, setConvertLoading] = useState(false);
    const [convertError, setConvertError] = useState<string | null>(null);
    const pollStartTimeRef = useRef(0);
    const autoRetryCountRef = useRef(0);
    const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const TRANSCRIPTION_TIMEOUT_MS = 5 * 60 * 1000;
    const POLL_INTERVAL_MS = 5000; // 5s to avoid excessive requests while transcribing
    const MAX_AUTO_RETRIES = 3;

    useEffect(() => {
        let mounted = true;
        if (!recordId) {
            setIsLoadingRecord(false);
            return;
        }

        const fetchRecord = () =>
            getRecordById(recordId)
                .then(data => {
                    if (mounted) {
                        setRecordData(data);
                        setRecordingName(data.display_name || 'Bản ghi không tên');
                    }
                })
                .catch(err => {
                    console.error("Failed to load record:", err);
                })
                .finally(() => {
                    if (mounted) setIsLoadingRecord(false);
                });

        fetchRecord();
        return () => { mounted = false; };
    }, [recordId]);

    // When viewing a processing record, poll until it completes; timeout then auto-retry max 3 times, then show failed
    useEffect(() => {
        if (!recordId || !recordData || (recordData.status !== 'processing' && recordData.status !== 'pending')) {
            setTimedOutAfterRetries(false);
            return;
        }
        setTimedOutAfterRetries(false);
        pollStartTimeRef.current = Date.now();
        autoRetryCountRef.current = 0;

        const tick = async () => {
            try {
                const data = await getRecordById(recordId);
                setRecordData(data);
                setRecordingName(data.display_name || 'Bản ghi không tên');
                if (data.status === 'completed' || data.status === 'failed') {
                    if (intervalIdRef.current) {
                        clearInterval(intervalIdRef.current);
                        intervalIdRef.current = null;
                    }
                    return;
                }
                const elapsed = Date.now() - pollStartTimeRef.current;
                if (elapsed >= TRANSCRIPTION_TIMEOUT_MS) {
                    if (autoRetryCountRef.current < MAX_AUTO_RETRIES) {
                        await retryRecord(recordId);
                        autoRetryCountRef.current += 1;
                        pollStartTimeRef.current = Date.now();
                        const updated = await getRecordById(recordId);
                        setRecordData(updated);
                        setRecordingName(updated.display_name || 'Bản ghi không tên');
                    } else {
                        if (intervalIdRef.current) {
                            clearInterval(intervalIdRef.current);
                            intervalIdRef.current = null;
                        }
                        setTimedOutAfterRetries(true);
                    }
                }
            } catch {
                // keep polling
            }
        };

        intervalIdRef.current = setInterval(tick, POLL_INTERVAL_MS);
        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        };
    }, [recordId, recordData?.status]);

    useEffect(() => {
        if (!convertOpen || !recordData) return;
        const c = normalizeOutputFormat(String(recordData.output_format || 'soap_note'));
        const alt = AVAILABLE_OUTPUT_FORMATS.find((f) => f !== c) ?? 'soap_note';
        setConvertTargetFormat(alt);
        setConvertError(null);
    }, [convertOpen, recordData?.output_format]);

    const canConvertFormat =
        Boolean(recordData?.status === 'completed' && (recordData.raw_text || '').trim());

    const formatLabels: Record<OutputFormat, string> = {
        soap_note: 'Ghi chú SOAP',
        ehr: 'Tóm tắt lâm sàng (EHR)',
        'to-do': 'Việc cần làm',
        freetext: 'Văn bản tự do',
    };

    const handleConvertSubmit = async () => {
        if (!recordId || !recordData?.raw_text?.trim()) return;
        setConvertLoading(true);
        setConvertError(null);
        try {
            const target = convertTargetFormat;
            const res = await sttChangeFormat({
                raw_text: recordData.raw_text,
                output_format: target,
            });
            const text = refinedTextFromChangeFormatResponse(res);
            if (!text) {
                setConvertError('Dịch vụ không trả nội dung hợp lệ.');
                return;
            }
            await updateRecord(recordId, {
                content: text,
                refined_text: text,
                output_format: target,
                patient_name: recordData.patient_name,
            });
            const updated = await getRecordById(recordId);
            setRecordData(updated);
            setRecordingName(updated.display_name || recordingName);
            setConvertOpen(false);
            const tab =
                target === 'soap_note'
                    ? 'soap'
                    : target === 'ehr'
                      ? 'ehr'
                      : target === 'to-do'
                        ? 'todo'
                        : 'raw';
            router.replace(`/${tab}?id=${recordId}`);
        } catch (e: unknown) {
            const err = e as { message?: string; data?: { detail?: string } };
            setConvertError(
                typeof err?.data?.detail === 'string'
                    ? err.data.detail
                    : err?.message ?? 'Chuyển định dạng thất bại.',
            );
        } finally {
            setConvertLoading(false);
        }
    };

    const format = useMemo(() => {
        if (!recordData) return 'None';
        const type = (recordData.output_format ?? (recordData as { output_type?: string }).output_type ?? '').trim().toLowerCase().replace(/\s/g, '_');
        switch (type) {
            case 'soap_note':
            case 'soap': return 'Ghi chú SOAP';
            case 'ehr': return 'Tóm tắt lâm sàng';
            case 'to-do':
            case 'todo':
            case 'todo_list':
            case 'todo-list': return 'Việc cần làm';
            case 'freetext':
            case 'free':
            case 'raw': return 'Văn bản tự do';
            default: return 'Chưa phân loại';
        }
    }, [recordData]);

    const record = useMemo(() => {
        if (!recordData) return null;
        return {
            id: recordData.id,
            title: recordData.display_name || 'Bản ghi',
            format,
            duration: formatDurationSec((recordData as any).recording_duration_sec),
            date: new Date(recordData.created_at).toLocaleDateString(),
            status: recordData.status === 'completed' ? 'transcribed' : recordData.status === 'failed' ? 'error' : 'transcribing',
            content: recordData.content,
            raw_text: recordData.raw_text,
            refined_text: recordData.refined_text,
            patient_name: recordData.patient_name,
        };
    }, [recordData, format]);



    const allTabs = [
        { id: 'soap', label: t('soapNote') },
        { id: 'ehr', label: t('ehrSummary') },
        { id: 'todo', label: t('todoList') },
        { id: 'raw', label: t('raw') },
    ];

    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (format === 'Ghi chú SOAP' && tab.id === 'soap') return true;
            if (format === 'Tóm tắt lâm sàng' && tab.id === 'ehr') return true;
            if (format === 'Việc cần làm' && tab.id === 'todo') return true;
            if (format === 'Văn bản tự do' && tab.id === 'raw') return true;
            return false;
        });
    }, [format, t]);

    const activeTab = useMemo(() => {
        if (pathname.includes('/ehr')) return 'ehr';
        if (pathname.includes('/soap')) return 'soap';
        if (pathname.includes('/todo')) return 'todo';
        if (pathname.includes('/raw')) return 'raw';
        return 'soap';
    }, [pathname]);

    const handleTabChange = (id: string) => {
        router.push(`/${id}${recordId ? `?id=${recordId}` : ''}`);
    };

    // Redirect if land on invalid tab for the record format
    useEffect(() => {
        if (!record) return;
        const isSoapInvalid = pathname.includes('/soap') && format !== 'Ghi chú SOAP';
        const isEhrInvalid = pathname.includes('/ehr') && format !== 'Tóm tắt lâm sàng';
        const isTodoInvalid = pathname.includes('/todo') && format !== 'Việc cần làm';
        const isRawInvalid = pathname.includes('/raw') && format !== 'Văn bản tự do';

        if (isSoapInvalid || isEhrInvalid || isTodoInvalid || isRawInvalid) {
            const startTab = format === 'Tóm tắt lâm sàng' ? 'ehr' : (format === 'Ghi chú SOAP' ? 'soap' : (format === 'Việc cần làm' ? 'todo' : (format === 'Văn bản tự do' ? 'raw' : 'soap')));
            router.replace(`/${startTab}?id=${recordId}`);
        }
    }, [pathname, record, format, recordId, router]);

    const handleCopy = () => {
        // Find the active TipTap editor instance by its class
        const editorContentElement = document.querySelector('.ProseMirror');
        if (editorContentElement) {
            // Get plain text for normal pasting (Notepad)
            const plainText = (editorContentElement as HTMLElement).innerText || '';
            // Get rich HTML for formatted pasting (Word, Docs)
            const htmlText = editorContentElement.innerHTML;

            // Construct a clipboard item with both formats
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([plainText], { type: 'text/plain' }),
                'text/html': new Blob([htmlText], { type: 'text/html' })
            });

            navigator.clipboard.write([clipboardItem]).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }).catch(() => {
                // Fallback for older browsers
                navigator.clipboard.writeText(plainText);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        }
    };



    const handleRenameConfirm = async () => {
        if (!recordId) return;
        try {
            setSaveStatus('saving');
            // Fetch content from the recordData if available, fallback to empty string
            const currentContent = recordData?.content ?? recordData?.refined_text ?? recordData?.raw_text ?? "";
            
            const payload: { content: string; display_name?: string } = { content: currentContent };
            if (recordingName.trim()) payload.display_name = recordingName.trim();
            await updateRecord(recordId, payload);
            
            setSaveStatus('saved');
            setRenameOpen(false);
            
            // Locally update the name
            if (recordData) {
                setRecordData({ ...recordData, display_name: recordingName });
            }
        } catch (e) {
            console.error("Rename failed", e);
            setSaveStatus('error');
        }
    };

    const isEditMode = pathname.includes('/edit');

    const renderBadge = () => {
        if (record?.status === 'transcribing' || record?.status === 'error') {
            return <Badge variant="warn" className="mr-1">{d('offline')}</Badge>;
        }
        if (saveStatus === 'saving') {
            return (
                <Badge variant="progress" className="mr-1 flex items-center gap-1.5 px-2.5">
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>{d('saving')}</span>
                </Badge>
            );
        }
        return <Badge variant="success" className="mr-1">{d('saved')}</Badge>;
    };

    return (
        <div className="relative min-h-screen bg-bg-page text-text-primary max-w-md mx-auto w-full shadow-lg flex flex-col fade-in pt-1.25 overflow-x-hidden">
            <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
                <ReviewContext.Provider value={{ setSaveStatus, record }}>

                    {/* Header is dynamic based on edit mode */}
                    {!isEditMode ? (
                        <header className="sticky top-0 z-40 flex items-center justify-between min-h-16 pt-4 px-4 w-full bg-bg-page text-text-primary tracking-tight">
                            <div className="flex items-center gap-1 min-w-0">
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            window.location.href = '/dashboard';
                                        } else {
                                            router.push('/dashboard');
                                        }
                                    }}
                                    className="w-10 h-10 -ml-2 shrink-0 rounded-full flex items-center justify-center hover:bg-bg-surface active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2"
                                    aria-label="Back"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[17px] font-bold leading-tight truncate">{recordingName}</span>
                                    <span className="text-[11px] font-medium text-text-muted shrink-0">{record?.format === 'Việc cần làm' ? t('todoList') : (record?.format || 'None')} &middot; {record?.duration} &middot; {record?.date}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                {renderBadge()}
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all outline-none"
                                    aria-label="Menu"
                                >
                                    <SquarePen className="w-5 h-5 text-text-muted" strokeWidth={1.75} />
                                </button>
                            </div>
                        </header>
                    ) : (
                        <Header
                            onBack={() => router.back()}
                            title={t('editSoap')}
                            rightNode={
                                <button
                                    onClick={() => router.back()}
                                    className="bg-accent-blue text-white text-[13px] font-bold px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform mr-1 focus-visible:outline-none focus-visible:ring-2"
                                >
                                    {t('save')}
                                </button>
                            }
                        />
                    )}

                    {/* Tabs (Hidden in Edit mode) */}
                    {!isEditMode && (
                        <div className="flex items-center w-full bg-bg-card dark:bg-bg-page shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none z-20 sticky top-16 h-12 transition-all">
                            <div className="flex-1 flex items-center h-full">
                                <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
                            </div>
                            <div className="flex items-center justify-center p-1 mr-1">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all text-brand-orange"
                                    aria-label="Copy"
                                >
                                    <Copy className="w-[18px] h-[18px]" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Content */}
                    <div className="flex-1 relative flex flex-col min-h-0">
                        {isLoadingRecord ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <Loader className="w-8 h-8 animate-spin text-accent-blue mb-4" />
                                <p className="text-[16px] font-medium text-text-primary mb-2">Đang tải...</p>
                            </div>
                        ) : timedOutAfterRetries || record?.status === 'error' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                                    <AlertCircle className="w-8 h-8 text-danger" />
                                </div>
                                <h3 className="text-[18px] font-bold text-text-primary mb-2">
                                    {timedOutAfterRetries ? t('timeoutAfterRetriesDetail') : t('errorDetail')}
                                </h3>
                                {retryError && (
                                    <p className="text-[13px] text-danger mb-3 px-4 text-center">{retryError}</p>
                                )}
                                <button
                                    onClick={async () => {
                                        if (!recordId) return;
                                        setRetryError(null);
                                        try {
                                            if (timedOutAfterRetries) {
                                                setTimedOutAfterRetries(false);
                                                pollStartTimeRef.current = Date.now();
                                                autoRetryCountRef.current = 0;
                                            }
                                            await retryRecord(recordId);
                                            setRetryError(null);
                                            const updated = await getRecordById(recordId);
                                            setRecordData(updated);
                                        } catch (e: unknown) {
                                            console.error('Retry failed', e);
                                            const err = e as { data?: { detail?: string }; message?: string };
                                            setRetryError(err?.data?.detail ?? err?.message ?? 'Thử lại thất bại.');
                                        }
                                    }}
                                    className="mt-4 flex items-center gap-2 bg-accent-blue text-white px-6 py-2.5 rounded-full text-[14px] font-semibold shadow-md active:scale-95 transition-transform"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('retry')}
                                </button>
                            </div>
                        ) : record?.status === 'transcribing' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-accent-blue/20"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-accent-blue border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-[16px] font-medium text-text-primary mb-2">
                                    {t('transcribingDetail')}
                                </p>
                                <p className="text-[13px] text-text-muted max-w-70">
                                    {t('transcribingStuckHint')}
                                </p>
                            </div>
                        ) : (
                            children
                        )}
                    </div>



                    {/* Menu Popup (D4) */}
                    <MenuPopup
                        open={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        onRename={() => setRenameOpen(true)}
                        onConvert={() => setConvertOpen(true)}
                        convertDisabled={!canConvertFormat}
                        onDelete={() => setDeleteOpen(true)}
                    />

                    {/* Rename Dialog (D5) */}
                    <Dialog
                        open={renameOpen}
                        onOpenChange={setRenameOpen}
                        title={t('renameRecording')}
                    >
                        <div className="flex flex-col">
                            <div className="px-1">
                                <input
                                    value={recordingName}
                                    onChange={(e) => setRecordingName(e.target.value)}
                                    autoFocus
                                    className="w-full bg-transparent border-b border-border focus:border-accent-blue outline-none py-1.5 text-[16px] text-text-primary transition-colors pb-2"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <button
                                    className="flex-1 text-center text-[15px] font-semibold text-text-secondary active:scale-95 transition-transform py-2"
                                    onClick={() => setRenameOpen(false)}
                                >
                                    {t('exit')}
                                </button>
                                <div className="w-px h-4 bg-border" />
                                <button
                                    className="flex-1 text-center text-[15px] font-semibold text-accent-blue active:scale-95 transition-transform py-2"
                                    onClick={handleRenameConfirm}
                                >
                                    {t('rename')}
                                </button>
                            </div>
                        </div>
                    </Dialog>

                    {/* D6 · Mob Convert Dialog */}
                    <Dialog
                        open={convertOpen}
                        onOpenChange={(o) => {
                            setConvertOpen(o);
                            if (!o) setConvertError(null);
                        }}
                        title="Convert Format"
                        titleClassName="text-[20px] font-bold"
                        className="max-w-[340px] rounded-[20px] p-6 pb-4 gap-0"
                    >
                        <div className="flex flex-col gap-4 -mt-1">
                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] text-text-muted font-normal">
                                    Recording Name
                                </span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[15px] text-text-primary font-normal truncate">
                                        {recordingName}
                                    </span>
                                    <div className="h-[1.5px] w-full bg-text-primary rounded-full" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[13px] text-text-muted font-normal">
                                    Output Format
                                </span>
                                <div className="h-1" />
                                <div className="relative flex items-center gap-1.5">
                                    <select
                                        className="w-full appearance-none bg-transparent text-[16px] font-bold text-text-primary py-1 pr-8 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30 rounded cursor-pointer"
                                        value={convertTargetFormat}
                                        onChange={(e) =>
                                            setConvertTargetFormat(
                                                normalizeOutputFormat(e.target.value),
                                            )
                                        }
                                        disabled={convertLoading}
                                    >
                                        {AVAILABLE_OUTPUT_FORMATS.map((f) => (
                                            <option key={f} value={f}>
                                                {formatLabels[f]}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                                        strokeWidth={2}
                                    />
                                </div>
                            </div>
                            {convertError ? (
                                <p className="text-[12px] text-danger">{convertError}</p>
                            ) : null}
                            <div className="flex h-12 items-stretch border-t border-border -mx-1 mt-1">
                                <button
                                    type="button"
                                    className="flex-1 flex items-center justify-center text-[16px] font-normal text-accent-blue active:opacity-80"
                                    onClick={() => setConvertOpen(false)}
                                    disabled={convertLoading}
                                >
                                    Cancel
                                </button>
                                <div className="w-px self-center h-5 bg-divider" />
                                <button
                                    type="button"
                                    className="flex-1 flex items-center justify-center gap-2 text-[16px] font-semibold text-accent-blue active:opacity-80"
                                    onClick={() => void handleConvertSubmit()}
                                    disabled={convertLoading || !canConvertFormat}
                                >
                                    {convertLoading ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    Convert
                                </button>
                            </div>
                        </div>
                    </Dialog>

                    {/* Delete Dialog */}
                    <Dialog
                        open={deleteOpen}
                        onOpenChange={setDeleteOpen}
                        title={t('deleteRecording')}
                    >
                        <div className="flex flex-col">
                            <p className="text-[14px] text-text-secondary mb-0.5 px-1 leading-snug">
                                {t('confirmDelete')}
                            </p>
                            <div className="flex items-center justify-between pt-4">
                                <button
                                    className="flex-1 text-center text-[15px] font-semibold text-text-primary active:scale-95 transition-transform py-2"
                                    onClick={() => setDeleteOpen(false)}
                                >
                                    {t('exit')}
                                </button>
                                <div className="w-px h-4 bg-border" />
                                <button
                                    className="flex-1 text-center text-[15px] font-semibold text-danger active:scale-95 transition-transform py-2"
                                    onClick={async () => {
                                        setDeleteOpen(false);
                                        if (recordId) {
                                            try {
                                                await deleteRecord(recordId);
                                                router.push('/dashboard');
                                            } catch (e) {
                                                console.error('Delete failed', e);
                                            }
                                        }
                                    }}
                                >
                                    {t('deleteAction')}
                                </button>
                            </div>
                        </div>
                    </Dialog>

                    {/* Copy Notification */}
                    {copySuccess && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-100 bg-[#1a1a1a]/90 dark:bg-white/90 text-white dark:text-[#1a1a1a] px-4 py-2 rounded-full text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {t('copySuccess')}
                        </div>
                    )}
                </ReviewContext.Provider>
            </Suspense>
        </div>
    );
}
