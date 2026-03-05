'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface MenuPopupProps {
    open: boolean;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
}

export function MenuPopup({ open, onClose, onRename, onDelete }: MenuPopupProps) {
    const t = useTranslations('Review');

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-auto max-w-md mx-auto">
            <div className="absolute inset-0 bg-transparent" onClick={onClose} />
            <div className="absolute top-[50px] right-4 w-[160px] bg-bg-card rounded-xl shadow-lg border border-border overflow-hidden flex flex-col py-1.5 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <button
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-surface text-[14px] font-medium text-text-primary text-left focus-visible:outline-none focus-visible:bg-bg-surface transition-colors"
                    onClick={() => { onClose(); onRename(); }}
                >
                    <Pencil className="w-[18px] h-[18px] text-text-secondary" strokeWidth={1.5} />
                    <span>{t('rename')}</span>
                </button>
                <div className="h-[1px] bg-divider mx-4 my-1 opacity-50" />
                <button
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-error-bg text-[14px] font-medium text-danger text-left focus-visible:outline-none focus-visible:bg-error-bg transition-colors"
                    onClick={() => { onClose(); onDelete(); }}
                >
                    <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    <span>{t('delete')}</span>
                </button>
            </div>
        </div>
    );
}
