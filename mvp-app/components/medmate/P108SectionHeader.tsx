/** pen rmCmK · Section Header (lmVRH) */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type P108SectionHeaderProps = {
  children: ReactNode;  className?: string;
};

export function P108SectionHeader({ children, className }: P108SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center border border-[#E2E8F0] bg-white px-6 py-3.5 text-center text-sm font-semibold text-foreground',
        className
      )}
      style={{
        fontFamily: 'var(--font-p108-newsreader), "Newsreader", ui-serif, Georgia, serif',
      }}
    >
      {children}
    </div>
  );
}
