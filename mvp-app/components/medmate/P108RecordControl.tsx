/** pen rmCmK · recSection / recRow */
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type P108RecordControlProps = {
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
};

export function P108RecordControl({ recording, onStart, onStop, disabled, className }: P108RecordControlProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {!recording ? (
        <Button type="button" variant="default" disabled={disabled} onClick={onStart} className="gap-2">
          <Mic className="size-4" aria-hidden />
          Bắt đầu ghi
        </Button>
      ) : (
        <Button type="button" variant="destructive" disabled={disabled} onClick={onStop} className="gap-2">
          <Square className="size-4 fill-current" aria-hidden />
          Dừng
        </Button>
      )}
    </div>
  );
}
