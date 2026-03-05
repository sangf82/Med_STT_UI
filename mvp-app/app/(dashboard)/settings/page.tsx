'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/Toggle';
import { SettingsRow } from '@/components/SettingsRow';
import { User, KeyRound, Sun, FileText, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();

    const [autoSave, setAutoSave] = useState(true);
    const { theme } = useTheme();

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in">
            <Header
                title={t('settings')}
                onBack={() => router.back()}
            />

            <div className="flex flex-col gap-[10px] px-5 py-4">

                {/* Account Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px]">{t('sectionAccount')}</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <SettingsRow icon={User} label={t('profile')} onClick={() => router.push('/profile')} />
                </div>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <SettingsRow icon={KeyRound} label={t('changePassword')} />
                </div>

                <div className="h-[2px]" />

                {/* Appearance Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px]">{t('appearance')}</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <SettingsRow icon={Sun} label={t('theme')} rightNode={<div className="flex items-center gap-[10px]"><span className="text-[13px] text-text-muted">{theme === 'dark' ? t('dark') : t('light')}</span><ThemeToggle /></div>} hideChevron />
                </div>

                <div className="h-[2px]" />

                {/* Output Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px]">{t('sectionOutput')}</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <SettingsRow icon={FileText} label={t('defaultTemplate')} rightNode={<span className="text-[13px] text-text-muted">SOAP Note</span>} />
                </div>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <SettingsRow icon={Save} label={t('autoSave')} rightNode={<Toggle checked={autoSave} onCheckedChange={setAutoSave} />} hideChevron />
                </div>

            </div>
        </div>
    );
}