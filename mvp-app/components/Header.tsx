import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"

export interface HeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: React.ReactNode;
    subtitle?: string;
    onBack?: () => void;
    rightNode?: React.ReactNode;
    centerNode?: React.ReactNode;
    leftNode?: React.ReactNode;
}

export function Header({ title, subtitle, onBack, rightNode, centerNode, leftNode, className, ...props }: HeaderProps) {
    return (
        <header className={cn("sticky top-0 z-40 flex items-center min-h-[64px] pt-[5px] px-4 w-full bg-bg-page text-text-primary", className)} {...props}>
            <div className="flex-1 flex items-center justify-start min-w-[40px]">
                {leftNode || (
                    onBack && (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-bg-surface active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2"
                            aria-label="Back"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )
                )}
            </div>

            <div className="flex-[2] flex flex-col items-center justify-center text-center">
                {centerNode || (
                    <>
                        {typeof title === 'string' ? (
                            <span className="text-[17px] font-bold line-clamp-1 leading-tight">{title}</span>
                        ) : title}
                        {subtitle && (
                            <span className="text-[11px] font-medium text-text-muted line-clamp-1">{subtitle}</span>
                        )}
                    </>
                )}
            </div>

            <div className="flex-1 flex items-center justify-end min-w-[40px]">
                {rightNode}
            </div>
        </header>
    )
}
