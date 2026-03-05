'use client';

import * as React from "react"
import { Play, Pause } from 'lucide-react'
import { formatTimeSec } from "@/lib/utils"

export interface AudioPlayerProps {
    duration?: number; // total seconds
    title?: string;
}

export function AudioPlayer({ duration = 154 }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime] = React.useState(93);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-[16px] w-full px-[16px] py-[12px] bg-bg-card">
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="shrink-0 w-[36px] h-[36px] rounded-full bg-accent-blue flex items-center justify-center text-white transition-opacity hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current translate-x-[0.5px]" />
                ) : (
                    <Play className="w-4 h-4 fill-current translate-x-[1px]" />
                )}
            </button>

            <div className="flex flex-col flex-1 gap-[4px] pt-1">
                <div className="relative w-full h-[4px] rounded-full bg-strength-track overflow-hidden cursor-pointer">
                    <div
                        className="absolute top-0 left-0 h-full bg-accent-blue transition-all duration-300 pointer-events-none"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-muted font-medium font-mono pt-[2px]">
                    <span>{formatTimeSec(currentTime)}</span>
                    <span>{formatTimeSec(duration)}</span>
                </div>
            </div>
        </div>
    )
}
