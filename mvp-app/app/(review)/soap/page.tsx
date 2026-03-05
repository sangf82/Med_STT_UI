'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { soapNoteMockEN, soapNoteMockVI } from '@/lib/mockData';
import { parseSoapSections } from '@/lib/utils';

export default function SoapNotePage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const router = useRouter();

    const mockData = locale === 'vi' ? soapNoteMockVI : soapNoteMockEN;

    const sections = parseSoapSections(mockData);

    return (
        <div className="flex flex-col p-6 fade-in gap-5">

            <div className="flex items-center justify-between pb-2">
                <h2 className="text-[18px] font-bold text-text-primary leading-none">{t('soapNote')}</h2>
                <button
                    onClick={() => router.push('/edit')}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-accent-blue active:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 rounded"
                >
                    <Pencil className="w-[14px] h-[14px]" />
                    <span>{t('edit')}</span>
                </button>
            </div>

            <div className="flex flex-col gap-5 pb-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="flex flex-col relative">
                        {/* The brand border indicator */}
                        <div className="absolute left-[-24px] top-0 bottom-0 w-[4px] bg-section-head-border rounded-r opacity-0 md:opacity-100" />

                        <div className="inline-flex items-center self-start bg-section-head-bg border-l-[3px] border-section-head-border px-2 py-1 mb-2 rounded-r-[4px]">
                            <span className="text-[12px] font-bold text-accent-blue tracking-[0.02em]">
                                {section.label}
                            </span>
                        </div>

                        {/* Render lines honoring bullet points and basic formatting */}
                        <div className="text-[14px] text-text-secondary leading-[1.6] whitespace-pre-wrap px-1">
                            {section.content}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
