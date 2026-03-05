import * as React from "react"
import { cn } from "@/lib/utils"

export interface PasswordStrengthProps extends React.HTMLAttributes<HTMLDivElement> {
    score: number; // 0 to 3 (0=empty/weak, 1=weak, 2=medium, 3=strong)
    label?: string;
}

export function PasswordStrength({ score, label, className, ...props }: PasswordStrengthProps) {
    if (score === 0) return null;

    let width = "0%";
    let color = "transparent";

    if (score === 1) {
        width = "33%";
        color = "var(--danger)";
    } else if (score === 2) {
        width = "66%";
        color = "var(--accent-orange)";
    } else if (score >= 3) {
        width = "100%";
        color = "var(--badge-success)";
    }

    return (
        <div className={cn("flex flex-col gap-1 w-full", className)} {...props}>
            <div className="h-[4px] w-full bg-strength-track rounded-[2px] overflow-hidden">
                <div
                    className="h-full transition-all duration-300 ease-out rounded-[2px]"
                    style={{ width, backgroundColor: color }}
                />
            </div>
            {label && (
                <span className="text-[11px] font-medium" style={{ color }}>
                    {label}
                </span>
            )}
        </div>
    )
}
