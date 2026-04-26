/** pen rmCmK · toastSection */
import { cn } from '@/lib/utils';

export type P108ToastTone = 'default' | 'success' | 'destructive';

export type P108ToastProps = {
  title?: string;
  description?: string;
  tone?: P108ToastTone;
  className?: string;
};

const toneClass: Record<P108ToastTone, string> = {
  default: 'border-border bg-card text-card-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20',
};

export function P108Toast({ title, description, tone = 'default', className }: P108ToastProps) {
  return (
    <div
      role="status"
      className={cn('rounded-lg border px-4 py-3 text-sm shadow-sm', toneClass[tone], className)}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {description ? <p className={cn('text-muted-foreground', title && 'mt-1')}>{description}</p> : null}
    </div>
  );
}
