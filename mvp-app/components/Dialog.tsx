'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function Dialog({ open, onOpenChange, title, children, className }: DialogProps) {
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-bg-overlay fade-in">
            <div
                className="absolute inset-0"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
            />
            <div
                className={cn(
                    "relative w-full max-w-[340px] bg-save-card-bg rounded-[20px] p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-200",
                    className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                <h2 id="dialog-title" className="text-[20px] font-bold text-text-primary">
                    {title}
                </h2>
                {children}
            </div>
        </div>
    )
}
