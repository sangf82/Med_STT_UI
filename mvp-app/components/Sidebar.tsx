'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Lock, AudioWaveform, Globe, Settings } from 'lucide-react'
import { Toggle } from "./Toggle"
import { useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"

export interface SidebarProps {
    open: boolean;
    onClose: () => void;
    profile: {
        initials: string;
        name: string;
    };
}

export function Sidebar({ open, onClose, profile }: SidebarProps) {
    const router = useRouter()
    const t = useTranslations('Dashboard')
    const locale = useLocale()

    const [autoTranscribe, setAutoTranscribe] = React.useState(true)

    const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        document.cookie = `NEXT_LOCALE=${e.target.value}; path=/; max-age=31536000`;
        router.refresh();
    };

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
                <div className="bg-accent-blue p-6 pb-8 text-white relative flex flex-col gap-4">
                    <div className="w-[52px] h-[52px] rounded-full bg-white text-accent-blue flex items-center justify-center font-bold text-[18px]">
                        {profile.initials}
                    </div>
                    <h2 className="text-[17px] font-bold">{profile.name}</h2>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
                    {/* All Records */}
                    <button
                        onClick={() => { router.push('/dashboard'); onClose() }}
                        className="flex items-center gap-4 px-6 py-[14px] w-full text-left text-accent-blue bg-accent-blue/5 focus-visible:outline-none"
                    >
                        <AudioWaveform className="w-5 h-5 text-accent-blue" />
                        <span className="text-[15px] font-bold text-accent-blue">{t('allRecords')}</span>
                    </button>

                    {/* Auto-transcribe */}
                    <div className="flex items-center justify-between px-6 py-[14px]">
                        <div className="flex items-center gap-4">
                            <AudioWaveform className="w-5 h-5 text-text-muted opacity-0" />
                            <span className="text-[15px] font-medium text-text-primary">{t('autoTranscribe')}</span>
                        </div>
                        <Toggle checked={autoTranscribe} onCheckedChange={setAutoTranscribe} />
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between px-6 py-[14px]">
                        <div className="flex items-center gap-4">
                            <Globe className="w-5 h-5 text-text-muted" />
                            <span className="text-[15px] font-medium text-text-primary">{t('language')}</span>
                        </div>
                        <select
                            defaultValue={locale}
                            onChange={handleLocaleChange}
                            className="bg-accent-blue/10 text-[13px] font-semibold text-accent-blue py-1 px-2.5 rounded-full appearance-none pr-5 cursor-pointer border-none focus-visible:outline-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23219ebc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '10px' }}
                        >
                            <option value="en">English</option>
                            <option value="vi">Tiếng Việt</option>
                        </select>
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => { router.push('/settings'); onClose() }}
                        className="flex items-center gap-4 px-6 py-[14px] w-full text-left text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors focus-visible:outline-none"
                    >
                        <Settings className="w-5 h-5 text-text-muted" />
                        <span className="text-[15px] font-medium">{t('settings')}</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 pb-8 bg-bg-sidebar">
                    <div className="flex items-center justify-center gap-[6px] text-text-muted">
                        <Lock className="w-[14px] h-[14px]" />
                        <span className="text-[11px] font-medium">HIPAA Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    )
}