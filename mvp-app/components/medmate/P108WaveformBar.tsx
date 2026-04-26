/** pen rmCmK · waveSection / waveRow */
import { cn } from '@/lib/utils';

export type P108WaveformBarProps = {
  /** 0–1 heights for bars (default animated idle) */
  levels?: number[];
  active?: boolean;
  timerLabel?: string;
  className?: string;
};

const DEFAULT_LEVELS = [0.35, 0.55, 0.4, 0.7, 0.45, 0.8, 0.5, 0.65, 0.4, 0.55, 0.35, 0.6];

export function P108WaveformBar({ levels = DEFAULT_LEVELS, active, timerLabel, className }: P108WaveformBarProps) {
  return (
    <div className={cn('flex items-end gap-1 rounded-md border border-border bg-muted/50 px-3 py-2', className)}>
      <div className="flex h-10 flex-1 items-end justify-between gap-0.5">
        {levels.map((h, i) => (
          <span
            key={i}
            className={cn(
              'w-1 rounded-sm bg-primary/70 transition-[height] duration-150',
              active && 'animate-waveform bg-secondary'
            )}
            style={{ height: `${Math.max(0.15, h) * 100}%` }}
          />
        ))}
      </div>
      {timerLabel ? (
        <span className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground">{timerLabel}</span>
      ) : null}
    </div>
  );
}
