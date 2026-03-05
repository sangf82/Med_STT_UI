import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <label className="flex items-center gap-[10px] cursor-pointer whitespace-nowrap">
                <input
                    type="checkbox"
                    className={cn(
                        "w-[18px] h-[18px] rounded-[4px] border-[1.5px] border-border accent-accent-blue cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {label && (
                    <span className="text-[13px] text-text-secondary">
                        {label}
                    </span>
                )}
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
