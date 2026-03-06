'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/Toggle';
import { SettingsRow } from '@/components/SettingsRow';
import { User, KeyRound, Sun, FileText, Save, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import TemplateSwitcher from '@/components/TemplateSwitcher';

export default function SettingsPage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();

    const [autoSave, setAutoSave] = useState(true);
    const [showDevNotice, setShowDevNotice] = useState(false);
    const { theme } = useTheme();

    const handleChangePassword = () => {
        setShowDevNotice(true);
        setTimeout(() => setShowDevNotice(false), 2000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in">
            <Header
                title={t('settings')}
                onBack={() => router.back()}
            />

            <div className="flex flex-col gap-[10px] px-5 py-4">

                {/* Account Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px] mb-1">{t('sectionAccount')}</h2>
                <div className="flex flex-col gap-[1px]">
                    <div className="bg-bg-card rounded-t-[12px] overflow-hidden">
                        <SettingsRow icon={User} label={t('profile')} onClick={() => router.push('/profile')} />
                    </div>
                    <div className="bg-bg-card rounded-b-[12px] overflow-hidden border-t border-border/10">
                        <SettingsRow icon={KeyRound} label={t('changePassword')} onClick={handleChangePassword} />
                    </div>
                </div>

                <div className="h-[2px]" />

                {/* Appearance Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px] mb-1">{t('appearance')}</h2>
                <div className="flex flex-col gap-[1px]">
                    <div className="bg-bg-card rounded-t-[12px] overflow-hidden">
                        <SettingsRow icon={Sun} label={t('theme')} rightNode={<div className="flex items-center gap-[10px]"><span className="text-[13px] text-text-muted">{theme === 'dark' ? t('dark') : t('light')}</span><ThemeToggle /></div>} hideChevron />
                    </div>
                    {/* Important: Removal of overflow-hidden here to allow dropdown to show */}
                    <div className="bg-bg-card rounded-b-[12px] overflow-visible border-t border-border/10">
                        <SettingsRow icon={Globe} label={t('language')} rightNode={<LocaleSwitcher variant="filled" />} hideChevron />
                    </div>
                </div>

                <div className="h-[2px]" />

                {/* Output Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px] mb-1">{t('sectionOutput')}</h2>
                <div className="flex flex-col gap-[1px]">
                    <div className="bg-bg-card rounded-t-[12px] overflow-visible">
                        <SettingsRow icon={FileText} label={t('defaultTemplate')} rightNode={<TemplateSwitcher />} hideChevron />
                    </div>
                    <div className="bg-bg-card rounded-b-[12px] overflow-hidden border-t border-border/10">
                        <SettingsRow icon={Save} label={t('autoSave')} rightNode={<Toggle checked={autoSave} onCheckedChange={setAutoSave} />} hideChevron />
                    </div>
                </div>

            </div>

            {/* Development Notice Popup */}
            {showDevNotice && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a]/90 dark:bg-white/80 text-white dark:text-[#1a1a1a] px-5 py-2.5 rounded-full text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {t('devMode')}
                </div>
            )}
        </div>
    );
}
