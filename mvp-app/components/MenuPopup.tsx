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
        <div className="fixed inset-0 z-50 flex fade-in pointer-events-auto max-w-md mx-auto relative">
            <div className="absolute inset-0 bg-bg-overlay" onClick={onClose} />
            <div className="absolute top-[50px] right-4 w-[200px] bg-bg-card rounded-[12px] shadow-xl border border-border overflow-hidden flex flex-col py-2 origin-top-right">
                <button
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-surface text-[14px] font-medium text-text-primary text-left focus-visible:outline-none focus-visible:bg-bg-surface"
                    onClick={() => { onClose(); onRename(); }}
                >
                    <Pencil className="w-4 h-4 text-text-hint" />
                    <span>{t('rename')}</span>
                </button>
                <div className="h-[1px] bg-divider mx-4 my-1" />
                <button
                    className="flex items-center gap-3 px-4 py-3 hover:bg-error-bg text-[14px] font-medium text-danger text-left focus-visible:outline-none focus-visible:bg-error-bg"
                    onClick={() => { onClose(); onDelete(); }}
                >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('delete')}</span>
                </button>
            </div>
        </div>
    );
}
