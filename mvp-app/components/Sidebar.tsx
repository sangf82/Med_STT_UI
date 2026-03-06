'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Shield, AudioLines, Settings, FileText, ClipboardList, FileCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import { useAppContext } from "@/context/AppContext"

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
    const { recordings, filter, setFilter } = useAppContext()

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
                        <p className="text-[12px] text-white/80">{profile.subtitle}</p>
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

                    {/* Filter: SOAP Note */}
                    <button
                        onClick={() => { setFilter('SOAP Note'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'SOAP Note' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <FileText className={cn("w-[18px] h-[18px]", filter === 'SOAP Note' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'SOAP Note' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('soapNote')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'SOAP Note' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => rec.format === 'SOAP Note').length}
                        </span>
                    </button>

                    {/* Filter: Clinical Summary */}
                    <button
                        onClick={() => { setFilter('Clinical Summary'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'Clinical Summary' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <ClipboardList className={cn("w-[18px] h-[18px]", filter === 'Clinical Summary' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'Clinical Summary' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('ehrSummary')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'Clinical Summary' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => rec.format === 'Clinical Summary').length}
                        </span>
                    </button>

                    {/* Filter: Original Text */}
                    <button
                        onClick={() => { setFilter('None'); router.push('/dashboard'); onClose() }}
                        className={cn(
                            "flex items-center justify-between px-4 h-[44px] w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                            filter === 'None' ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <FileCode className={cn("w-[18px] h-[18px]", filter === 'None' ? "text-accent-orange" : "text-text-secondary")} />
                            <span className={cn("text-[14px] font-medium", filter === 'None' ? "text-accent-orange font-semibold" : "text-text-primary")}>{r('raw')}</span>
                        </div>
                        <span className={cn("text-[12px] font-semibold", filter === 'None' ? "text-accent-orange/60 font-bold" : "text-text-muted")}>
                            {recordings.filter(rec => !rec.format).length}
                        </span>
                    </button>

                    <div className="h-2 my-1 border-t border-divider/50 mx-4" />

                    {/* Settings */}
                    <button
                        onClick={() => { router.push('/settings'); onClose() }}
                        className="flex items-center gap-3.5 px-4 h-[44px] w-full text-left rounded-xl hover:bg-bg-surface transition-colors focus-visible:outline-none shrink-0"
                    >
                        <Settings className="w-[18px] h-[18px] text-text-secondary" />
                        <span className="text-[14px] font-medium text-text-primary">{t('settings')}</span>
                    </button>
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