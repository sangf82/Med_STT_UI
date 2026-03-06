'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const TEMPLATES = [
    { value: 'SOAP Note', key: 'formatSoap' },
    { value: 'Clinical Summary', key: 'formatClinical' },
] as const;

export default function TemplateSwitcher() {
    const t = useTranslations('Recording');
    const [template, setTemplate] = useState('SOAP Note');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = TEMPLATES.find(l => l.value === template) ?? TEMPLATES[0];

    const handleSelect = useCallback((value: string) => {
        setTemplate(value);
        setOpen(false);
    }, []);

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
                className="flex items-center gap-1 rounded-[8px] bg-highlight-bg text-[13px] font-semibold text-accent-blue py-1 pl-3 pr-2 border-none hover:opacity-90 cursor-pointer focus-visible:outline-none transition-colors"
            >
                <span>{t(current.key)}</span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-accent-blue transition-transform",
                    open ? 'rotate-180' : ''
                )} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-bg-card rounded-[12px] border border-border shadow-card py-1 z-50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    {TEMPLATES.map(l => (
                        <button
                            key={l.value}
                            type="button"
                            onClick={() => handleSelect(l.value)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors ${l.value === template
                                ? 'text-accent-blue bg-accent-blue/10 dark:bg-accent-blue/20'
                                : 'text-text-primary hover:bg-bg-surface'
                                }`}
                        >
                            <span>{t(l.key)}</span>
                            {l.value === template && <Check className="w-4 h-4 text-accent-blue" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
