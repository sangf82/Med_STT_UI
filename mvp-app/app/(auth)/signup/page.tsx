'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { PasswordStrength } from '@/components/PasswordStrength';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Stethoscope } from 'lucide-react';

function SignUpContent() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read error state from URL via ?error=weak_password or ?error=mismatch
    const errorParam = searchParams.get('error');

    const [phone, setPhone] = useState(errorParam ? '+1 (555) 123-4567' : '');
    const [name, setName] = useState(errorParam ? 'Dr. Sarah Chen' : '');
    const [email, setEmail] = useState(errorParam ? 's.chen@memorial.org' : '');
    const [password, setPassword] = useState(errorParam === 'weak_password' ? 'abc' : errorParam === 'mismatch' ? 'StrongP@ss1' : '');
    const [confirmPassword, setConfirmPassword] = useState(errorParam === 'mismatch' ? '••••••' : '');

    const passwordError = errorParam === 'weak_password' ? t('errWeakPassword') : undefined;
    const confirmPasswordError = errorParam === 'mismatch' ? t('errMismatch') : undefined;

    // Simple strength calc
    const getPasswordScore = (pass: string) => {
        if (!pass) return 0;
        if (pass.length < 5) return 1;
        if (pass.length < 8) return 2;
        return 3;
    };

    const score = getPasswordScore(password);
    const isDisabled = !!passwordError || !!confirmPasswordError || !phone || !name || !email || !password || !confirmPassword;

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();

        // Simulate error paths for demo
        if (password === 'abc') {
            router.push('/signup?error=weak_password');
            return;
        }

        if (password !== confirmPassword) {
            router.push('/signup?error=mismatch');
            return;
        }

        // Default success
        router.push('/login');
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-card text-text-primary px-[32px] pt-[40px] pb-[30px] relative fade-in overflow-y-auto max-w-md mx-auto w-full">
            {/* Top right language switcher */}
            <div className="absolute top-[24px] right-[32px]">
                <LocaleSwitcher />
            </div>

            <div className="flex flex-col items-center gap-2 mb-8 mt-4">
                <Stethoscope className="w-[44px] h-[44px] text-accent-blue" />
                <h1 className="text-[24px] font-bold text-accent-blue leading-tight">{t('createAccount')}</h1>
                <p className="text-[13px] text-text-muted mt-1">{t('join')}</p>
            </div>

            <form className="flex flex-col gap-[16px]" onSubmit={handleSignUp}>
                <Input
                    label={t('phone')}
                    placeholder={t('phonePlaceholder')}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                />
                <Input
                    label={t('fullName')}
                    placeholder="Dr. First Last"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <Input
                    label={t('email')}
                    placeholder="you@hospital.org"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                <div className="flex flex-col gap-2">
                    <Input
                        label={t('createStrong')}
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        error={passwordError}
                    />
                    <PasswordStrength score={score} label={score === 3 ? t('strongPassword') : undefined} />
                </div>

                <Input
                    label={t('confirmPassword')}
                    type="password"
                    placeholder={t('repeatPassword')}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    error={confirmPasswordError}
                />

                <Button type="submit" className="mt-4" disabled={isDisabled}>{t('createAccount')}</Button>

                <ComplianceFooter />
            </form>

            <div className="mt-8 text-center text-[13px] text-text-muted whitespace-nowrap">
                {t('alreadyHave')}{' '}<button type="button" onClick={() => router.push('/login')} className="text-accent-blue font-semibold hover:underline underline-offset-4">{t('signIn')}</button>
            </div>
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-page" />}>
            <SignUpContent />
        </Suspense>
    )
}
