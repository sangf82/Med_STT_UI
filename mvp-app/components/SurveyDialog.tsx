'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, CheckCircle2, X } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface SurveyDialogProps {
    onClose: () => void;
}

export function SurveyDialog({ onClose }: SurveyDialogProps) {
    const t = useTranslations('Survey');
    const { setShowNotificationDot } = useAppContext();
    const [rating, setRating] = useState<number | null>(null);
    const [reason, setReason] = useState('');
    const [refer, setRefer] = useState<boolean | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);
        setShowNotificationDot(false);
        // Auto close after 3 seconds
        setTimeout(() => {
            onClose();
        }, 3000);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-bg-overlay animate-in fade-in duration-300">
                <div className="bg-white dark:bg-bg-surface w-full max-w-[340px] rounded-[24px] p-8 flex flex-col items-center text-center shadow-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute right-5 top-5 p-1 text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-16 h-16 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center text-success mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-[22px] font-bold text-text-primary mb-2">
                        {t('thanks')}
                    </h2>
                    <p className="text-[16px] text-text-muted leading-relaxed">
                        {t('thanksSub')}
                    </p>
                </div>
            </div>
        );
    }

    const canSubmit = rating !== null && refer !== null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-bg-overlay animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-white dark:bg-bg-surface w-full max-w-[360px] rounded-[24px] overflow-hidden shadow-2xl flex flex-col pt-8 px-6 pb-6">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 p-1 text-text-muted hover:text-text-primary transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-[20px] font-bold text-text-primary mb-2">
                        {t('title')}
                    </h2>
                    <p className="text-[14px] font-medium text-accent-blue bg-accent-blue/5 dark:bg-accent-blue/10 py-2 px-4 rounded-full inline-block">
                        {t('intro')}
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Q1: Rating */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[15px] font-bold text-text-primary">
                            {t('rate')}
                        </label>
                        <div className="flex justify-between items-center px-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setRating(num)}
                                    className={cn(
                                        "w-[48px] h-[48px] rounded-full flex items-center justify-center text-[16px] font-bold border transition-all active:scale-90",
                                        rating === num
                                            ? "bg-accent-orange text-white border-transparent shadow-lg shadow-accent-orange/30"
                                            : "bg-bg-page dark:bg-bg-page/50 text-text-muted border-[#E0E0E0] dark:border-divider/30 hover:border-accent-orange hover:text-accent-orange"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        {/* Optional Reason Input - Hidden until rating selected */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-300",
                            rating !== null ? "h-[100px] opacity-100 mt-2" : "h-0 opacity-0"
                        )}>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={t('ratingReason')}
                                className="w-full h-full p-3 rounded-xl bg-bg-page dark:bg-bg-page/50 border border-border dark:border-divider/30 text-[14px] text-text-primary outline-none focus:border-accent-blue transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Q2: Referral */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[15px] font-bold text-text-primary">
                            {t('refer')}
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRefer(true)}
                                className={cn(
                                    "flex-1 h-[48px] rounded-xl text-[14px] font-bold border transition-all active:scale-95",
                                    refer === true
                                        ? "bg-accent-blue text-white border-transparent"
                                        : "bg-white dark:bg-bg-surface text-text-primary border-[#E0E0E0] dark:border-divider/30"
                                )}
                            >
                                {t('yes')}
                            </button>
                            <button
                                onClick={() => setRefer(false)}
                                className={cn(
                                    "flex-1 h-[48px] rounded-xl text-[14px] font-bold border transition-all active:scale-95",
                                    refer === false
                                        ? "bg-text-muted text-white border-transparent shadow-sm shadow-black/10"
                                        : "bg-white dark:bg-bg-surface text-text-primary border-[#E0E0E0] dark:border-divider/30"
                                )}
                            >
                                {t('no')}
                            </button>
                        </div>
                    </div>

                    <div className="mt-2 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-[52px] rounded-2xl text-[15px] font-bold text-[#888888] active:scale-95 transition-all hover:text-text-primary dark:hover:text-text-primary"
                        >
                            {t('no')}
                        </button>
                        <button
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                            className={cn(
                                "flex-[2] h-[52px] rounded-2xl text-[15px] font-bold transition-all active:scale-95",
                                canSubmit
                                    ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/30"
                                    : "bg-[#F5F5F5] dark:bg-bg-page/30 text-[#BBBBBB] dark:text-text-muted cursor-not-allowed border dark:border-divider/20"
                            )}
                        >
                            {t('submit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
