'use client';

import { Pencil, Trash2, Repeat2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface MenuPopupProps {
    open: boolean;
    onClose: () => void;
    onRename: () => void;
    /** Pen D4: Convert row (repeat icon) */
    onConvert?: () => void;
    convertDisabled?: boolean;
    onDelete: () => void;
}

export function MenuPopup({
    open,
    onClose,
    onRename,
    onConvert,
    convertDisabled = false,
    onDelete,
}: MenuPopupProps) {
    const t = useTranslations('Review');

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-auto max-w-md mx-auto">
            <div className="absolute inset-0 bg-transparent" onClick={onClose} />
            <div className="absolute top-[50px] right-4 min-w-[159px] w-max max-w-[220px] bg-bg-card rounded-xl shadow-lg border border-border overflow-hidden flex flex-col py-1.5 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-[14px] font-normal text-text-primary text-left focus-visible:outline-none focus-visible:bg-bg-surface transition-colors w-full"
                    onClick={() => { onClose(); onRename(); }}
                >
                    <Pencil className="w-[18px] h-[18px] text-text-primary shrink-0" strokeWidth={1.5} />
                    <span>{t('rename')}</span>
                </button>
                <div className="h-px bg-border mx-4" />
                {onConvert ? (
                    <>
                        <button
                            type="button"
                            disabled={convertDisabled}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-[14px] font-normal text-text-primary text-left focus-visible:outline-none focus-visible:bg-bg-surface transition-colors w-full disabled:opacity-40 disabled:pointer-events-none"
                            onClick={() => {
                                if (convertDisabled) return;
                                onClose();
                                onConvert();
                            }}
                        >
                            <Repeat2 className="w-[18px] h-[18px] text-text-primary shrink-0" strokeWidth={1.5} />
                            <span>Convert</span>
                        </button>
                        <div className="h-px bg-border mx-4" />
                    </>
                ) : null}
                <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-error-bg text-[14px] font-normal text-danger text-left focus-visible:outline-none focus-visible:bg-error-bg transition-colors w-full"
                    onClick={() => { onClose(); onDelete(); }}
                >
                    <Trash2 className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                    <span>{t('delete')}</span>
                </button>
            </div>
        </div>
    );
}
