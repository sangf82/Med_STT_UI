'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsRowProps {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    rightNode?: React.ReactNode;
    hideChevron?: boolean;
    className?: string;
}

export function SettingsRow({ label, icon: Icon, onClick, rightNode, hideChevron, className }: SettingsRowProps) {
    const Component = onClick ? 'button' : 'div';
    return (
        <Component
            onClick={onClick}
            className={cn(
                'w-full flex items-center justify-between px-5 py-[14px] bg-bg-card transition-colors',
                onClick && 'cursor-pointer hover:bg-bg-surface active:bg-bg-page',
                className,
            )}
        >
            <div className="flex items-center gap-3">
                {Icon && <Icon className="w-5 h-5 text-text-secondary shrink-0" />}
                <span className="text-[14px] text-text-primary">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {rightNode}
                {onClick && !hideChevron && (
                    <ChevronRight className="w-4 h-4 text-text-hint" />
                )}
            </div>
        </Component>
    );
}
