'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, LogOut } from 'lucide-react';

export default function ProfilePage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();
    const { profile } = useAppContext();

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in">
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
                <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-[1px]">{t('sectionContact')}</h2>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <ProfileRow icon={Mail} label={t('emailLabel')} value={profile.email} />
                </div>
                <div className="bg-bg-card rounded-[12px] overflow-hidden">
                    <ProfileRow icon={Phone} label={t('phoneLabel')} value={profile.phone} />
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
