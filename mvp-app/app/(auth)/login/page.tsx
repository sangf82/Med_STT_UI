'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Stethoscope, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { setAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

function LoginContent() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setProfile } = useAppContext();

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
          password: password,
        }),
      });

      if (data.access_token) {
        setAuthToken(data.access_token);

        try {
          const userProfile = await apiClient<{
            name?: string;
            role?: string;
            email?: string;
            phone?: string;
            npi?: string;
          }>('/auth/me');
          setProfile({
            name: userProfile.name || 'User',
            initials: (userProfile.name || 'U')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2),
            specialty: userProfile.role || 'Doctor',
            hospital: 'Memorial Hospital',
            email: userProfile.email || '',
            phone: userProfile.phone || '',
            npi: userProfile.npi || '1234567890',
          });
        } catch (profileErr) {
          console.error('Failed to fetch profile', profileErr);
        }

        const raw = searchParams.get('returnUrl');
        const next = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/pilot108/stt-upload';
        router.push(next);
      }
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const err = error as { status?: number };
      if (err.status === 401) {
        setGeneralError(t('errWrongPassword'));
      } else if (err.status === 422) {
        setGeneralError('Invalid email format or data.');
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in mx-auto flex min-h-screen w-full max-w-md flex-col bg-card text-foreground">
      <div className="flex h-12 shrink-0 items-center justify-end px-4">
        <LocaleSwitcher />
      </div>

      <div className="mb-12 mt-10 flex flex-col items-center gap-2">
        <Stethoscope className="h-14 w-14 text-primary" />
        <h1 className="text-[30px] font-bold leading-tight">
          <span className="text-primary">Med</span>
          <span className="text-secondary">Mate</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card className="mx-4 border-0 shadow-none ring-0">
        <CardContent className="px-8 pb-8 pt-0">
          <form className="flex flex-col gap-[18px]" onSubmit={handleLogin}>
            {generalError ? (
              <Alert variant="destructive">
                <AlertTitle>{t('signIn')}</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="login-id">{t('phoneEmail')}</Label>
              <Input
                id="login-id"
                placeholder={t('phoneEmailPlaceholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-invalid={!!identifierError}
                className="h-10"
              />
              {identifierError ? <p className="text-xs text-destructive">{identifierError}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-pw">{t('password')}</Label>
              <Input
                id="login-pw"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                className="h-10"
              />
              {passwordError ? <p className="text-xs text-destructive">{passwordError}</p> : null}
            </div>

            <div className="mt-1 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox defaultChecked={false} />
                <span>{t('rememberMe')}</span>
              </label>
              <button
                type="button"
                className="whitespace-nowrap text-[13px] font-medium text-primary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>

            <Button type="submit" className="mt-4 h-11 w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('signIn')}…
                </span>
              ) : (
                t('signIn')
              )}
            </Button>

            <ComplianceFooter />
          </form>
        </CardContent>
      </Card>

      <div className="mt-auto mb-8 whitespace-nowrap text-center text-[13px] text-muted-foreground">
        {t('noAccount')}{' '}
        <button
          type="button"
          onClick={() => router.push('/signup')}
          className={cn('font-semibold text-primary underline-offset-4 hover:underline')}
        >
          {t('signUp')}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
