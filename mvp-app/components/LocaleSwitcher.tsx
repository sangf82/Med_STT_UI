'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const LOCALES = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
] as const;

export default function LocaleSwitcher() {
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
                className="flex items-center gap-1.5 bg-bg-surface text-[13px] font-semibold text-accent-blue py-1.5 pl-3 pr-2 rounded-full cursor-pointer border border-border focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 transition-colors hover:bg-bg-page"
            >
                <span>{current.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 min-w-[140px] bg-bg-card rounded-[12px] border border-border shadow-card py-1 z-50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    {LOCALES.map(l => (
                        <button
                            key={l.value}
                            type="button"
                            onClick={() => handleSelect(l.value)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors ${
                                l.value === locale
                                    ? 'text-accent-blue bg-accent-blue/8'
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
