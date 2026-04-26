/** pen rmCmK · Recording/FAB (aySV0) */
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type P108RecordingFabProps = {
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function P108RecordingFab({
  active,
  onClick,
  disabled,
  className,
  'aria-label': ariaLabel = 'Ghi âm',
}: P108RecordingFabProps) {
  return (
    <Button
      type="button"
      size="icon-lg"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        'size-14 rounded-full shadow-[0_4px_16px_rgba(251,138,10,0.25)]',
        active && 'ring-2 ring-secondary ring-offset-2',
        className
      )}
    >
      <Mic className="size-6" aria-hidden />
    </Button>
  );
}
