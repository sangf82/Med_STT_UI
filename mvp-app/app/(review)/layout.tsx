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

    const record = useMemo(() => {
        return recordings.find(r => r.id === recordId) || recordings[0];
    }, [recordings, recordId]);

    const [menuOpen, setMenuOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [recordingName, setRecordingName] = useState(record?.title || 'Patient Consultation');
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (record) {
            setRecordingName(record.title);
        }
    }, [record]);

    // For MVP, we simulated reading the format from the record logic
    const format = record?.format || 'None';

    const allTabs = [
        { id: 'soap', label: t('soapNote') },
        { id: 'ehr', label: t('ehrSummary') },
        { id: 'freetext', label: t('raw') }
    ];

    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (tab.id === 'freetext') return true;
            if (format === 'SOAP Note' && tab.id === 'soap') return true;
            if (format === 'Clinical Summary' && tab.id === 'ehr') return true;
            return false;
        });
    }, [format, t]);

    const activeTab = useMemo(() => {
        if (pathname.includes('/freetext')) return 'freetext';
        if (format === 'SOAP Note') return 'soap';
        if (format === 'Clinical Summary') return 'ehr';
        return 'freetext';
    }, [pathname, format]);

    const handleTabChange = (id: string) => {
        router.push(`/${id}${recordId ? `?id=${recordId}` : ''}`);
    };

    const handleCopy = () => {
        const text = document.querySelector('textarea')?.value;
        if (text) {
            navigator.clipboard.writeText(text);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };



    const handleRenameConfirm = () => {
        setRenameOpen(false);
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
        <div className="relative min-h-screen bg-bg-page text-text-primary max-w-md mx-auto w-full shadow-lg flex flex-col fade-in">
            <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
                <ReviewContext.Provider value={{ setSaveStatus, record }}>

                    {/* Header is dynamic based on edit mode */}
                    {!isEditMode ? (
                        <header className="sticky top-0 z-40 flex items-center justify-between h-[48px] px-4 w-full bg-bg-page text-text-primary">
                            <div className="flex items-center gap-1 min-w-0">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-10 h-10 -ml-2 shrink-0 rounded-full flex items-center justify-center hover:bg-bg-surface active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2"
                                    aria-label="Back"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[16px] font-semibold leading-tight truncate">{recordingName}</span>
                                    <span className="text-[11px] font-medium text-text-muted shrink-0">{record?.format || 'None'} &middot; {record?.duration} &middot; {record?.date}</span>
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
                        <div className="flex items-center w-full bg-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.03)] z-20 sticky top-[48px]">
                            <div className="flex-1">
                                <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
                            </div>
                            <button
                                onClick={handleCopy}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all mr-2 text-[#FB8A0A]"
                                aria-label="Copy"
                            >
                                <Copy className="w-[18px] h-[18px]" />
                            </button>
                        </div>
                    )}

                    {/* Dynamic Content */}
                    <div className="flex-1 relative z-0 flex flex-col min-h-0">
                        {record?.status === 'transcribing' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-accent-blue/20"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-accent-blue border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-[16px] font-medium text-text-primary mb-2">
                                    {t('transcribingDetail')}
                                </p>
                                <p className="text-[14px] text-text-secondary max-w-[240px]">
                                    {record.progress}% completed
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
                                <div className="w-[1px] h-4 bg-border" />
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
                                <div className="w-[1px] h-4 bg-border" />
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
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a]/90 dark:bg-white/90 text-white dark:text-[#1a1a1a] px-4 py-2 rounded-full text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {t('copySuccess')}
                        </div>
                    )}
                </ReviewContext.Provider>
            </Suspense>
        </div>
    );
}
