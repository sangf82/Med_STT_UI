/** pen rmCmK · chipSection / chipRow */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type P108StatusChipProps = {
  label: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  tone?: 'draft' | 'finalized' | 'info';
  testId?: string;
};

export function P108StatusChip({ label, className, variant = 'outline', tone, testId }: P108StatusChipProps) {
  const toneClass =
    tone === 'finalized'
      ? 'border-transparent bg-[#22C55E15] text-[#16A34A]'
      : tone === 'draft'
        ? 'border-transparent bg-[#EAB30815] text-[#CA8A04]'
        : tone === 'info'
          ? 'border-transparent bg-[#0EA5E915] text-[#0369A1]'
          : '';
  return (
    <Badge
      data-testid={testId}
      variant={variant}
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
        toneClass,
        className,
      )}
    >
      {label}
    </Badge>
  );
}
