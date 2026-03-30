'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { parseSoapSections } from '@/lib/utils';
import { Button } from '@/components/Button';
import { Loader2, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useReview } from '../layout';
import { updateRecord } from '@/lib/api/sttMetrics';

function serializeSoapSections(sections: { label: string; content: string }[]) {
    return sections
        .map((section) => `${section.label}: ${section.content}`)
        .join('\n\n')
        .trim();
}

export default function EditSoapPage() {
    const t = useTranslations('Review');
    const router = useRouter();
    const { record, setSaveStatus } = useReview();
    const [isSaving, setIsSaving] = useState(false);

    const initialContent = useMemo(
        () => record?.content || record?.refined_text || record?.raw_text || '',
        [record],
    );
    const initialSections = useMemo(() => parseSoapSections(initialContent), [initialContent]);
    const [sections, setSections] = useState(initialSections);

    useEffect(() => {
        setSections(initialSections);
    }, [initialSections]);

    const handleContentChange = (index: number, newContent: string) => {
        const next = [...sections];
        next[index].content = newContent;
        setSections(next);
    };

    // Automatically grow textarea to fit content
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
    };

    const handleSave = async () => {
        if (!record?.id) {
            router.push('/soap');
            return;
        }

        setIsSaving(true);
        setSaveStatus('saving');
        try {
            const content = serializeSoapSections(sections);
            await updateRecord(record.id, {
                content,
                patient_name: (record as { patient_name?: string }).patient_name,
            });
            setSaveStatus('saved');
            router.push(`/soap?id=${record.id}`);
        } catch (e) {
            console.error('Save failed', e);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col p-6 fade-in pb-25 gap-6">

            <div className="flex items-center gap-2 bg-badge-progress-bg text-badge-progress px-4 py-3 rounded-xl border border-brand-orange/20">
                <Pencil className="w-4 h-4 shrink-0" />
                <span className="text-[13px] font-semibold">{t('editModeMsg')}</span>
            </div>

            <div className="flex flex-col gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <label className="text-[12px] font-bold text-accent-blue tracking-[0.02em]">
                            {section.label}
                        </label>
                        <textarea
                            value={section.content}
                            onChange={(e) => handleContentChange(idx, e.target.value)}
                            onInput={handleInput}
                            rows={4}
                            className="w-full bg-bg-input rounded-xl border border-border-input focus-visible:bg-bg-card p-4 text-[14px] text-text-primary leading-[1.6] resize-y overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                            style={{ minHeight: '100px' }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 mt-6">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('saving')}
                        </span>
                    ) : (
                        t('save')
                    )}
                </Button>
                <Button variant="outline" onClick={() => setSections(initialSections)}>{t('reset')}</Button>
                <Button variant="ghost" onClick={() => router.back()}>{t('cancel')}</Button>
            </div>

        </div>
    );
}
