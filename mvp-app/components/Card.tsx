import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-[16px] bg-bg-card p-4 shadow-card border flex flex-col gap-4 border-transparent text-text-primary",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

export { Card }
