'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ehrSummaryMockEN, ehrSummaryMockVI } from '@/lib/mockData';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';
import { updateRecord } from '@/lib/api/sttMetrics';

export default function EhrSummaryPage() {
    const locale = useLocale();

    const { setSaveStatus, record } = useReview();

    const data = locale === 'vi' ? ehrSummaryMockVI : ehrSummaryMockEN;
    const initialContent = record?.content || record?.refined_text || record?.raw_text || data;
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (record) {
            setContent(record.content || record.refined_text || record.raw_text || data);
        }
    }, [record, data]);

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

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col fade-in">
            <RichTextEditor
                content={content}
                onChange={handleChange}
            />
        </div>
    );
}
