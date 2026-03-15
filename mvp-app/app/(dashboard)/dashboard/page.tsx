'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Menu, Search, Stethoscope, Loader2, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useSidebar } from '@/context/SidebarContext';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { useRouter } from 'next/navigation';
import { cn, formatDurationSec } from '@/lib/utils';
import { getMyRecords, getMyUsage, deleteRecord, abandonUpload } from '@/lib/api/sttMetrics';
import type { Recording } from '@/lib/mockData';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, clearStaleUploadSessions } from '@/lib/db';


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
    const rawUploading = useLiveQuery(() => db.uploads.toArray());
    const uploadingSessions = useMemo(() => rawUploading || [], [rawUploading]);

    const handleSearchClick = () => {
        setShowDevNotice(true);
        setTimeout(() => setShowDevNotice(false), 2000);
    };

    const mapFormat = useCallback((ft?: string) => {
        const v = (ft ?? '').trim().toLowerCase().replace(/\s/g, '_');
        if (v === 'soap_note' || v === 'soap') return 'Ghi chú SOAP';
        if (v === 'ehr') return 'Tóm tắt lâm sàng';
        if (v === 'to-do' || v === 'todo') return 'Việc cần làm';
        if (v === 'freetext' || v === 'free' || v === 'raw') return 'Văn bản tự do';
        return 'Chưa phân loại';
    }, []);

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
                        patient: undefined,
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
                    patient: undefined,
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
        }
    }, [mapFormat, setRecordings, setShowNotificationDot, setTotalRecordsFromApi, setTotalByFormat]);

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
            navigator.mediaDevices.getUserMedia({ audio: true })
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

    const headerTitle = useMemo(() => {
        if (filter === 'Ghi chú SOAP') return r('soapNote');
        if (filter === 'Tóm tắt lâm sàng') return r('ehrSummary');
        if (filter === 'Việc cần làm') return r('todoList');
        if (filter === 'Văn bản tự do') return r('raw');
        if (filter === 'Chưa phân loại') return r('unclassified');
        return '';
    }, [filter, r]);

    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            requestAnimationFrame(() => setScrollY(window.scrollY));
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const progress = Math.min(Math.max(scrollY / 132, 0), 1);
    const headerHeight = Math.max(48, 180 - scrollY);
    const isScrolled = scrollY > 40;

    const [deletingId, setDeletingId] = useState<string | null>(null);

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
                setTotalRecordsFromApi((prev: number) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Lỗi khi xóa bản ghi:', err);
            alert('Không thể xóa bản ghi lúc này. Vui lòng thử lại sau.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen pb-[120px] fade-in">
            {/* ── Fixed Animated Header ── */}
            <div
                className="fixed top-0 left-0 right-0 z-40 bg-bg-page overflow-hidden"
                style={{ height: `${headerHeight}px` }}
            >
                <div className="max-w-md mx-auto w-full h-full relative">

                    {/* Hamburger Menu */}
                    <button
                        onClick={openSidebar}
                        className="absolute left-3 w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 text-text-primary"
                        style={{ bottom: `${12 - progress * 8}px` }}
                        aria-label="Open menu"
                    >
                        <div className="relative">
                            <Menu className="w-6 h-6" />
                            {showNotificationDot && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger border-2 border-bg-page rounded-full" />
                            )}
                        </div>
                    </button>

                    {/* Search Icon */}
                    <button
                        onClick={handleSearchClick}
                        className="absolute right-3 w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 text-text-primary"
                        style={{ bottom: `${12 - progress * 8}px` }}
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Collapsed Header Small Logo (Fades in) */}
                    <div
                        className="absolute left-[52px] flex items-center gap-[6px] pointer-events-none"
                        style={{
                            top: '12px',
                            opacity: progress,
                            transform: `translateY(${10 - (progress * 10)}px)`
                        }}
                    >
                        <Stethoscope className="w-[22px] h-[22px] text-accent-blue" />
                        {headerTitle ? (
                            <span className="text-[18px] font-bold text-text-primary leading-none pt-[2px]">{headerTitle}</span>
                        ) : (
                            <span className="text-[18px] font-bold leading-none pt-[2px]"><span className="text-accent-blue">Med</span><span className="text-accent-orange">Mate</span></span>
                        )}
                    </div>

                    {/* Expanded Hero Big Logo (Fades out) */}
                    <div
                        className="absolute w-full flex flex-col items-center justify-center text-center px-5 pointer-events-none"
                        style={{
                            top: '32px',
                            opacity: 1 - Math.min(progress * 1.5, 1),
                            transform: `translateY(${-progress * 20}px) scale(${1 - progress * 0.1})`
                        }}
                    >
                        <Stethoscope className="w-[48px] h-[48px] text-accent-blue mb-2" />
                        {headerTitle ? (
                            <h1 className="text-[28px] font-bold leading-tight text-text-primary">{headerTitle}</h1>
                        ) : (
                            <>
                                <h1 className="text-[28px] font-bold leading-tight"><span className="text-accent-blue">Med</span><span className="text-accent-orange">Mate</span></h1>
                                <p className="text-[14px] text-text-muted mt-[2px]">{a('subtitle')}</p>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* Placeholder to preserve space and prevent jump */}
            <div className="h-[180px] shrink-0 w-full" />

            {isRecoveringUploads && (
                <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-accent-blue/10 border border-accent-blue/30 px-4 py-2.5 text-[13px] font-medium text-accent-blue">
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                    <span>Đang khôi phục bản ghi chưa tải xong...</span>
                </div>
            )}

            {/* ── Recording List ── */}
            <div className="px-4 flex flex-col gap-[10px]">
                <h2 className={cn(
                    "text-[13px] font-semibold text-text-muted mb-1 px-1 transition-all duration-300",
                    isScrolled ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
                )}>
                    {t('myRecordings')}
                    {!isLoading && totalRecordsFromApi >= 0 && (
                        <span className="ml-1 font-normal">(tổng {totalRecordsFromApi} bản ghi)</span>
                    )}
                </h2>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-text-muted">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Đang tải bản ghi...</span>
                    </div>
                ) : filteredRecordings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-surface rounded-2xl border border-dashed border-divider mt-2">
                        <Stethoscope className="w-10 h-10 text-divider mb-3" />
                        <p className="text-sm font-semibold text-text-muted">Chưa có bản ghi nào</p>
                        <p className="text-xs text-text-tertiary mt-1">Bấm nút + để tạo bản ghi mới</p>
                    </div>
                ) : (
                    filteredRecordings.map(rec => (
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
                                const startTab = 
                                    rec.format === 'Tóm tắt lâm sàng' ? 'ehr' : 
                                    rec.format === 'Ghi chú SOAP' ? 'soap' : 
                                    rec.format === 'Việc cần làm' ? 'todo' : 
                                    'soap';
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
