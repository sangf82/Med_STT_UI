'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/Toggle';
import { SettingsRow } from '@/components/SettingsRow';
import { User, KeyRound, Sun, FileText, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();

    const [autoSave, setAutoSave] = useState(true);

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in">
            <Header
                title={t('settings')}
                onBack={() => router.back()}
            />

            <div className="flex flex-col gap-[24px] px-4 py-6">

                {/* Account Section */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-wide px-2 py-1">{t('sectionAccount')}</h2>
                    <div className="bg-bg-card rounded-[16px] shadow-card overflow-hidden divide-y divide-divider">
                        <SettingsRow icon={User} label={t('profile')} onClick={() => router.push('/profile')} />
                        <SettingsRow icon={KeyRound} label={t('changePassword')} />
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-wide px-2 py-1">{t('appearance')}</h2>
                    <div className="bg-bg-card rounded-[16px] shadow-card overflow-hidden divide-y divide-divider">
                        <SettingsRow icon={Sun} label={t('theme')} rightNode={<ThemeToggle />} hideChevron />
                    </div>
                </section>

                {/* Output Section */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-wide px-2 py-1">{t('sectionOutput')}</h2>
                    <div className="bg-bg-card rounded-[16px] shadow-card overflow-hidden divide-y divide-divider">
                        <SettingsRow icon={FileText} label={t('defaultTemplate')} rightNode={<span className="text-[13px] text-text-muted font-medium">SOAP Note</span>} />
                        <SettingsRow icon={Save} label={t('autoSave')} rightNode={<Toggle checked={autoSave} onCheckedChange={setAutoSave} />} hideChevron />
                    </div>
                </section>

            </div>
        </div>
    );
}