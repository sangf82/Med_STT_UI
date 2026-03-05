'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface SaveDialogProps {
    onCancel: () => void;
    onSave: (name: string, format: string) => void;
}

type FormatKey = 'soap' | 'clinical' | 'none';

export function SaveDialog({ onCancel, onSave }: SaveDialogProps) {
    const t = useTranslations('Recording');
    const defaultName = `Consult ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')}` +
        `_${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '')}`;
    const [name, setName] = useState(defaultName);
    const [format, setFormat] = useState<FormatKey>('soap');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const formatOptions: { key: FormatKey; labelKey: string }[] = [
        { key: 'soap', labelKey: 'formatSoap' },
        { key: 'clinical', labelKey: 'formatClinical' },
        { key: 'none', labelKey: 'formatNone' },
    ];

    const selectedLabel = t(formatOptions.find(o => o.key === format)!.labelKey);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6 bg-bg-overlay fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onCancel} />

            {/* Dialog card — matches C4 design */}
            <div
                className="relative w-full max-w-[340px] bg-save-card-bg flex flex-col"
                style={{
                    borderRadius: 20,
                    padding: '24px 24px 16px 24px',
                }}
            >
                {/* Title */}
                <h2 className="text-[20px] font-bold text-text-primary">
                    {t('saveRecording')}
                </h2>

                {/* Spacer 24px */}
                <div className="h-6" />

                {/* Name input */}
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-[15px] text-text-primary bg-transparent border-b border-b-[#CCCCCC] pb-2 outline-none focus:border-b-accent-blue transition-colors"
                    style={{ lineHeight: '20px' }}
                />

                {/* Spacer 20px */}
                <div className="h-5" />

                {/* Output Format label */}
                <span className="text-[13px] text-text-muted">
                    {t('outputFormat')}
                </span>

                {/* Spacer 4px */}
                <div className="h-1" />

                {/* Format dropdown */}
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1.5 py-1 transition-opacity active:opacity-60"
                    >
                        <span className="text-[16px] font-bold text-text-primary">{selectedLabel}</span>
                        <ChevronDown
                            className={`w-4 h-4 text-text-primary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {dropdownOpen && (
                        <div
                            className="absolute left-0 top-full mt-1 w-[200px] bg-save-card-bg rounded-xl shadow-lg border border-[#E0E0E0] dark:border-[#333] z-10 overflow-hidden"
                        >
                            {formatOptions.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => { setFormat(opt.key); setDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[15px] transition-colors
                                        ${format === opt.key
                                            ? 'text-accent-blue font-semibold bg-[#F0F8FF] dark:bg-[#1A2A3A]'
                                            : 'text-text-primary hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]'
                                        }`}
                                >
                                    {t(opt.labelKey)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Spacer 8px */}
                <div className="h-2" />

                {/* Button row — Cancel | divider | Save */}
                <div className="flex items-center h-[48px]">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-full flex items-center justify-center text-[16px] font-semibold transition-opacity active:opacity-60"
                        style={{ color: '#888888' }}
                    >
                        {t('cancel')}
                    </button>

                    {/* Vertical divider */}
                    <div className="w-[1px] h-5 bg-[#D0D0D0]" />

                    <button
                        onClick={() => onSave(name, format)}
                        className="flex-1 h-full flex items-center justify-center text-[16px] font-bold text-accent-blue transition-opacity active:opacity-60"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
