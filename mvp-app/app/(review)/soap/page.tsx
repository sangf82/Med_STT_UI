'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { soapNoteMockEN, soapNoteMockVI } from '@/lib/mockData';
import { normalizeSoapPlanMarkdownForDisplay } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useReview } from '../layout';
import { updateRecord } from '@/lib/api/sttMetrics';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function SoapNotePage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const router = useRouter();
    const { setSaveStatus, record } = useReview();

    const mockData = locale === 'vi' ? soapNoteMockVI : soapNoteMockEN;
    const initialRawContent = record?.content || record?.refined_text || record?.raw_text || mockData;
    const initialContent = normalizeSoapPlanMarkdownForDisplay(initialRawContent);
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (record) {
            const raw = record.content || record.refined_text || record.raw_text || mockData;
            setContent(normalizeSoapPlanMarkdownForDisplay(raw));
        }
    }, [record, mockData]);

    const handleChange = (newContent: string) => {
        const normalizedContent = normalizeSoapPlanMarkdownForDisplay(newContent);
        setContent(normalizedContent);
        setSaveStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            if (record?.id) {
                try {
                    await updateRecord(record.id, { content: normalizedContent });
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
                coerceTaskListOnLoad
            />
        </div>
    );
}
