'use client';

import { useState, useRef, useEffect } from 'react';
import { useReview } from '../layout';
import { updateRecord } from '@/lib/api/sttMetrics';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Loader2 } from 'lucide-react';

export default function SoapNotePage() {
    const { setSaveStatus, record } = useReview();

    const initialContent = record?.content || record?.refined_text || record?.raw_text || '';
    const hasBackendContent = initialContent.trim().length > 0;
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [contextText, setContextText] = useState('');
    const [contextStatus, setContextStatus] = useState<string>('');
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

    useEffect(() => {
        const id = record?.id;
        if (!id) return;
        const syncTimer = setTimeout(() => {
            setIsLoadingContext(true);
            setContextStatus('');
            setContextText('');
        }, 0);
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/stt-metrics/me/records/${id}`, {
            headers: {
                Authorization: `Bearer ${typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || '') : ''}`,
            },
        })
            .then(async (r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!data) return;
                setContextStatus(data.context_status || '');
                setContextText(data.context_text || '');
            })
            .finally(() => setIsLoadingContext(false));
        return () => clearTimeout(syncTimer);
    }, [record?.id]);

    const autosave = async (nextContent: string) => {
        if (!record?.id) {
            setSaveStatus('saved');
            return;
        }
        try {
            await updateRecord(record.id, {
                content: nextContent,
                patient_name: (record as { patient_name?: string }).patient_name,
            });
            setSaveStatus('saved');
        } catch (e) {
            console.error("Save failed", e);
            setSaveStatus('error');
        }
    };

    const handleChange = (newContent: string) => {
        setContent(newContent);
        setSaveStatus('saving');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            void autosave(newContent);
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
                <>
            <div className="px-4 py-2">
                {isLoadingContext ? (
                    <div className="h-14 animate-pulse rounded-xl bg-bg-surface" />
                ) : contextStatus === 'empty' ? (
                    <div className="rounded-xl border border-border bg-bg-surface px-3 py-2">
                        <p className="text-[12px] font-semibold text-text-primary mb-1">Context cũ</p>
                        <p className="text-[13px] text-text-muted">
                        Chưa có dữ liệu khám cũ. Bản SOAP này sẽ được khởi tạo mới hoàn toàn.
                        </p>
                    </div>
                ) : contextStatus === 'unknown_patient' ? (
                    <div className="rounded-xl border border-border bg-bg-surface px-3 py-2">
                        <p className="text-[12px] font-semibold text-text-primary mb-1">Context cũ</p>
                        <p className="text-[13px] text-text-muted">
                        Chưa gán bệnh nhân, chưa thể lấy context SOAP cũ.
                        </p>
                    </div>
                ) : contextText ? (
                    <div className="rounded-xl border border-border bg-bg-surface px-3 py-2">
                        <p className="text-[12px] font-semibold text-text-primary mb-1">Context cũ</p>
                        <div className="text-[12px] text-text-muted whitespace-pre-wrap max-h-28 overflow-auto">
                            {contextText}
                        </div>
                    </div>
                ) : null}
            </div>
            <RichTextEditor
                content={content}
                onChange={handleChange}
            />
                </>
            )}
        </div>
    );
}
