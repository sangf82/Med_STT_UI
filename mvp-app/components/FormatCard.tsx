'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormatCardProps extends React.HTMLAttributes<HTMLButtonElement> {
    selected?: boolean;
    title: string;
    icon: React.ReactNode;
    iconBgColorClass?: string;
    iconColorClass?: string;
}

export const FormatCard = React.forwardRef<HTMLButtonElement, FormatCardProps>(
    ({ className, selected = false, title, icon, iconBgColorClass, iconColorClass, ...props }, ref) => {
        return (
            <button
                type="button"
                role="radio"
                aria-checked={selected}
                ref={ref}
                className={cn(
                    "w-full rounded-[16px] bg-format-card-bg p-4 flex items-center justify-between text-left transition-all duration-200 border-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    selected
                        ? "border-accent-orange bg-highlight-bg"
                        : "border-format-card-border hover:border-border",
                    className
                )}
                {...props}
            >
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", iconBgColorClass || "bg-section-head-bg")}>
                        <div className={cn(iconColorClass || "text-accent-blue")}>
                            {icon}
                        </div>
                    </div>
                    <span className="text-[13px] font-semibold text-text-primary">{title}</span>
                </div>

                <div className={cn(
                    "w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors",
                    selected ? "border-accent-orange bg-accent-orange" : "border-border"
                )}>
                    {selected && <div className="w-[8px] h-[8px] bg-white rounded-full" />}
                </div>
            </button>
        )
    }
)
FormatCard.displayName = "FormatCard"
