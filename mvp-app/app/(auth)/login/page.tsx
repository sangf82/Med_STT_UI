'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Stethoscope, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { setAuthToken } from '@/lib/auth';

function LoginContent() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setProfile } = useAppContext();

    // Read error state from URL via ?error=wrong_password or ?error=wrong_user
    const errorParam = searchParams.get('error');

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const identifierError = errorParam === 'wrong_user' ? t('errAccountNotFound') : undefined;
    const passwordError = errorParam === 'wrong_password' ? t('errWrongPassword') : undefined;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setGeneralError(null);

        try {
            const data = await apiClient<{ access_token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: identifier,
                    password: password
                })
            });

            if (data.access_token) {
                setAuthToken(data.access_token);
                
                // Fetch user profile after login to populate context
                try {
                    const userProfile = await apiClient<any>('/auth/me');
                    setProfile({
                        name: userProfile.name || 'User',
                        initials: (userProfile.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                        specialty: userProfile.role || 'Doctor',
                        hospital: 'Memorial Hospital', // Default or fetch if available
                        email: userProfile.email || '',
                        phone: userProfile.phone || '',
                        npi: userProfile.npi || '1234567890'
                    });
                    console.log('Logged in as:', userProfile.name);
                } catch (profileErr) {
                    console.error('Failed to fetch profile', profileErr);
                }

                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('Login failed:', error);
            
            if (error.status === 401) {
                // If it's 401, it's either wrong email or wrong password
                // The API doesn't specify which, so we could show a general "Invalid credentials"
                // or use the existing error params for specific mock-like behavior if desired.
                setGeneralError(t('errWrongPassword')); 
            } else if (error.status === 422) {
                setGeneralError('Invalid email format or data.');
            } else {
                setGeneralError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
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
                {generalError && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                        {generalError}
                    </div>
                )}
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

                <Button type="submit" className="mt-4" disabled={isLoading}>
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('signIn')}...
                        </div>
                    ) : (
                        t('signIn')
                    )}
                </Button>

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
