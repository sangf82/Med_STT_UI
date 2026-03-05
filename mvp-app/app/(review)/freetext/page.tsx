'use client';

import { useLocale } from 'next-intl';
import { freeTextMockEN, freeTextMockVI } from '@/lib/mockData';

export default function FreeTextPage() {
    const locale = useLocale();
    const data = locale === 'vi' ? freeTextMockVI : freeTextMockEN;

    return (
        <div className="flex flex-col p-6 fade-in">
            <div className="text-[14px] text-text-secondary leading-[1.7] whitespace-pre-wrap">
                {data}
            </div>
        </div>
    );
}
