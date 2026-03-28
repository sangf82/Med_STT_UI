'use client';

import { useState, useRef, useEffect } from 'react';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';
import { updateRecord } from '@/lib/api/sttMetrics';
import { Loader2 } from 'lucide-react';

export default function EhrSummaryPage() {
    const { setSaveStatus, record } = useReview();

    const initialContent = record?.content || record?.refined_text || record?.raw_text || '';
    const hasBackendContent = initialContent.trim().length > 0;
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTranscribing = record?.status === 'transcribing';
    const isWaitingForResult = Boolean(record?.id) && !hasBackendContent;

    useEffect(() => {
        if (record) {
            const syncTimer = setTimeout(() => {
                setContent(record.content || record.refined_text || record.raw_text || '');
            }, 0);
            return () => clearTimeout(syncTimer);
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

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col fade-in">
            {(isTranscribing || isWaitingForResult) ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-text-muted">
                    <Loader2 className="w-7 h-7 animate-spin mb-3 text-accent-blue" />
                    <p className="text-[15px] font-semibold text-text-primary">Đang chuyển giọng nói thành văn bản...</p>
                    <p className="text-[13px] mt-1">Vui lòng chờ trong giây lát.</p>
                </div>
            ) : (
                <RichTextEditor
                    content={content}
                    onChange={handleChange}
                />
            )}
        </div>
    );
}
