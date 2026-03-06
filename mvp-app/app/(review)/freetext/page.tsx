'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { freeTextMockEN, freeTextMockVI } from '@/lib/mockData';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function FreeTextPage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const mockData = locale === 'vi' ? freeTextMockVI : freeTextMockEN;
    const [content, setContent] = useState(mockData);
    const { setSaveStatus } = useReview();
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const handleChange = (newContent: string) => {
        setContent(newContent);
        setSaveStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setSaveStatus('saved');
        }, 1000);
    };

    return (
        <div className="flex-1 flex flex-col fade-in">
            <RichTextEditor
                content={content}
                onChange={handleChange}
            />
        </div>
    );
}
