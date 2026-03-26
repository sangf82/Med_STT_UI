'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { soapNoteMockEN, soapNoteMockVI } from '@/lib/mockData';
import { parseSoapSections } from '@/lib/utils';
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
    const initialContent = record?.content || record?.refined_text || record?.raw_text || mockData;
    const [content, setContent] = useState(initialContent);
    const timeoutRef = useRef<NodeJS.Timeout>(null);
    const lastEditAtRef = useRef<number>(0);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [contextText, setContextText] = useState('');
    const [contextStatus, setContextStatus] = useState<string>('');

    useEffect(() => {
        if (record) {
            setContent(record.content || record.refined_text || record.raw_text || mockData);
        }
    }, [record, mockData]);

    useEffect(() => {
        const id = record?.id;
        if (!id) return;
        setIsLoadingContext(true);
        setContextStatus('');
        setContextText('');
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
        const now = Date.now();
        const diff = now - lastEditAtRef.current;
        lastEditAtRef.current = now;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (diff > 5000) {
            void autosave(newContent);
            return;
        }
        timeoutRef.current = setTimeout(() => {
            void autosave(newContent);
        }, 15000);
    };

    return (
        <div className="flex-1 flex flex-col fade-in">
            <div className="px-4 py-2">
                {isLoadingContext ? (
                    <div className="h-14 animate-pulse rounded-xl bg-bg-surface" />
                ) : contextStatus === 'empty' ? (
                    <div className="rounded-xl border border-border bg-bg-surface px-3 py-2 text-[13px] text-text-muted">
                        Chưa có dữ liệu khám cũ. Bản SOAP này sẽ được khởi tạo mới hoàn toàn.
                    </div>
                ) : contextStatus === 'unknown_patient' ? (
                    <div className="rounded-xl border border-border bg-bg-surface px-3 py-2 text-[13px] text-text-muted">
                        Chưa gán bệnh nhân, chưa thể lấy context SOAP cũ.
                    </div>
                ) : contextText ? (
                    <div className="rounded-xl border border-border bg-bg-surface px-3 py-2 text-[12px] text-text-muted whitespace-pre-wrap max-h-28 overflow-auto">
                        {contextText}
                    </div>
                ) : null}
            </div>
            <RichTextEditor
                content={content}
                onChange={handleChange}
            />
        </div>
    );
}
