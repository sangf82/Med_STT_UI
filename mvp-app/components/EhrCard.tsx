import { cn } from '@/lib/utils';

export interface EhrCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function EhrCard({ title, children, className }: EhrCardProps) {
    return (
        <div className={cn('bg-bg-card rounded-[16px] shadow-card border border-border overflow-hidden flex flex-col', className)}>
            <div className="bg-bg-surface px-4 py-2 border-b border-border flex items-center">
                <h3 className="text-[12px] font-bold text-accent-orange uppercase tracking-wide">{title}</h3>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
                {children}
            </div>
        </div>
    );
}

export interface EhrRowProps {
    label: string;
    value: string;
}

export function EhrRow({ label, value }: EhrRowProps) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-[13px] font-semibold text-text-secondary min-w-[100px] shrink-0">{label}</span>
            <span className="text-[13px] font-medium text-text-primary text-right">{value}</span>
        </div>
    );
}
