import * as React from "react"
import { Play, Pause, Square } from 'lucide-react'
import { cn } from "@/lib/utils"

export interface RecordingControlsProps {
    state: 'active' | 'paused' | 'resume';
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
    className?: string;
}

export function RecordingControls({ state, onPause, onResume, onStop, className }: RecordingControlsProps) {
    const isActive = state === 'active' || state === 'resume';

    return (
        <div className={cn("flex flex-row items-center justify-between px-[40px] w-full", className)}>
            {/* Left button — Play (subtle when active, blue when paused) */}
            <div className="w-[52px] h-[52px]">
                <button
                    className={cn(
                        "w-[52px] h-[52px] rounded-full flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        isActive
                            ? "bg-ctrl-btn-bg text-ctrl-btn-icon opacity-50 cursor-default"
                            : "bg-accent-blue text-white hover:opacity-80"
                    )}
                    aria-label="Play"
                    disabled={isActive}
                >
                    <Play className="w-6 h-6 fill-current translate-x-[1px]" />
                </button>
            </div>

            {/* Center button — Pause (active) or Resume/Record (paused) */}
            {isActive ? (
                <button
                    onClick={onPause}
                    className="w-[72px] h-[72px] rounded-full bg-white border-[3px] border-ctrl-btn-icon flex items-center justify-center transition-transform active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label="Pause"
                >
                    <div className="w-[52px] h-[52px] rounded-full bg-ctrl-btn-bg flex items-center justify-center text-ctrl-btn-icon">
                        <Pause className="w-6 h-6 fill-current" />
                    </div>
                </button>
            ) : (
                <button
                    onClick={onResume}
                    className="w-[72px] h-[72px] rounded-full bg-white border-[3px] border-danger flex items-center justify-center transition-transform active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label="Resume Recording"
                >
                    <div className="w-[52px] h-[52px] rounded-full bg-danger" />
                </button>
            )}

            {/* Right button — Stop */}
            <button
                onClick={onStop}
                className="w-[52px] h-[52px] rounded-full bg-ctrl-btn-bg flex items-center justify-center text-ctrl-btn-icon transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:opacity-80"
                aria-label="Stop"
            >
                <Square className="w-5 h-5 fill-current" />
            </button>
        </div>
    )
}
