'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Shield, AudioLines, Settings, MessageSquareQuote, Users2, ListTodo, Inbox } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import { useAppContext } from "@/context/AppContext"
import type { LucideIcon } from 'lucide-react'

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
    const pathname = usePathname()
    const t = useTranslations('Dashboard')
    const s = useTranslations('Survey')
    const { recordings, showTrialPanel, totalRecordsFromApi, totalByFormat } = useAppContext()

    const navItems: Array<{
        key: string;
        label: string;
        icon: LucideIcon;
        href: string;
        count?: number;
        active: boolean;
    }> = [
        {
            key: 'dashboard',
            label: t('allRecords'),
            icon: AudioLines,
            href: '/dashboard',
            count: totalRecordsFromApi,
            active: pathname === '/dashboard',
        },
        {
            key: 'tasks',
            label: t('todoList'),
            icon: ListTodo,
            href: '/tasks',
            count: totalByFormat.todo,
            active: pathname === '/tasks',
        },
        {
            key: 'patients',
            label: t('patients'),
            icon: Users2,
            href: '/patients',
            active: pathname === '/patients' || pathname.startsWith('/patients/'),
        },
        {
            key: 'unassigned',
            label: t('unassigned'),
            icon: Inbox,
            href: '/unassigned',
            active: pathname === '/unassigned',
        },
    ];

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
        <div className="fixed inset-0 z-100 flex fade-in pointer-events-auto">
            <div
                className="absolute inset-0 bg-bg-overlay"
                onClick={onClose}
                aria-label="Close sidebar"
            />

            <div className="relative w-75 h-full bg-bg-sidebar flex flex-col slide-in-left shadow-2xl">
                {/* Profile Header */}
                <div className="bg-accent-blue pt-12 px-6 pb-5 text-white relative flex flex-col gap-3">
                    <div className="w-13 h-13 rounded-full bg-white text-accent-blue flex items-center justify-center font-bold text-[18px]">
                        {profile.initials}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[17px] font-bold">{profile.name}</h2>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-0 px-3 mt-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.key}
                                onClick={() => {
                                    router.push(item.href);
                                    onClose();
                                }}
                                className={cn(
                                    "flex items-center justify-between px-4 h-11 w-full text-left rounded-xl transition-colors focus-visible:outline-none shrink-0",
                                    item.active ? "bg-accent-orange/15 hover:bg-accent-orange/20" : "hover:bg-bg-surface"
                                )}
                            >
                                <div className="flex items-center gap-3.5">
                                    <Icon className={cn("w-4.5 h-4.5", item.active ? "text-accent-orange" : "text-text-secondary")} />
                                    <span className={cn("text-[14px]", item.active ? "text-accent-orange font-semibold" : "text-text-primary font-medium")}>
                                        {item.label}
                                    </span>
                                </div>
                                {typeof item.count === 'number' ? (
                                    <span className={cn("text-[12px]", item.active ? "text-accent-orange/60 font-bold" : "text-text-muted font-semibold")}>
                                        {item.count}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}

                    <div className="my-1 border-t border-divider/50 mx-4" />

                    {/* Settings */}
                    <button
                        onClick={() => { router.push('/settings'); onClose() }}
                        className="flex items-center gap-3.5 px-4 h-11 w-full text-left rounded-xl hover:bg-bg-surface transition-colors focus-visible:outline-none shrink-0"
                    >
                        <Settings className="w-4.5 h-4.5 text-text-secondary" />
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

function SidebarSurvey({ t, onAction }: { t: (key: string) => string; onAction: () => void }) {
    const { setShowSurvey, setShowTrialPanel, setShowNotificationDot } = useAppContext();

    return (
        <div
            className="bg-white dark:bg-bg-surface rounded-[20px] p-4 w-full flex flex-col gap-4 border border-[#EEEEEE] dark:border-divider/50 shadow-sm mb-4"
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

            <div className="flex border-t border-[#F0F0F0] dark:border-divider/30 -mx-4 -mb-4 h-11">
                <button
                    onClick={() => {
                        onAction(); // Close sidebar
                        setTimeout(() => setShowSurvey(true), 300); // Popup survey
                    }}
                    className="flex-1 text-[14px] font-bold text-accent-blue active:bg-bg-page dark:active:bg-bg-overlay transition-colors"
                >
                    {t('yes')}
                </button>
                <div className="w-px h-4 bg-[#E0E0E0] dark:bg-divider/40 self-center" />
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
