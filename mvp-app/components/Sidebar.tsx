'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Shield, AudioLines, Wand2, Globe, Settings } from 'lucide-react'
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
        subtitle: string;
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
                <div className="flex-1 overflow-y-auto py-3 flex flex-col">
                    {/* All Records */}
                    <button
                        onClick={() => { router.push('/dashboard'); onClose() }}
                        className="flex items-center gap-4 px-6 h-[52px] w-full text-left bg-[#FFF7ED] border-l-[3px] border-accent-orange focus-visible:outline-none shrink-0"
                    >
                        <AudioLines className="w-[22px] h-[22px] text-accent-orange" />
                        <span className="text-[15px] font-semibold text-accent-orange">{t('allRecords')}</span>
                    </button>

                    {/* Auto-transcribe */}
                    <div className="flex items-center justify-between px-6 h-[52px] shrink-0">
                        <div className="flex items-center gap-4">
                            <Wand2 className="w-[22px] h-[22px] text-text-secondary" />
                            <span className="text-[15px] text-text-primary">{t('autoTranscribe')}</span>
                        </div>
                        <Toggle checked={autoTranscribe} onCheckedChange={setAutoTranscribe} />
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-divider w-full" />

                    {/* Language */}
                    <div className="flex items-center justify-between px-6 h-[52px] shrink-0">
                        <div className="flex items-center gap-4">
                            <Globe className="w-[22px] h-[22px] text-text-secondary" />
                            <span className="text-[15px] text-text-primary">{t('language')}</span>
                        </div>
                        <div className="relative">
                            <select
                                defaultValue={locale}
                                onChange={handleLocaleChange}
                                className="bg-[#EBF5F8] text-[13px] font-semibold text-accent-blue py-1 px-3 pr-6 rounded-[8px] appearance-none cursor-pointer border-none focus-visible:outline-none"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23219ebc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
                            >
                                <option value="en">English</option>
                                <option value="vi">Tiếng Việt</option>
                            </select>
                        </div>
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => { router.push('/settings'); onClose() }}
                        className="flex items-center gap-4 px-6 h-[52px] w-full text-left text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors focus-visible:outline-none shrink-0"
                    >
                        <Settings className="w-[22px] h-[22px] text-text-secondary" />
                        <span className="text-[15px]">{t('settings')}</span>
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