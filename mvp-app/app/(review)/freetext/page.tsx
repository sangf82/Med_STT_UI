'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { freeTextMockEN, freeTextMockVI } from '@/lib/mockData';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';
import { updateRecord } from '@/lib/api/sttMetrics';

export default function FreeTextPage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const { setSaveStatus, record } = useReview();

    const mockData = locale === 'vi' ? freeTextMockVI : freeTextMockEN;
    const initialContent = record?.content || record?.raw_text || mockData;
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (record) {
            setContent(record.content || record.raw_text || mockData);
        }
    }, [record, mockData]);

    const handleChange = (newContent: string) => {
        setContent(newContent);
        setSaveStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            if (record?.id) {
                try {
                    await updateRecord(record.id, { content: newContent });
                    setSaveStatus('saved');
                } catch (e) {
                    console.error("Save failed", e);
                    setSaveStatus('error');
                }
            } else {
                setSaveStatus('saved');
            }
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
