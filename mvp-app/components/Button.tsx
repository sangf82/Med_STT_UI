import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "danger" | "ghost" | "outline" | "link";
    size?: "default" | "sm" | "icon" | "fab";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-bold text-[16px] rounded-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98] active:opacity-90",
                    {
                        "bg-accent-blue text-white hover:bg-accent-blue/90": variant === "primary",
                        "bg-danger text-white hover:bg-danger/90": variant === "danger",
                        "bg-transparent text-accent-blue hover:bg-accent-blue/10": variant === "ghost",
                        "border border-border bg-transparent hover:bg-bg-surface text-text-primary": variant === "outline",
                        "bg-transparent underline-offset-4 hover:underline text-accent-blue !font-medium !text-[13px] !p-0 !h-auto": variant === "link",
                        "h-[52px] px-4 w-full": size === "default",
                        "h-9 px-3 rounded-md": size === "sm",
                        "h-10 w-10": size === "icon",
                        "h-[64px] w-[64px] rounded-[32px] !p-0 shadow-[0_4px_16px_rgba(230,57,70,0.35)]": size === "fab",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
