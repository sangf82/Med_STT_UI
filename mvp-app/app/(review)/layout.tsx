'use client';

import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { BottomBar } from '@/components/BottomBar';
import { Badge } from '@/components/Badge';
import { MenuPopup } from '@/components/MenuPopup';
import { Share2, Download, Copy, MoreVertical } from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function ReviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('Review');
    const d = useTranslations('Badge');
    const router = useRouter();
    const pathname = usePathname();

    const [menuOpen, setMenuOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [recordingName, setRecordingName] = useState('Patient Consultation');

    // Two-tab system: structured format | Raw
    const tabs = [
        { id: 'soap', label: t('soapNote') },
        { id: 'freetext', label: t('raw') }
    ];

    const activeTab = pathname.includes('/freetext') ? 'freetext' : 'soap';

    const handleTabChange = (id: string) => {
        router.push(`/${id}`);
    };

    const bottomItems = [
        { icon: Share2, label: t('share'), onClick: () => { } },
        { icon: Download, label: t('export'), onClick: () => { } },
        { icon: Copy, label: t('copy'), onClick: () => { } }
    ];

    const handleRenameConfirm = () => {
        setRenameOpen(false);
    };

    const isEditMode = pathname.includes('/edit');

    return (
        <div className="relative min-h-screen bg-bg-page text-text-primary max-w-md mx-auto w-full shadow-lg flex flex-col fade-in">
            <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>

                {/* Header is dynamic based on edit mode */}
                {!isEditMode ? (
                    <Header
                        onBack={() => router.push('/dashboard')}
                        centerNode={
                            <div className="flex flex-col items-center">
                                <span className="text-[16px] font-bold line-clamp-1">{recordingName}</span>
                                <span className="text-[11px] font-medium text-text-muted">Dec 15, 2024 · 02:34</span>
                            </div>
                        }
                        rightNode={
                            <div className="flex items-center gap-1">
                                <Badge variant="success" className="mr-1">{d('saved')}</Badge>
                                <button
                                    onClick={() => setMenuOpen(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all outline-none"
                                >
                                    <MoreVertical className="w-6 h-6 text-text-primary" />
                                </button>
                            </div>
                        }
                    />
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

                {/* Tabs with copy icon (Hidden in Edit mode) */}
                {!isEditMode && (
                    <div className="flex items-center w-full bg-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.03)] z-20 sticky top-[56px]">
                        <div className="flex-1">
                            <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
                        </div>
                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all mr-2 text-text-secondary"
                            aria-label="Copy"
                        >
                            <Copy className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                )}

                {/* Dynamic Content */}
                <div className="flex-1 overflow-y-auto pb-[90px] relative z-0">
                    {children}
                </div>

                {/* Bottom Bar (Hidden in Edit mode) */}
                {!isEditMode && (
                    <BottomBar items={bottomItems} />
                )}

                {/* Menu Popup (D4) */}
                <MenuPopup
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    onRename={() => setRenameOpen(true)}
                    onDelete={() => {}}
                />

                {/* Rename Dialog (D5) */}
                <Dialog
                    open={renameOpen}
                    onOpenChange={setRenameOpen}
                    title={t('renameRecording')}
                >
                    <div className="flex flex-col gap-5 mt-2">
                        <Input
                            value={recordingName}
                            onChange={(e) => setRecordingName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => setRenameOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button className="flex-1" onClick={handleRenameConfirm}>
                                {t('rename')}
                            </Button>
                        </div>
                    </div>
                </Dialog>

            </Suspense>
        </div>
    );
}
