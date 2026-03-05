'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { PasswordStrength } from '@/components/PasswordStrength';
import { Stethoscope, ChevronLeft } from 'lucide-react';

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
        <div className="flex flex-col min-h-screen bg-bg-card text-text-primary relative fade-in overflow-y-auto max-w-md mx-auto w-full">
            {/* Header bar: back + language (48px) */}
            <div className="flex items-center justify-between h-[48px] px-4 shrink-0">
                <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-surface active:scale-95 transition-all text-text-primary"
                    aria-label="Back"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <LocaleSwitcher />
            </div>

            {/* Content: logo + form */}
            <div className="flex flex-col items-center flex-1 px-[32px] pb-[30px] gap-[24px]">
                <div className="flex flex-col items-center gap-[6px]">
                    <Stethoscope className="w-[44px] h-[44px] text-accent-blue" />
                    <h1 className="text-[24px] font-bold text-accent-blue leading-tight">{t('createAccount')}</h1>
                    <p className="text-[13px] text-text-muted">{t('join')}</p>
                </div>

                <form className="flex flex-col gap-[16px] w-full" onSubmit={handleSignUp}>
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

                    <div className="flex flex-col gap-1">
                        <Input
                            label={t('password')}
                            type="password"
                            placeholder={t('createStrong')}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            error={passwordError}
                        />
                        <PasswordStrength
                            score={score}
                            label={
                                score === 1 ? t('weakPassword') :
                                score === 2 ? t('mediumPassword') :
                                score === 3 ? t('strongPassword') : undefined
                            }
                        />
                    </div>

                    <Input
                        label={t('confirmPassword')}
                        type="password"
                        placeholder={t('repeatPassword')}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        error={confirmPasswordError}
                    />

                    <Button type="submit" disabled={isDisabled}>{t('createAccount')}</Button>

                    <div className="text-center text-[13px] whitespace-nowrap">
                        <span className="text-text-muted">{t('alreadyHave')}</span>{' '}<button type="button" onClick={() => router.push('/login')} className="text-accent-blue font-semibold hover:underline underline-offset-4">{t('signIn')}</button>
                    </div>
                </form>
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
