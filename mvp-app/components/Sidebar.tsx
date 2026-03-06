'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Shield, AudioLines, Settings, FileText, ClipboardList, FileCode, Star, MessageSquareQuote, Users2, ListTodo } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import { useAppContext } from "@/context/AppContext"
import { Dialog } from "@/components/Dialog"

export interface SidebarProps {
    open: boolean;
    onClose: () => void;
    profile: {
        initials: string;
        name: string;
        subtitle: string;
    };
}

export function Sidebar({ open, onClose, profile }: SidebarProps) {
    const router = useRouter()
    const t = useTranslations('Dashboard')
    const r = useTranslations('Review')
    const s = useTranslations('Survey')
    const { recordings, filter, setFilter, showTrialPanel, setShowTrialPanel } = useAppContext()

    // Block scroll on body
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex fade-in pointer-events-auto">
            <div
                className="absolute inset-0 bg-bg-overlay"
                onClick={onClose}
                aria-label="Close sidebar"
            />

            <div className="relative w-[300px] h-full bg-bg-sidebar flex flex-col slide-in-left shadow-2xl">
                {/* Profile Header */}
                <div className="bg-accent-blue pt-[48px] px-[24px] pb-[20px] text-white relative flex flex-col gap-3">
                    <div className="w-[52px] h-[52px] rounded-full bg-white text-accent-blue flex items-center justify-center font-bold text-[18px]">
                        {profile.initials}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[17px] font-bold">{profile.name}</h2>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-0 px-3 mt-1">
                    {/* All Records */}
                    <button
                        onClick={() => { setFilter(null); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === null ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <AudioLines className={cn("w-[18px] h-[18px]", filter === null ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-semibold", filter === null ? "text-accent-orange" : "text-text-primary")}>{t('allRecords')}</span>
                        </div>
                        <span className={cn("text-[12px] font-bold", filter === null ? "text-accent-orange/60" : "text-text-muted")}>{recordings.length}</span>
                    </button>

                    {/* Filter: Ghi chú SOAP */}
                    <button
                        onClick={() => { setFilter('Ghi chú SOAP'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'Ghi chú SOAP' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <FileText className={cn("w-[18px] h-[18px]", filter === 'Ghi chú SOAP' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'Ghi chú SOAP' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('soapNote')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'Ghi chú SOAP' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => rec.format === 'Ghi chú SOAP').length}
                        </span>
                    </button>

                    {/* Filter: Tóm tắt lâm sàng */}
                    <button
                        onClick={() => { setFilter('Tóm tắt lâm sàng'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'Tóm tắt lâm sàng' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <ClipboardList className={cn("w-[18px] h-[18px]", filter === 'Tóm tắt lâm sàng' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'Tóm tắt lâm sàng' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('ehrSummary')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'Tóm tắt lâm sàng' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => rec.format === 'Tóm tắt lâm sàng').length}
                        </span>
                    </button>

                    {/* Filter: Việc cần làm */}
                    <button
                        onClick={() => { setFilter('Việc cần làm'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'Việc cần làm' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <ListTodo className={cn("w-[18px] h-[18px]", filter === 'Việc cần làm' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'Việc cần làm' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('todoList')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'Việc cần làm' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => rec.format === 'Việc cần làm').length}
                        </span>
                    </button>

                    {/* Filter: Chưa phân loại */}
                    <button
                        onClick={() => { setFilter('Chưa phân loại'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'Chưa phân loại' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <FileCode className={cn("w-[18px] h-[18px]", filter === 'Chưa phân loại' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'Chưa phân loại' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('raw')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'Chưa phân loại' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => rec.format === 'Chưa phân loại' || !rec.format).length}
                        </span>
                    </button>

                    <div className="my-1 border-t border-divider/50 mx-4" />

                    {/* Settings */}
                    <button
                        onClick={() => { router.push('/settings'); onClose() }}
                        className="flex items-center gap-3.5 px-4 h-[44px] w-full text-left rounded-xl hover:bg-bg-surface transition-colors focus-visible:outline-none shrink-0"
                    >
                        <Settings className="w-[18px] h-[18px] text-text-secondary" />
                        <span className="text-[14px] font-medium text-text-primary">{t('settings')}</span>
                    </button>

                    {showTrialPanel && recordings.length >= 5 && (
                        <div className="mt-auto pt-4 mb-1 px-1">
                            <SidebarSurvey t={s} onAction={onClose} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-divider">
                    <div className="flex items-center gap-2 text-text-muted">
                        <Shield className="w-4 h-4 text-accent-blue" />
                        <span className="text-[11px] font-semibold">HIPAA Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SidebarSurvey({ t, onAction }: { t: any; onAction: () => void }) {
    const { setShowSurvey, setShowTrialPanel, setShowNotificationDot } = useAppContext();

    return (
        <div
            className="bg-white dark:bg-bg-surface rounded-[20px] p-[16px] w-full flex flex-col gap-4 border border-[#EEEEEE] dark:border-divider/50 shadow-sm mb-4"
        >
            <div className="flex items-start gap-3">
                {/* Icon box */}
                <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-accent-orange/10 dark:bg-accent-orange/20 text-accent-orange">
                    <MessageSquareQuote className="w-4.5 h-4.5" />
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-bold text-[#1A1A1A] dark:text-text-primary leading-tight">
                        {t('limit')}
                    </p>
                    <p className="text-[12px] font-medium text-[#666666] dark:text-text-muted leading-snug">
                        {t('limitSub')}
                    </p>
                </div>
            </div>

            <div className="flex border-t border-[#F0F0F0] dark:border-divider/30 -mx-4 -mb-4 h-[44px]">
                <button
                    onClick={() => {
                        onAction(); // Close sidebar
                        setTimeout(() => setShowSurvey(true), 300); // Popup survey
                    }}
                    className="flex-1 text-[14px] font-bold text-accent-blue active:bg-bg-page dark:active:bg-bg-overlay transition-colors"
                >
                    {t('yes')}
                </button>
                <div className="w-[1px] h-4 bg-[#E0E0E0] dark:bg-divider/40 self-center" />
                <button
                    onClick={() => {
                        setShowTrialPanel(false);
                        setShowNotificationDot(false);
                        onAction();
                    }}
                    className="flex-1 text-[14px] font-bold text-[#888888] dark:text-text-muted active:bg-bg-page dark:active:bg-bg-overlay transition-colors"
                >
                    {t('no')}
                </button>
            </div>
        </div>
    );
}

interface SurveyButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    variant: 'orange' | 'blue' | 'muted';
}

function SurveyButton({ active, onClick, label, variant }: SurveyButtonProps) {
    const variantClasses = {
        orange: active ? "bg-accent-orange text-white shadow-sm shadow-accent-orange/20" : "bg-bg-page hover:text-accent-orange",
        blue: active ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/20" : "bg-bg-page hover:text-accent-blue",
        muted: active ? "bg-text-muted text-white shadow-sm" : "bg-bg-page hover:text-text-primary"
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95 border border-transparent",
                variantClasses[variant],
                !active && "border-border/10"
            )}
        >
            {label}
        </button>
    )
}