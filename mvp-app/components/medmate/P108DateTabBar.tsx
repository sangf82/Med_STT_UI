/** pen rmCmK · Date Tab Bar (XU4lj) */
import { cn } from '@/lib/utils';

export type P108DateTab = { id: string; label: string };

export type P108DateTabBarProps = {
  tabs: P108DateTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function P108DateTabBar({ tabs, activeId, onChange, className }: P108DateTabBarProps) {
  return (
    <div
      role="tablist"
      className={cn('flex flex-wrap gap-1 rounded-lg border border-[#E2E8F0] bg-white p-2.5', className)}
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
