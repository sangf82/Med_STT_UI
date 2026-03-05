'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
    ({ checked, onCheckedChange, className, ...props }, ref) => {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                ref={ref}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    "relative w-[44px] h-[24px] rounded-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0 cursor-pointer",
                    checked ? "bg-toggle-active" : "bg-toggle-bg",
                    className
                )}
                {...props}
            >
                <div
                    className={cn(
                        "absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all duration-200 pointer-events-none",
                        checked ? "left-[22px]" : "left-[2px]"
                    )}
                />
            </button>
        )
    }
)
Toggle.displayName = "Toggle"
