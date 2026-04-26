/** pen rmCmK · Order Item/Default · Order Item/Checked */
import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type P108OrderRowProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children: ReactNode;
  /** Whole row non-interactive (e.g. cancelled). */
  disabled?: boolean;
  /** Only the checkbox is disabled; label/content stay interactive (e.g. draft edit). */
  checkboxDisabled?: boolean;
  className?: string;
  /** Classes for the text wrapper (e.g. body font size). */
  contentClassName?: string;
};

export function P108OrderRow({
  checked,
  onCheckedChange,
  children,
  disabled,
  checkboxDisabled,
  className,
  contentClassName,
}: P108OrderRowProps) {
  const checkboxIsDisabled = disabled || checkboxDisabled;
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border border-[#E2E8F0] px-4 py-3 transition-colors',
        checked ? 'bg-[#F8FAFC]' : 'bg-white',
        disabled && 'pointer-events-none opacity-60',
        checkboxDisabled && !disabled && 'cursor-default',
        className
      )}
    >
      <Checkbox
        checked={checked}
        disabled={checkboxIsDisabled}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
        className="border-[#E2E8F0] data-checked:border-primary data-checked:bg-primary"
      />
      <span className={cn('min-w-0 flex-1 text-sm text-foreground', contentClassName)}>{children}</span>
    </label>
  );
}
