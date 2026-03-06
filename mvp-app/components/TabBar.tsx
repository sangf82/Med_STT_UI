'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface Tab {
    id: string;
    label: string;
}

export interface TabBarProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
    return (
        <div className={cn("flex w-full bg-tab-bg", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center h-[48px] text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                            isActive
                                ? "text-accent-blue border-b-[2.5px] border-accent-blue"
                                : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
