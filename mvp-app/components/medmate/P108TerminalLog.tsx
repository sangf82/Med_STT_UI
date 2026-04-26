/** pen rmCmK · Terminal/Log (QeTjm) */
import { cn } from '@/lib/utils';

export type P108TerminalLogProps = {
  value: string;
  className?: string;
  /** max height scroll */
  maxHeight?: string | number;
};

export function P108TerminalLog({ value, className, maxHeight = 220 }: P108TerminalLogProps) {
  const mh = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
  return (
    <pre
      className={cn(
        'overflow-auto rounded-lg bg-[#0F172A] p-4 font-mono text-xs leading-relaxed text-slate-100',
        className
      )}
      style={{ maxHeight: mh }}
    >
      {value || '—'}
    </pre>
  );
}
