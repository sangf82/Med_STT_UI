'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FormatCard } from '@/components/FormatCard';
import { Button } from '@/components/Button';
import { FileHeart, ClipboardList, AlignLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';

// C5: Choose Output Format
export default function FormatSelectionPage() {
    const t = useTranslations('Recording');
    const d = useTranslations('Review'); // For terminology like SOAP Note
    const router = useRouter();

    const [selectedFormat, setSelectedFormat] = useState('ehr');

    const handleStartTranscribe = () => {
        // Navigate to Review flow (D1)
        router.push('/soap');
    };

    const formats = [
        {
            id: 'soap',
            title: d('soapNote'),
            icon: <ClipboardList className="w-5 h-5" />,
            bgClass: 'bg-section-head-bg',
            colorClass: 'text-accent-blue'
        },
        {
            id: 'ehr',
            title: d('ehrSummary'),
            icon: <FileHeart className="w-5 h-5" />,
            bgClass: 'bg-badge-progress-bg',
            colorClass: 'text-accent-orange'
        },
        {
            id: 'freetext',
            title: d('freeText'),
            icon: <AlignLeft className="w-5 h-5" />,
            bgClass: 'bg-bg-input',
            colorClass: 'text-text-secondary'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in pb-10">
            <Header
                title={t('transcribe')}
                onBack={() => router.back()}
            />

            <div className="flex flex-col px-6 pt-6 gap-8">

                <div className="flex flex-col gap-2 relative">
                    <Sparkles className="absolute -top-3 -right-1 w-6 h-6 text-accent-orange opacity-50" />
                    <h1 className="text-[18px] font-bold text-text-primary pr-8">{t('chooseFormat')}</h1>
                    <p className="text-[13px] text-text-muted leading-relaxed">
                        {t('selectFormatDesc')}
                    </p>
                </div>

                <div className="flex flex-col gap-[12px]">
                    {formats.map((format) => (
                        <FormatCard
                            key={format.id}
                            title={format.title}
                            selected={selectedFormat === format.id}
                            onClick={() => setSelectedFormat(format.id)}
                            icon={format.icon}
                            iconBgColorClass={format.bgClass}
                            iconColorClass={format.colorClass}
                        />
                    ))}
                </div>

                <div className="flex flex-col gap-4 mt-auto pt-10">
                    <Button onClick={handleStartTranscribe} className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 fill-white/20" />
                        <span>{t('startTranscribe')}</span>
                    </Button>
                    <Button variant="link" onClick={() => router.push('/dashboard')}>{t('skip')}</Button>
                </div>

            </div>
        </div>
    );
}
