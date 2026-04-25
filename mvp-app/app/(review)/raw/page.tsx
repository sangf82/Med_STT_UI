'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useReview } from '../layout';
import { updateRecord } from '@/lib/api/sttMetrics';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function RawTextPage() {
    const t = useTranslations('Review');
    const { setSaveStatus, record } = useReview();

    const initialContent = record?.content || record?.refined_text || record?.raw_text || '';
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (record) {
            setContent(record.content || record.refined_text || record.raw_text || '');
        }
    }, [record]);

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
