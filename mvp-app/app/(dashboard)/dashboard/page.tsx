'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Menu, Search, Stethoscope, Loader2, Trash2, FolderOpen, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useSidebar } from '@/context/SidebarContext';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { useRouter } from 'next/navigation';
import { cn, formatDurationSec } from '@/lib/utils';
import { getMyRecords, getMyUsage, deleteRecord, abandonUpload, getMyPatientFolders, createMyPatientFolder } from '@/lib/api/sttMetrics';
import { outputFormatToViLabel, recordLabelToReviewRoute } from '@/lib/outputFormat';
import type { Recording } from '@/lib/mockData';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearStaleUploadSessions } from '@/lib/db';

type PatientFolderItem = {
    id?: string | null;
    name: string;
    record_count: number;
    is_virtual?: boolean;
};

const UNKNOWN_FOLDER_NAMES = new Set([
    'unknown patient',
    'unknown',
    'unassigned',
]);

const isUnknownFolder = (folder: PatientFolderItem) => {
    if (!folder.is_virtual) return false;
    return UNKNOWN_FOLDER_NAMES.has(folder.name.trim().toLowerCase());
};


export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const a = useTranslations('Auth');
    const b = useTranslations('Badge');
    const r = useTranslations('Review');
    const router = useRouter();
    const { open: openSidebar } = useSidebar();
    const { recordings, setRecordings, filter, showSurvey, setShowSurvey, showNotificationDot, setShowNotificationDot, isRecoveringUploads, totalRecordsFromApi, setTotalRecordsFromApi, setTotalByFormat } = useAppContext();
    const [showDevNotice, setShowDevNotice] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentLimit, setCurrentLimit] = useState<number>(50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [patientFolders, setPatientFolders] = useState<PatientFolderItem[]>([]);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const rawUploading = useLiveQuery(() => db.uploads.toArray());
    const uploadingSessions = useMemo(() => rawUploading || [], [rawUploading]);

    const handleSearchClick = () => {
        setShowDevNotice(true);
        setTimeout(() => setShowDevNotice(false), 2000);
    };

    const loadPatientFolders = useCallback(async () => {
        try {
            const res = await getMyPatientFolders();
            setPatientFolders(Array.isArray(res?.items) ? res.items : []);
        } catch {
            setPatientFolders([]);
        }
    }, []);

    const mapFormat = useCallback((ft?: string) => outputFormatToViLabel(ft), []);

    const loadDashboardData = useCallback(async (recordsOnly = false, keepListOnError = false, fetchLimit: number = 50) => {
        const LOAD_TIMEOUT_MS = 20000; // stop spinner after 20s if requests hang (e.g. CORS)
        const timeoutId = setTimeout(() => {
            if (fetchLimit === 50) setIsLoading(false);
            if (fetchLimit > 50) setIsLoadingMore(false);
            if (!keepListOnError) {
                setRecordings([]);
                setTotalRecordsFromApi(0);
                setTotalByFormat({ soap: 0, ehr: 0, todo: 0, free: 0 });
            }
        }, LOAD_TIMEOUT_MS);
        try {
            if (recordsOnly) {
                const resList = fetchLimit === 50
                    ? await Promise.all([getMyRecords(0, fetchLimit), getMyRecords(0, 1, 'soap_note'), getMyRecords(0, 1, 'ehr'), getMyRecords(0, 1, 'to-do'), getMyRecords(0, 1, 'freetext')])
                    : await getMyRecords(0, fetchLimit).then((r) => [r, null, null, null, null] as const);
                const recordsRes = resList[0];
                const items = recordsRes?.items ?? [];
                setTotalRecordsFromApi(recordsRes?.total ?? 0);
                if (fetchLimit === 50 && resList[1] != null) {
                    setTotalByFormat({
                        soap: (resList[1] as { total?: number })?.total ?? 0,
                        ehr: (resList[2] as { total?: number })?.total ?? 0,
                        todo: (resList[3] as { total?: number })?.total ?? 0,
                        free: (resList[4] as { total?: number })?.total ?? 0,
                    });
                }
                const mappedRecords: Recording[] = items.map(item => {
                    const formatLabel = mapFormat(item.output_format ?? (item as { output_type?: string }).output_type);
                    const durSec = (item as any).recording_duration_sec;
                    return {
                        id: item.id,
                        title: item.display_name || 'Bản ghi không tên',
                        patient: (item as { patient_name?: string }).patient_name,
                        format: formatLabel,
                        duration: formatDurationSec(durSec),
                        date: new Date(item.created_at).toLocaleDateString(),
                        status: item.status === 'completed' ? 'transcribed' : item.status === 'failed' ? 'error' : 'transcribing'
                    };
                });
                if (mappedRecords.length > 0 || !keepListOnError) setRecordings(mappedRecords);
                return;
            }
            const [recordsRes, usageRes, soapRes, ehrRes, todoRes, freeRes] = await Promise.all([
                getMyRecords(0, fetchLimit),
                getMyUsage(),
                getMyRecords(0, 1, 'soap_note'),
                getMyRecords(0, 1, 'ehr'),
                getMyRecords(0, 1, 'to-do'),
                getMyRecords(0, 1, 'freetext'),
            ]);
            const items = recordsRes?.items ?? [];
            setTotalRecordsFromApi(recordsRes?.total ?? 0);
            setTotalByFormat({
                soap: soapRes?.total ?? 0,
                ehr: ehrRes?.total ?? 0,
                todo: todoRes?.total ?? 0,
                free: freeRes?.total ?? 0,
            });
            const mappedRecords: Recording[] = items.map(item => {
                const formatLabel = mapFormat(item.output_format ?? (item as { output_type?: string }).output_type);
                const durSec = (item as any).recording_duration_sec;
                return {
                    id: item.id,
                    title: item.display_name || 'Bản ghi không tên',
                    patient: (item as { patient_name?: string }).patient_name,
                    format: formatLabel,
                    duration: formatDurationSec(durSec),
                    date: new Date(item.created_at).toLocaleDateString(),
                    status: item.status === 'completed' ? 'transcribed' : item.status === 'failed' ? 'error' : 'transcribing'
                };
            });
            if (mappedRecords.length > 0 || !keepListOnError) setRecordings(mappedRecords);
            try {
                await clearStaleUploadSessions();
            } catch {
                // ignore IndexedDB errors
            }
            const remaining = usageRes?.stt_remaining ?? 0;
            const requestMore = usageRes?.stt_request_more_count ?? 0;
            if (remaining === 0 && requestMore === 0) {
                setShowSurvey(true);
            } else if (remaining <= 2) {
                setShowNotificationDot(true);
            } else {
                setShowNotificationDot(false);
            }
        } catch (err: any) {
            console.error("Failed to fetch dashboard data", err);
            if (err?.status === 402) {
                setShowSurvey(true);
            }
            if (!keepListOnError) {
                setRecordings([]);
                setTotalRecordsFromApi(0);
                setTotalByFormat({ soap: 0, ehr: 0, todo: 0, free: 0 });
            }
        } finally {
            clearTimeout(timeoutId);
            if (fetchLimit === 50) setIsLoading(false);
            if (fetchLimit > 50) setIsLoadingMore(false);
            if (fetchLimit === 50) {
                await loadPatientFolders();
            }
        }
    }, [loadPatientFolders, mapFormat, setRecordings, setShowNotificationDot, setTotalRecordsFromApi, setTotalByFormat]);

    const loadDashboardDataRef = useRef(loadDashboardData);
    loadDashboardDataRef.current = loadDashboardData;

    useEffect(() => {
        loadDashboardDataRef.current();
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("stt-trigger-upload"));
        }
    }, []);

    // Refetch when user returns (screen on / tab focus / bfcache). Debounce to avoid storm (e.g. CORS/429).
    useEffect(() => {
        if (typeof window === "undefined") return;
        let lastRefetch = 0;
        const REFETCH_DEBOUNCE_MS = 8000;
        const refetch = () => {
            const now = Date.now();
            if (now - lastRefetch < REFETCH_DEBOUNCE_MS) return;
            lastRefetch = now;
            loadDashboardDataRef.current(false, true, currentLimit);
        };
        const onVisible = () => {
            if (document.visibilityState === "visible") refetch();
        };
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) refetch();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("pageshow", onPageShow);
        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("pageshow", onPageShow);
        };
    }, []);

    // Pre-request microphone permission when user first lands on dashboard so recording starts faster
    const micRequested = useRef(false);
    useEffect(() => {
        if (micRequested.current || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
        const t = setTimeout(() => {
            micRequested.current = true;
            navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: { ideal: 1 },
                    echoCancellation: { ideal: false },
                    noiseSuppression: { ideal: false },
                    autoGainControl: { ideal: false },
                }
            })
                .then((stream) => { stream.getTracks().forEach((track) => track.stop()); })
                .catch(() => {});
        }, 800);
        return () => clearTimeout(t);
    }, []);

    // Poll only while there is at least one record transcribing or uploading; stop when all done
    useEffect(() => {
        const hasTranscribing = recordings.some((r) => r.status === 'transcribing');
        const hasUploading = uploadingSessions.length > 0;
        if (!hasTranscribing && !hasUploading) return;
        const interval = setInterval(() => loadDashboardDataRef.current(true, false, currentLimit), 5000);
        return () => clearInterval(interval);
    }, [recordings, uploadingSessions.length, currentLimit]);

    const mappedUploading: Recording[] = useMemo(() => {
        return uploadingSessions.map(session => {
            const meta = session as { output_format?: string; output_type?: string; format?: string };
            return {
                id: session.upload_id,
                title: session.filename || session.display_name || 'Bản ghi không tên',
                patient: undefined,
                format: mapFormat(meta.output_format ?? (meta as { output_type?: string }).output_type ?? (meta as { format?: string }).format),
                duration: '...',
                date: new Date(session.created_at).toLocaleDateString(),
                status: 'uploading'
            };
        });
    }, [uploadingSessions, mapFormat]);

    // Hide "uploading" row when we already have a record from API with same title (avoid duplicate after save+redirect)
    const uploadingToShow = useMemo(() => {
        return mappedUploading.filter(
            (u) => !recordings.some((r) => (r.title || '').trim() === (u.title || '').trim())
        );
    }, [mappedUploading, recordings]);

    const allRecordings = useMemo(() => [...uploadingToShow, ...recordings], [uploadingToShow, recordings]);

    const filteredRecordings = allRecordings.filter(rec => {
        if (filter === null) return true;
        if (filter === 'None') return !rec.format;
        return rec.format === filter;
    });

    const unassignedRecordings = useMemo(
        () => filteredRecordings.filter((rec) => !(rec.patient || '').trim()),
        [filteredRecordings]
    );

    const visiblePatientFolders = useMemo(
        () => patientFolders.filter((f) => (!f.is_virtual || f.record_count > 0) && !isUnknownFolder(f)),
        [patientFolders]
    );

    const headerTitle = useMemo(() => {
        if (filter === 'Ghi chú SOAP') return r('soapNote');
        if (filter === 'Tóm tắt lâm sàng') return r('ehrSummary');
        if (filter === 'Việc cần làm') return r('todoList');
        if (filter === 'Văn bản tự do') return r('raw');
        if (filter === 'Chưa phân loại') return r('unclassified');
        return '';
    }, [filter, r]);

    const isFilterView = Boolean(headerTitle);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleCreateFolder = async () => {
        const name = prompt('Nhập tên bệnh nhân mới:');
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        setCreatingFolder(true);
        try {
            await createMyPatientFolder(trimmed);
            await loadPatientFolders();
            router.push(`/patients/${encodeURIComponent(trimmed)}`);
        } catch {
            alert('Không thể tạo bệnh nhân mới lúc này. Vui lòng thử lại sau.');
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleDeleteRecord = async (e: React.MouseEvent, rec: Recording) => {
        e.stopPropagation();
        if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
        setDeletingId(rec.id);
        try {
            if (rec.status === 'uploading') {
                await abandonUpload(rec.id).catch(() => {});
                await db.transaction('rw', db.uploads, db.chunks, async () => {
                    await db.uploads.where({ upload_id: rec.id }).delete();
                    await db.chunks.where({ upload_id: rec.id }).delete();
                });
            } else {
                await deleteRecord(rec.id);
                setRecordings(prev => prev.filter(r => r.id !== rec.id));
                setTotalRecordsFromApi(Math.max(0, totalRecordsFromApi - 1));
            }
        } catch (err) {
            console.error('Lỗi khi xóa bản ghi:', err);
            alert('Không thể xóa bản ghi lúc này. Vui lòng thử lại sau.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen pb-30 fade-in">
            <div className="h-12 px-4 flex items-center justify-between">
                <button
                    onClick={openSidebar}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 text-text-primary"
                    aria-label="Open menu"
                >
                    <div className="relative">
                        <Menu className="w-6 h-6" />
                        {showNotificationDot && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger border-2 border-bg-page rounded-full" />
                        )}
                    </div>
                </button>

                <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-5.5 h-5.5 text-accent-blue" />
                    {isFilterView ? (
                        <span className="text-[18px] font-bold leading-none text-text-primary">{headerTitle}</span>
                    ) : (
                        <span className="text-[18px] font-bold leading-none"><span className="text-accent-blue">Med</span><span className="text-accent-orange">Mate</span></span>
                    )}
                </div>

                <button
                    onClick={handleSearchClick}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 text-text-primary"
                    aria-label="Search"
                >
                    <Search className="w-5 h-5" />
                </button>
            </div>

            {isRecoveringUploads && (
                <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-accent-blue/10 border border-accent-blue/30 px-4 py-2.5 text-[13px] font-medium text-accent-blue">
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                    <span>Đang khôi phục bản ghi chưa tải xong...</span>
                </div>
            )}

            {/* ── Recording List ── */}
            <div className="px-4 flex flex-col gap-2.5">
                <h2 className="text-[13px] font-semibold text-text-muted px-1">{t('patients')}</h2>

                <button
                    type="button"
                    onClick={handleCreateFolder}
                    disabled={creatingFolder}
                    className="w-full rounded-2xl border border-dashed border-border bg-bg-card p-4 text-left hover:bg-bg-surface transition-colors disabled:opacity-70"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-accent-blue/10 flex items-center justify-center">
                            {creatingFolder ? <Loader2 className="w-5 h-5 text-accent-blue animate-spin" /> : <FolderOpen className="w-5 h-5 text-accent-blue" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-text-primary">{t('noPatientsTitle')}</p>
                            <p className="text-[12px] text-text-muted mt-0.5">{t('noPatientsHint')}</p>
                        </div>
                        <ChevronRight className="w-4.5 h-4.5 text-text-muted" />
                    </div>
                </button>

                {visiblePatientFolders.map((folder) => (
                    <button
                        key={folder.id || folder.name}
                        type="button"
                        onClick={() => router.push(`/patients/${encodeURIComponent(folder.name)}`)}
                        className="w-full rounded-2xl p-4 text-left border border-transparent bg-bg-card hover:border-border hover:bg-bg-surface transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-accent-blue/10 flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-accent-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-semibold text-text-primary truncate">{folder.name}</p>
                                <p className="text-[12px] text-text-muted mt-0.5">{t('patientRecordsCount', { count: folder.record_count })}</p>
                            </div>
                            <ChevronRight className="w-4.5 h-4.5 text-text-muted" />
                        </div>
                    </button>
                ))}

                <h2 className="text-[13px] font-semibold text-text-muted mb-1 px-1">
                    {t('unassigned')}
                    {!isLoading && totalRecordsFromApi >= 0 && (
                        <span className="ml-1 font-normal">(tổng {totalRecordsFromApi} bản ghi)</span>
                    )}
                </h2>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-text-muted">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Đang tải bản ghi...</span>
                    </div>
                ) : unassignedRecordings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-surface rounded-2xl border border-dashed border-divider mt-2">
                        <Stethoscope className="w-10 h-10 text-divider mb-3" />
                        <p className="text-sm font-semibold text-text-muted">Chưa có bản ghi chưa gán bệnh nhân</p>
                        <p className="text-xs text-text-tertiary mt-1">Các bản ghi chưa chọn bệnh nhân sẽ hiển thị ở đây</p>
                    </div>
                ) : (
                    unassignedRecordings.map(rec => (
                        <Card
                            key={rec.id}
                            className={cn(
                                "transition-colors",
                                rec.status === 'uploading' 
                                    ? "opacity-80" 
                                    : "cursor-pointer hover:border-border hover:bg-bg-surface"
                            )}
                            onClick={() => {
                                if (rec.status === 'uploading') return;
                                const startTab = recordLabelToReviewRoute(rec.format ?? undefined);
                                router.push(`/${startTab}?id=${rec.id}`);
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <h3 className="text-[15px] font-bold text-text-primary leading-tight">{rec.title}</h3>
                                    <p className="text-[12px] text-text-muted mt-1">
                                        {rec.format ?? 'None'} &middot; {rec.duration} &middot; {rec.date}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        rec.status === 'transcribed' ? 'success' :
                                            (rec.status === 'transcribing' || rec.status === 'uploading') ? 'progress' :
                                                rec.status === 'error' ? 'error' : 'warn'
                                    }>
                                        {b(rec.status)}
                                    </Badge>
                                    {(rec.status === 'error' || rec.status === 'uploading') && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteRecord(e, rec)}
                                            disabled={deletingId === rec.id}
                                            className="p-1.5 text-text-muted hover:text-danger rounded-full hover:bg-danger/10 transition-colors disabled:opacity-50"
                                            title="Xóa bản ghi bị kẹt/lỗi"
                                        >
                                            {deletingId === rec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}

                {/* Nút Load More */}
                {!isLoading && recordings.length > 0 && recordings.length < totalRecordsFromApi && (
                    <div className="flex justify-center mt-2 mb-6">
                        <button
                            onClick={() => {
                                const nextLimit = currentLimit + 50;
                                setCurrentLimit(nextLimit);
                                setIsLoadingMore(true);
                                loadDashboardData(true, true, nextLimit);
                            }}
                            disabled={isLoadingMore}
                            className="px-6 py-2.5 rounded-full bg-bg-surface text-[14px] font-medium text-text-primary hover:bg-divider transition-colors active:scale-95 border border-border shadow-sm flex items-center justify-center gap-2"
                        >
                            {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoadingMore ? "Đang tải..." : "Tải thêm bản ghi"}
                        </button>
                    </div>
                )}
            </div>


            {/* Development Notice Popup */}
            {showDevNotice && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-100 bg-[#1a1a1a]/90 dark:bg-white/80 text-white dark:text-[#1a1a1a] px-5 py-2.5 rounded-full text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {t('devMode')}
                </div>
            )}
        </div>
    );
}
