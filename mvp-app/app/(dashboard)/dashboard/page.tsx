'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useMemo } from 'react';
import { Menu, Search, Stethoscope } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useSidebar } from '@/context/SidebarContext';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SurveyDialog } from '@/components/SurveyDialog';

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const a = useTranslations('Auth');
    const b = useTranslations('Badge');
    const r = useTranslations('Review');
    const router = useRouter();
    const { open: openSidebar } = useSidebar();
    const { recordings, filter, showSurvey, setShowSurvey } = useAppContext();
    const [showDevNotice, setShowDevNotice] = useState(false);

    const handleSearchClick = () => {
        setShowDevNotice(true);
        setTimeout(() => setShowDevNotice(false), 2000);
    };

    const filteredRecordings = recordings.filter(rec => {
        if (filter === null) return true;
        if (filter === 'None') return !rec.format;
        return rec.format === filter;
    });

    const headerTitle = useMemo(() => {
        if (filter === 'Ghi chú SOAP') return r('soapNote');
        if (filter === 'Tóm tắt lâm sàng') return r('ehrSummary');
        if (filter === 'Kế hoạch hành động') return r('todoList');
        if (filter === 'Chưa phân loại') return r('raw');
        return '';
    }, [filter, r]);

    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            requestAnimationFrame(() => setScrollY(window.scrollY));
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const progress = Math.min(Math.max(scrollY / 132, 0), 1);
    const headerHeight = Math.max(48, 180 - scrollY);
    const isScrolled = scrollY > 40;

    return (
        <div className="flex flex-col min-h-screen pb-[120px] fade-in">
            {/* ── Fixed Animated Header ── */}
            <div
                className="fixed top-0 left-0 right-0 z-40 bg-bg-page overflow-hidden"
                style={{ height: `${headerHeight}px` }}
            >
                <div className="max-w-md mx-auto w-full h-full relative">

                    {/* Hamburger Menu */}
                    <button
                        onClick={openSidebar}
                        className="absolute left-3 w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 text-text-primary"
                        style={{ bottom: `${12 - progress * 8}px` }}
                        aria-label="Open menu"
                    >
                        <div className="relative">
                            <Menu className="w-6 h-6" />
                            {recordings.length >= 5 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger border-2 border-bg-page rounded-full" />
                            )}
                        </div>
                    </button>

                    {/* Search Icon */}
                    <button
                        onClick={handleSearchClick}
                        className="absolute right-3 w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 text-text-primary"
                        style={{ bottom: `${12 - progress * 8}px` }}
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Collapsed Header Small Logo (Fades in) */}
                    <div
                        className="absolute left-[52px] flex items-center gap-[6px] pointer-events-none"
                        style={{
                            top: '12px',
                            opacity: progress,
                            transform: `translateY(${10 - (progress * 10)}px)`
                        }}
                    >
                        <Stethoscope className="w-[22px] h-[22px] text-accent-blue" />
                        {headerTitle ? (
                            <span className="text-[18px] font-bold text-text-primary leading-none pt-[2px]">{headerTitle}</span>
                        ) : (
                            <span className="text-[18px] font-bold leading-none pt-[2px]"><span className="text-accent-blue">Med</span><span className="text-accent-orange">Mate</span></span>
                        )}
                    </div>

                    {/* Expanded Hero Big Logo (Fades out) */}
                    <div
                        className="absolute w-full flex flex-col items-center justify-center text-center px-5 pointer-events-none"
                        style={{
                            top: '32px',
                            opacity: 1 - Math.min(progress * 1.5, 1),
                            transform: `translateY(${-progress * 20}px) scale(${1 - progress * 0.1})`
                        }}
                    >
                        <Stethoscope className="w-[48px] h-[48px] text-accent-blue mb-2" />
                        {headerTitle ? (
                            <h1 className="text-[28px] font-bold leading-tight text-text-primary">{headerTitle}</h1>
                        ) : (
                            <>
                                <h1 className="text-[28px] font-bold leading-tight"><span className="text-accent-blue">Med</span><span className="text-accent-orange">Mate</span></h1>
                                <p className="text-[14px] text-text-muted mt-[2px]">{a('subtitle')}</p>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* Placeholder to preserve space and prevent jump */}
            <div className="h-[180px] shrink-0 w-full" />

            {/* ── Recording List ── */}
            <div className="px-4 flex flex-col gap-[10px]">
                <h2 className={cn(
                    "text-[13px] font-semibold text-text-muted mb-1 px-1 transition-all duration-300",
                    isScrolled ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
                )}>
                    {t('myRecordings')}
                </h2>

                {filteredRecordings.map(rec => (
                    <Card
                        key={rec.id}
                        className="cursor-pointer hover:border-border hover:bg-bg-surface transition-colors"
                        onClick={() => {
                            const startTab = rec.format === 'Tóm tắt lâm sàng' ? 'ehr' : (rec.format === 'Ghi chú SOAP' ? 'soap' : (rec.format === 'Kế hoạch hành động' ? 'todo' : 'freetext'));
                            router.push(`/${startTab}?id=${rec.id}`);
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-[15px] font-bold text-text-primary leading-tight">{rec.title}</h3>
                                <p className="text-[12px] text-text-muted mt-1">
                                    {rec.format ?? 'None'} &middot; {rec.duration} &middot; {rec.date}
                                </p>
                            </div>
                            <Badge variant={
                                rec.status === 'transcribed' ? 'success' :
                                    rec.status === 'transcribing' ? 'progress' :
                                        rec.status === 'error' ? 'error' : 'warn'
                            }>
                                {b(rec.status)}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Development Notice Popup */}
            {showDevNotice && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a]/90 dark:bg-white/80 text-white dark:text-[#1a1a1a] px-5 py-2.5 rounded-full text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {t('devMode')}
                </div>
            )}
            {/* Survey Dialog Overlay */}
            {showSurvey && (
                <SurveyDialog onClose={() => setShowSurvey(false)} />
            )}
        </div>
    );
}
