'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { todoListMDMockEN, todoListMDMockVI } from '@/lib/mockData';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';
import { updateRecord } from '@/lib/api/sttMetrics';

export default function TodoListPage() {
    const t = useTranslations('Review');
    const locale = useLocale();

    const { setSaveStatus, record } = useReview();

    const mockData = locale === 'vi' ? todoListMDMockVI : todoListMDMockEN;
    const initialContent = record?.content || record?.refined_text || record?.raw_text || mockData;
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (record) {
            setContent(record.content || record.refined_text || record.raw_text || mockData);
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
        <div className="flex-1 flex flex-col min-h-0 fade-in">
            <RichTextEditor
                content={content}
                onChange={handleChange}
                className="min-h-0"
            />
        </div>
    );
}
