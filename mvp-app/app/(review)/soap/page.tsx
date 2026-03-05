'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { soapNoteMockEN, soapNoteMockVI } from '@/lib/mockData';
import { parseSoapSections } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useReview } from '../layout';

export default function SoapNotePage() {
    const t = useTranslations('Review');
    const locale = useLocale();
    const router = useRouter();
    const { setSaveStatus } = useReview();

    const mockData = locale === 'vi' ? soapNoteMockVI : soapNoteMockEN;
    const [content, setContent] = useState(mockData);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setSaveStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setSaveStatus('saved');
        }, 1000);
    };

    return (
        <div className="flex-1 flex flex-col pt-6 fade-in gap-5">



            <textarea
                className="w-full flex-1 px-6 text-[15px] bg-transparent text-text-primary leading-[1.6] resize-none outline-none pb-8"
                value={content}
                onChange={handleChange}
                placeholder="Start typing..."
            />

        </div>
    );
}
