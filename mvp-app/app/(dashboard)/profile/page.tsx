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
        <div className="flex flex-col min-h-screen bg-bg-page text-text-primary fade-in pb-10">
            <Header title={t('profile')} onBack={() => router.back()} />

            {/* Avatar + Name */}
            <div className="flex flex-col items-center mt-4 mb-8 px-4">
                <div className="w-[80px] h-[80px] rounded-full bg-accent-blue text-white flex items-center justify-center text-[28px] font-bold shadow-md">
                    {profile.initials}
                </div>
                <h1 className="text-[20px] font-bold mt-4">{profile.name}</h1>
            </div>

            <div className="flex flex-col gap-[24px] px-4">
                {/* Personal Info Section */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-wide px-2 py-1">{t('sectionPersonalInfo')}</h2>
                    <div className="bg-bg-card rounded-[16px] shadow-card overflow-hidden divide-y divide-divider">
                        <ProfileRow icon={User} label={t('fullName')} value={profile.name} />
                    </div>
                </section>

                {/* Contact Section */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-[12px] font-bold text-accent-orange uppercase tracking-wide px-2 py-1">{t('sectionContact')}</h2>
                    <div className="bg-bg-card rounded-[16px] shadow-card overflow-hidden divide-y divide-divider">
                        <ProfileRow icon={Mail} label={t('emailLabel')} value={profile.email} />
                        <ProfileRow icon={Phone} label={t('phoneLabel')} value={profile.phone} />
                    </div>
                </section>
            </div>

            {/* Sign Out Button */}
            <div className="mt-auto px-6 pb-8 pt-10">
                <button
                    onClick={() => router.push('/login')}
                    className="w-full h-[52px] rounded-[12px] border border-danger text-danger flex items-center justify-center gap-2 font-bold text-[16px] hover:bg-error-bg active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2"
                >
                    <LogOut className="w-5 h-5" />
                    <span>{t('signOut')}</span>
                </button>
            </div>
        </div>
    );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between px-4 py-[14px] bg-bg-card">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-text-secondary shrink-0" />
                <span className="text-[15px] font-medium text-text-primary">{label}</span>
            </div>
            <span className="text-[13px] text-text-muted font-medium">{value}</span>
        </div>
    );
}
