'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { soapNoteMockEN, soapNoteMockVI } from '@/lib/mockData';
import { parseSoapSections } from '@/lib/utils';
import { Button } from '@/components/Button';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

export default function EditSoapPage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const router = useRouter();

    const mockData = locale === 'vi' ? soapNoteMockVI : soapNoteMockEN;

    const [sections, setSections] = useState(parseSoapSections(mockData));

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

    return (
        <div className="flex flex-col p-6 fade-in pb-[100px] gap-6">

            <div className="flex items-center gap-2 bg-badge-progress-bg text-badge-progress px-4 py-3 rounded-[12px] border border-[#FB8A0A]/20">
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
                            className="w-full bg-bg-input rounded-[12px] border border-border-input focus-visible:bg-bg-card p-4 text-[14px] text-text-primary leading-[1.6] resize-y overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                            style={{ minHeight: '100px' }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 mt-6">
                <Button onClick={() => router.push('/soap')}>{t('save')}</Button>
                <Button variant="outline" onClick={() => setSections(parseSoapSections(mockData))}>{t('reset')}</Button>
                <Button variant="ghost" onClick={() => router.back()}>{t('cancel')}</Button>
            </div>

        </div>
    );
}
