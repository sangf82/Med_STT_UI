import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from 'lucide-react'

export interface BottomBarItem {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}

export interface BottomBarProps {
    items: BottomBarItem[];
    className?: string;
}

export function BottomBar({ items, className }: BottomBarProps) {
    return (
        <div className={cn("fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[80px] bg-bg-card border-t border-border flex flex-row items-center px-4 pb-4 select-none z-10", className)}>
            {items.map((item, i) => (
                <button
                    key={i}
                    onClick={item.onClick}
                    className="flex-1 flex flex-col items-center justify-center gap-[4px] h-full text-text-muted transition-colors hover:text-text-primary active:scale-95 focus-visible:outline-none"
                >
                    <item.icon className="w-[20px] h-[20px]" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    )
}
