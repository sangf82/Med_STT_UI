import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "success" | "warn" | "progress" | "default";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-[10px] px-[10px] py-[4px] text-[11px] font-semibold transition-colors",
                {
                    "bg-badge-success-bg text-badge-success": variant === "success",
                    "bg-badge-warn-bg text-badge-warn": variant === "warn",
                    "bg-badge-progress-bg text-badge-progress": variant === "progress",
                    "bg-bg-surface text-text-secondary": variant === "default",
                },
                className
            )}
            {...props}
        />
    )
}

export { Badge }
