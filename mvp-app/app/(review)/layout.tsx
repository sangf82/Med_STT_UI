'use client';

import { Suspense, useState, createContext, useContext, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { BottomBar } from '@/components/BottomBar';
import { Badge } from '@/components/Badge';
import { MenuPopup } from '@/components/MenuPopup';
import { Copy, MoreVertical, ChevronLeft, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAppContext } from '@/context/AppContext';
import { getRecordById, updateRecord } from '@/lib/api/sttMetrics';
import type { SttRecord } from '@/lib/api/sttMetrics';


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

    // When viewing a processing record, poll until it completes so we can show result
    useEffect(() => {
        if (!recordId || !recordData || (recordData.status !== 'processing' && recordData.status !== 'pending')) return;
        const t = setInterval(() => {
            getRecordById(recordId)
                .then(data => {
                    setRecordData(data);
                    setRecordingName(data.display_name || 'Bản ghi không tên');
                })
                .catch(() => {});
        }, 3000);
        return () => clearInterval(t);
    }, [recordId, recordData?.status]);

    // Map backend format_type to localized string for Tab logic
    const format = useMemo(() => {
        if (!recordData) return 'None';
        const type = recordData.format_type || recordData.output_type;
        switch (type) {
            case 'soap_note': return 'Ghi chú SOAP';
            case 'ehr': return 'Tóm tắt lâm sàng';
            case 'todo-list': return 'Việc cần làm';
            default: return 'Chưa phân loại';
        }
    }, [recordData]);

    const record = useMemo(() => {
        if (!recordData) return null;
        return {
            id: recordData.id,
            title: recordData.display_name || 'Bản ghi',
            format,
            duration: recordData.elapsed_time ? `${Math.floor(recordData.elapsed_time)}s` : 'Unknown',
            date: new Date(recordData.created_at).toLocaleDateString(),
            status: recordData.status === 'completed' ? 'transcribed' : recordData.status === 'failed' ? 'error' : 'transcribing',
            content: recordData.content,
            refined_text: recordData.refined_text,
            raw_text: recordData.raw_text
        };
    }, [recordData, format]);



    const allTabs = [
        { id: 'soap', label: t('soapNote') },
        { id: 'ehr', label: t('ehrSummary') },
        { id: 'todo', label: t('todoList') },
        { id: 'freetext', label: t('raw') }
    ];

    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (tab.id === 'freetext') return true;
            if (format === 'Ghi chú SOAP' && tab.id === 'soap') return true;
            if (format === 'Tóm tắt lâm sàng' && tab.id === 'ehr') return true;
            if (format === 'Việc cần làm' && tab.id === 'todo') return true;
            return false;
        });
    }, [format, t]);

    const activeTab = useMemo(() => {
        if (pathname.includes('/freetext')) return 'freetext';
        if (pathname.includes('/ehr')) return 'ehr';
        if (pathname.includes('/soap')) return 'soap';
        if (pathname.includes('/todo')) return 'todo';
        return 'freetext';
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

        if (isSoapInvalid || isEhrInvalid || isTodoInvalid) {
            const startTab = format === 'Tóm tắt lâm sàng' ? 'ehr' : (format === 'Ghi chú SOAP' ? 'soap' : (format === 'Việc cần làm' ? 'todo' : 'freetext'));
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
            const currentContent = recordData?.content || recordData?.refined_text || recordData?.raw_text || "";
            
            await updateRecord(recordId, { 
                display_name: recordingName,
                content: currentContent
            });
            
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
                    <Loader className="w-[12px] h-[12px] animate-spin" />
                    <span>{d('saving')}</span>
                </Badge>
            );
        }
        return <Badge variant="success" className="mr-1">{d('saved')}</Badge>;
    };

    return (
        <div className="relative min-h-screen bg-bg-page text-text-primary max-w-md mx-auto w-full shadow-lg flex flex-col fade-in pt-[5px] overflow-x-hidden">
            <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
                <ReviewContext.Provider value={{ setSaveStatus, record }}>

                    {/* Header is dynamic based on edit mode */}
                    {!isEditMode ? (
                        <header className="sticky top-0 z-40 flex items-center justify-between min-h-[64px] pt-4 px-4 w-full bg-bg-page text-text-primary tracking-tight">
                            <div className="flex items-center gap-1 min-w-0">
                                <button
                                    onClick={() => router.push('/dashboard')}
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
                                    onClick={() => setMenuOpen(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all outline-none"
                                >
                                    <MoreVertical className="w-6 h-6 text-text-primary" />
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
                        <div className="flex items-center w-full bg-bg-card dark:bg-bg-page shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none z-20 sticky top-[64px] h-[48px] transition-all">
                            <div className="flex-1 flex items-center h-full">
                                <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
                            </div>
                            <div className="flex items-center justify-center p-1 mr-1">
                                <button
                                    onClick={handleCopy}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all text-brand-orange"
                                    aria-label="Copy"
                                >
                                    <Copy className="w-[18px] h-[18px]" />
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
                        ) : record?.status === 'transcribing' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-accent-blue/20"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-accent-blue border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-[16px] font-medium text-text-primary mb-2">
                                    {t('transcribingDetail')}
                                </p>
                            </div>
                        ) : record?.status === 'error' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                                    <AlertCircle className="w-8 h-8 text-danger" />
                                </div>
                                <h3 className="text-[18px] font-bold text-text-primary mb-2">
                                    {t('errorDetail')}
                                </h3>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 flex items-center gap-2 bg-accent-blue text-white px-6 py-2.5 rounded-full text-[14px] font-semibold shadow-md active:scale-95 transition-transform"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('retry')}
                                </button>
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
                                    onClick={() => {
                                        setDeleteOpen(false);
                                        router.push('/dashboard');
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
