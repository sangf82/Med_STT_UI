'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ehrSummaryMockEN, ehrSummaryMockVI } from '@/lib/mockData';
import { useReview } from '../layout';

export default function EhrSummaryPage() {
    const locale = useLocale();

    const data = locale === 'vi' ? ehrSummaryMockVI : ehrSummaryMockEN;
    const [content, setContent] = useState(data);
    const { setSaveStatus } = useReview();
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setSaveStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setSaveStatus('saved');
        }, 1000);
    };

    return (
        <div className="flex-1 flex flex-col pt-6 fade-in gap-5">
            <textarea
                className="w-full flex-1 px-6 text-[15px] bg-transparent text-text-primary leading-[1.6] resize-none outline-none pb-8"
                value={content}
                onChange={handleChange}
                placeholder="Start typing..."
            />
        </div>
    );
}
