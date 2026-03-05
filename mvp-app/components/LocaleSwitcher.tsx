'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALES = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
] as const;

export interface LocaleSwitcherProps {
    variant?: 'outline' | 'filled';
}

export default function LocaleSwitcher({ variant = 'outline' }: LocaleSwitcherProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LOCALES.find(l => l.value === locale) ?? LOCALES[0];

    const handleSelect = useCallback((value: string) => {
        setOpen(false);
        if (value === locale) return;
        startTransition(() => {
            document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000`;
            router.refresh();
        });
    }, [locale, router, startTransition]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                disabled={isPending}
                className={cn(
                    "flex items-center rounded-[8px] cursor-pointer focus-visible:outline-none disabled:opacity-50 transition-colors",
                    variant === 'outline'
                        ? "gap-1.5 bg-transparent text-[13px] font-medium text-text-primary py-1.5 pl-3 pr-2.5 border border-border hover:bg-bg-surface"
                        : "gap-1 bg-highlight-bg text-[13px] font-semibold text-accent-blue py-1 pl-3 pr-2 border-none hover:opacity-90"
                )}
            >
                {variant === 'outline' && <Globe className="w-4 h-4 text-text-secondary" />}
                <span>{current.label}</span>
                <ChevronDown className={cn(
                    "transition-transform",
                    open ? 'rotate-180' : '',
                    variant === 'outline' ? "w-3.5 h-3.5 text-text-secondary" : "w-4 h-4 text-accent-blue"
                )} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 min-w-[140px] bg-bg-card rounded-[12px] border border-border shadow-card py-1 z-50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    {LOCALES.map(l => (
                        <button
                            key={l.value}
                            type="button"
                            onClick={() => handleSelect(l.value)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors ${l.value === locale
                                    ? 'text-accent-blue bg-accent-blue/10 dark:bg-accent-blue/20'
                                    : 'text-text-primary hover:bg-bg-surface'
                                }`}
                        >
                            <span>{l.label}</span>
                            {l.value === locale && <Check className="w-4 h-4 text-accent-blue" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
