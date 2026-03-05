'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Stethoscope } from 'lucide-react';

function LoginContent() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read error state from URL via ?error=wrong_password or ?error=wrong_user
    const errorParam = searchParams.get('error');

    const [identifier, setIdentifier] = useState(errorParam === 'wrong_password' ? 'dr.chen@memorial.org' : errorParam === 'wrong_user' ? 'unknown@email.com' : '');
    const [password, setPassword] = useState('');

    const identifierError = errorParam === 'wrong_user' ? t('errAccountNotFound') : undefined;
    const passwordError = errorParam === 'wrong_password' ? t('errWrongPassword') : undefined;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Simulate error paths for demo
        if (identifier === 'admin') {
            router.push('/dashboard');
            return;
        }

        if (identifier === 'unknown@email.com') {
            router.push('/login?error=wrong_user');
            return;
        }

        if (password === 'wrong') {
            router.push('/login?error=wrong_password');
            return;
        }

        // Default success
        router.push('/dashboard');
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-card text-text-primary fade-in max-w-md mx-auto w-full">
            {/* Language bar (48px) matching design langBar */}
            <div className="flex items-center justify-end h-[48px] px-4 shrink-0">
                <LocaleSwitcher />
            </div>

            {/* Logo area with generous spacing like design */}
            <div className="flex flex-col items-center gap-2 mt-[40px] mb-[48px]">
                <Stethoscope className="w-[56px] h-[56px] text-accent-blue" />
                <h1 className="text-[30px] font-bold leading-tight"><span className="text-accent-blue">Med</span><span className="text-accent-orange">Mate</span></h1>
                <p className="text-[14px] text-text-muted mt-1">{t('subtitle')}</p>
            </div>

            <form className="flex flex-col gap-[18px] px-[32px]" onSubmit={handleLogin}>
                <Input
                    label={t('phoneEmail')}
                    placeholder={t('phoneEmailPlaceholder')}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    error={identifierError}
                />
                <Input
                    label={t('password')}
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={passwordError}
                />

                <div className="flex justify-between items-center mt-1">
                    <Checkbox label={t('rememberMe')} className="shrink-0" />
                    <button type="button" className="text-[13px] font-medium text-accent-blue hover:underline underline-offset-4 whitespace-nowrap" onClick={(e) => { e.preventDefault() }}>{t('forgotPassword')}</button>
                </div>

                <Button type="submit" className="mt-4">{t('signIn')}</Button>

                <ComplianceFooter />
            </form>

            <div className="mt-auto mb-[32px] text-center text-[13px] text-text-muted whitespace-nowrap">
                {t('noAccount')}{' '}<button type="button" onClick={() => router.push('/signup')} className="text-accent-blue font-semibold hover:underline underline-offset-4">{t('signUp')}</button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg-page" />}>
            <LoginContent />
        </Suspense>
    )
}
