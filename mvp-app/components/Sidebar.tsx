'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Shield, AudioLines, Wand2, Globe, Settings } from 'lucide-react'
import { Toggle } from "./Toggle"
import { useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import LocaleSwitcher from './LocaleSwitcher'

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

    const [autoTranscribe, setAutoTranscribe] = React.useState(true)

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
        <div className="fixed inset-0 z-50 flex fade-in pointer-events-auto">
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
                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3 mt-1">
                    {/* All Records */}
                    <button
                        onClick={() => { router.push('/dashboard'); onClose() }}
                        className="flex items-center gap-3.5 px-4 h-[50px] w-full text-left bg-accent-orange/15 hover:bg-accent-orange/20 rounded-xl transition-colors focus-visible:outline-none shrink-0"
                    >
                        <AudioLines className="w-[20px] h-[20px] text-accent-orange" />
                        <span className="text-[15px] font-semibold text-accent-orange">{t('allRecords')}</span>
                    </button>

                    {/* Auto-transcribe */}
                    <div
                        className="flex items-center justify-between px-4 h-[50px] w-full rounded-xl hover:bg-bg-surface transition-colors shrink-0 cursor-pointer"
                        onClick={() => setAutoTranscribe(!autoTranscribe)}
                    >
                        <div className="flex items-center gap-3.5">
                            <Wand2 className="w-[20px] h-[20px] text-text-secondary" />
                            <span className="text-[15px] font-medium text-text-primary">{t('autoTranscribe')}</span>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                            <Toggle checked={autoTranscribe} onCheckedChange={setAutoTranscribe} />
                        </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between px-4 h-[50px] w-full rounded-xl hover:bg-bg-surface transition-colors shrink-0">
                        <div className="flex items-center gap-3.5">
                            <Globe className="w-[20px] h-[20px] text-text-secondary" />
                            <span className="text-[15px] font-medium text-text-primary">{t('language')}</span>
                        </div>
                        <div className="relative">
                            <LocaleSwitcher variant="filled" />
                        </div>
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => { router.push('/settings'); onClose() }}
                        className="flex items-center gap-3.5 px-4 h-[50px] w-full text-left rounded-xl hover:bg-bg-surface transition-colors focus-visible:outline-none shrink-0"
                    >
                        <Settings className="w-[20px] h-[20px] text-text-secondary" />
                        <span className="text-[15px] font-medium text-text-primary">{t('settings')}</span>
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