'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { updateDailyActualCases } from '@/lib/api/sttMetrics';

interface DailyReportDialogProps {
    onClose: () => void;
}

export function DailyReportDialog({ onClose }: DailyReportDialogProps) {
    const t = useTranslations('DailyReport');
    const [amount, setAmount] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!amount) return;
        setIsSubmitting(true);
        try {
            // Priority: pending date from localStorage, then today
            const reportDate = localStorage.getItem('daily_report_pending_date') || new Date().toISOString().split('T')[0];
            
            await updateDailyActualCases(reportDate, parseInt(amount, 10));
            
            // Mark as done for this specific date
            localStorage.setItem('daily_report_last_date', reportDate);
            localStorage.removeItem('daily_report_pending_date');
            
            setSubmitted(true);
            
            // Auto close after 3 seconds
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (error) {
            console.error("Failed to submit daily report", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-200 flex items-center justify-center px-6 bg-bg-overlay animate-in fade-in duration-300">
                <div className="bg-white dark:bg-bg-surface w-full max-w-[340px] rounded-[24px] p-8 flex flex-col items-center text-center shadow-2xl relative">
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

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center px-6 bg-bg-overlay animate-in fade-in duration-300">
            {/* Backdrop - Click disabled */}
            <div className="absolute inset-0" />

            <div className="relative bg-white dark:bg-bg-surface w-full max-w-[360px] rounded-[24px] overflow-hidden shadow-2xl flex flex-col pt-8 px-6 pb-6">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent-blue/10 dark:bg-accent-blue/20 flex items-center justify-center text-accent-blue mx-auto mb-3">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <h2 className="text-[20px] font-bold text-text-primary mb-2">
                        {t('title')}
                    </h2>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3 text-center">
                        <label className="text-[15px] font-medium text-text-primary">
                            {t('question')}
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={t('placeholder')}
                            className="w-full h-[52px] px-4 rounded-xl bg-bg-page dark:bg-bg-page/50 border border-border dark:border-divider/30 text-[16px] text-text-primary outline-none focus:border-accent-blue transition-colors text-center font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="mt-2">
                        <button
                            disabled={!amount || isSubmitting}
                            onClick={handleSubmit}
                            className={cn(
                                "w-full h-[52px] rounded-2xl text-[15px] font-bold transition-all active:scale-95",
                                amount && !isSubmitting
                                    ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/30"
                                    : "bg-[#F5F5F5] dark:bg-bg-page/30 text-[#BBBBBB] dark:text-text-muted cursor-not-allowed border dark:border-divider/20"
                            )}
                        >
                            {isSubmitting ? "..." : t('submit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
