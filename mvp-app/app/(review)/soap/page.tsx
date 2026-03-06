'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { soapNoteMockEN, soapNoteMockVI } from '@/lib/mockData';
import { parseSoapSections } from '@/lib/utils';
import { useState, useRef } from 'react';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function SoapNotePage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const router = useRouter();
    const { setSaveStatus } = useReview();

    const mockData = locale === 'vi' ? soapNoteMockVI : soapNoteMockEN;
    const [content, setContent] = useState(mockData);
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
