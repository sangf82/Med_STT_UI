'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

// C4: Save Recording Dialog
export default function SaveRecordingPage() {
    const t = useTranslations('Recording');
    const router = useRouter();
    const [open, setOpen] = useState(true);

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => router.back(), 200);
    };

    const handleSave = () => {
        router.push('/format');
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-page relative fade-in">
            {/* Dimmed background resembling paused recording state */}
            <div className="flex-1 flex flex-col pt-12 opacity-30 pointer-events-none">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-[17px] font-bold">{t('newRecording')}</span>
                </div>
                <div className="flex justify-center text-[52px] font-light font-mono">
                    02:34.5
                </div>
            </div>

            <Dialog
                open={open}
                onOpenChange={(v) => !v && handleClose()}
                title={t('saveRecording')}
            >
                <div className="flex flex-col gap-5 mt-2">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-text-secondary">{t('name')}</label>
                        <div className="w-full h-[52px] bg-bg-input rounded-[12px] border border-border-input px-4 flex items-center">
                            <span className="font-medium bg-highlight-bg text-text-primary px-1 rounded">Consult 260304_010408</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-text-secondary">{t('outputFormat')}</label>
                        <button className="w-full h-[52px] bg-bg-input rounded-[12px] border border-border-input px-4 flex items-center justify-between text-[15px] text-text-primary focus-visible:outline-none focus-visible:ring-2">
                            <span>SOAP Note</span>
                            <ChevronDown className="w-5 h-5 text-text-secondary" />
                        </button>
                    </div>

                    <div className="h-[1px] bg-divider my-2" />

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={handleClose}>{t('cancel')}</Button>
                        <Button className="flex-1" onClick={handleSave}>{t('save')}</Button>
                    </div>

                </div>
            </Dialog>
        </div>
    );
}
