import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-[6px] w-full">
                {label && (
                    <label className="text-[13px] font-semibold text-text-secondary">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-[52px] w-full rounded-[12px] px-4 text-[15px] bg-bg-input border border-border-input transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-text-hint text-text-primary",
                        error && "border-danger bg-error-bg animate-shake",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <div className="flex items-center gap-[6px] mt-1 bg-error-bg border border-error-border rounded-[8px] p-[8px_12px] text-error-text text-[12px]">
                        <AlertCircle className="w-[14px] h-[14px]" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
