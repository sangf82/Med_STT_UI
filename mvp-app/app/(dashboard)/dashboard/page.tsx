'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Menu, Search, Stethoscope } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useSidebar } from '@/context/SidebarContext';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const a = useTranslations('Auth');
    const b = useTranslations('Badge');
    const router = useRouter();
    const { recordings, profile } = useAppContext();
    const { open: openSidebar } = useSidebar();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col min-h-screen pb-[120px] fade-in">
            {/* Scrollable Header transition (B1 -> B2) */}
            <header
                className={`sticky top-0 z-30 w-full transition-all duration-300 flex items-center justify-between px-4 bg-bg-page ${isScrolled ? 'h-[60px] shadow-sm border-b border-border' : 'h-[72px] pt-4'}`}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={openSidebar}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all text-text-primary"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className={`flex items-center gap-[6px] transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <Stethoscope className="w-[22px] h-[22px] text-accent-blue" />
                        <span className="text-[18px] font-bold text-text-primary leading-none pt-[2px]">MedMate</span>
                    </div>
                </div>

                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all text-text-primary">
                    <Search className="w-5 h-5" />
                </button>
            </header>

            {/* Expanded Hero (B1) */}
            <div className={`px-5 pt-2 pb-6 flex flex-col items-center justify-center text-center transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100'}`}>
                <Stethoscope className="w-[48px] h-[48px] text-accent-blue mb-2" />
                <h1 className="text-[28px] font-bold text-text-primary leading-tight">MedMate</h1>
                <p className="text-[14px] text-text-muted mt-[2px]">{a('subtitle')}</p>
            </div>

            {/* Recording List */}
            <div className="px-4 flex flex-col gap-[10px]">
                <h2 className="text-[13px] font-semibold text-text-muted mb-1 px-1">{t('recent')}</h2>

                {recordings.map(rec => (
                    <Card
                        key={rec.id}
                        className="cursor-pointer hover:border-border hover:bg-bg-surface transition-colors"
                        onClick={() => router.push('/soap')}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-[15px] font-bold text-text-primary leading-tight">{rec.title}</h3>
                                <p className="text-[13px] text-text-muted mt-1">
                                    {rec.format ?? 'None'} &middot; {rec.duration} &middot; {rec.date}
                                </p>
                            </div>
                            <Badge variant={
                                rec.status === 'synced' ? 'success' :
                                    rec.status === 'transcribing' || rec.status === 'saving' || rec.status === 'pending' ? 'progress' :
                                        'warn'
                            }>
                                {rec.status === 'transcribing' && rec.progress
                                    ? `${b('transcribing').replace('...', '')} ${rec.progress}%`
                                    : b(rec.status)}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
