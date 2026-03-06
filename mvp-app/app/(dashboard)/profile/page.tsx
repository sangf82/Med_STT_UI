'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, LogOut, Target, CheckCircle2, Loader2, Save } from 'lucide-react';
import { getDailyRequiredCases, updateDailyRequiredCases, getDailyActualCases, updateDailyActualCases } from '@/lib/api/sttMetrics';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();
    const { profile } = useAppContext();

    const [requiredCases, setRequiredCases] = useState<number | null>(null);
    const [actualCases, setActualCases] = useState<number | null>(null);
    const [isEditingRequired, setIsEditingRequired] = useState(false);
    const [isEditingActual, setIsEditingActual] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [reqRes, actualRes] = await Promise.all([
                    getDailyRequiredCases(),
                    getDailyActualCases(todayStr, todayStr) // only today
                ]);
                setRequiredCases(reqRes.daily_required_soap_count || 0);

                const todayActual = actualRes.by_date?.[todayStr] || 0;
                setActualCases(todayActual);
            } catch (err) {
                console.error("Failed to fetch daily cases metrics", err);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [todayStr]);

    const handleSaveRequired = async () => {
        if (requiredCases === null) return;
        setIsEditingRequired(false);
        try {
            await updateDailyRequiredCases(requiredCases);
        } catch (err) {
            console.error("Failed to update required cases", err);
        }
    };

    const handleSaveActual = async () => {
        if (actualCases === null) return;
        setIsEditingActual(false);
        try {
            await updateDailyActualCases(todayStr, actualCases);
        } catch (err) {
            console.error("Failed to update actual cases", err);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in pb-12">
            <Header title={t('profile')} onBack={() => router.back()} />

            {/* Avatar + Name */}
            <div className="flex flex-col items-center gap-[10px] pt-8 pb-6 px-5">
                <div className="w-[80px] h-[80px] rounded-full bg-accent-blue text-white flex items-center justify-center text-[28px] font-bold shadow-md">
                    {profile.initials}
                </div>
                <h1 className="text-[20px] font-bold">{profile.name}</h1>
            </div>

            <div className="flex flex-col gap-[10px] px-5 flex-1">
                {/* Personal Info Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px]">{t('sectionPersonalInfo')}</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <ProfileRow icon={User} label={t('fullName')} value={profile.name} />
                </div>

                <div className="h-[2px]" />

                {/* Contact Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px] mt-4">{t('sectionContact')}</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden flex flex-col gap-px border border-border/10">
                    <ProfileRow icon={Mail} label={t('emailLabel')} value={profile.email} />
                    <ProfileRow icon={Phone} label={t('phoneLabel')} value={profile.phone} />
                </div>

                {/* Metrics 3 Section */}
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px] mt-4">Chỉ tiêu mỗi ngày</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden flex flex-col gap-px border border-border/10">
                    
                    {/* Required Cases */}
                    <div className="flex items-center justify-between px-5 py-[14px]">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-text-secondary shrink-0" />
                            <span className="text-[14px] text-text-primary">Mục tiêu SOAP (ca/ngày)</span>
                        </div>
                        {loadingStats ? <Loader2 className="w-4 h-4 animate-spin text-accent-blue" /> : (
                            isEditingRequired ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={requiredCases || ''} 
                                        onChange={(e) => setRequiredCases(Number(e.target.value))}
                                        className="w-16 bg-bg-page border border-border rounded px-2 py-1 text-sm outline-none"
                                    />
                                    <button onClick={handleSaveRequired} className="p-1 text-accent-blue active:scale-95"><Save className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditingRequired(true)} className="text-[13px] font-bold text-accent-blue hover:underline">
                                    {requiredCases} ca
                                </button>
                            )
                        )}
                    </div>

                    <div className="h-px bg-border/20 mx-4" />

                    {/* Actual Cases Today */}
                    <div className="flex items-center justify-between px-5 py-[14px]">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-text-secondary shrink-0" />
                            <span className="text-[14px] text-text-primary">Số ca thực tế hôm nay</span>
                        </div>
                        {loadingStats ? <Loader2 className="w-4 h-4 animate-spin text-accent-blue" /> : (
                            isEditingActual ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={actualCases || ''} 
                                        onChange={(e) => setActualCases(Number(e.target.value))}
                                        className="w-16 bg-bg-page border border-border rounded px-2 py-1 text-sm outline-none"
                                    />
                                    <button onClick={handleSaveActual} className="p-1 text-accent-blue active:scale-95"><Save className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditingActual(true)} className="text-[13px] font-bold text-accent-blue hover:underline">
                                    {actualCases} ca
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sign Out Button */}
                <button
                    onClick={() => router.push('/login')}
                    className="w-full rounded-[12px] border border-danger text-danger flex items-center justify-center gap-2 font-semibold text-[14px] py-[14px] px-5 hover:bg-error-bg active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 mb-6"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span>{t('signOut')}</span>
                </button>
            </div>
        </div>
    );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between px-5 py-[14px] bg-bg-card">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-text-secondary shrink-0" />
                <span className="text-[14px] text-text-primary">{label}</span>
            </div>
            <span className="text-[13px] text-text-muted">{value}</span>
        </div>
    );
}
