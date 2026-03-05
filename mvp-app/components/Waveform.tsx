'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface WaveformProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    paused?: boolean;
    barCount?: number;
    pastBars?: number; // Number of bars to show as past (solid white)
    newBars?: number;  // Number of bars relative to playhead (red/animated)
}

export function Waveform({
    active = false,
    paused = false,
    barCount = 60,
    pastBars = 0,
    newBars = 0,
    className,
    ...props
}: WaveformProps) {
    // Generate random heights for the waveform
    const [heights, setHeights] = React.useState<number[]>([])

    React.useEffect(() => {
        // Deterministic random heights for consistent look
        const newHeights = Array.from({ length: 60 }).map((_, i) => {
            const base = 20 + Math.abs(Math.sin(i * 0.4) * 60) + (i % 3) * 10
            return Math.min(Math.max(base, 10), 100)
        })
        setHeights(newHeights)
    }, [])

    if (heights.length === 0) return <div className={cn("h-[100px] w-full bg-waveform-bg", className)} />

    return (
        <div
            className={cn("w-full h-[120px] bg-[#2E2E2E] flex items-center justify-center gap-[2px] overflow-hidden px-4 relative", className)}
            {...props}
        >
            {/* Bars */}
            <div className="flex items-center gap-[2px] h-[80%] max-w-full">
                {Array.from({ length: barCount }).map((_, i) => {
                    const height = heights[i % heights.length];

                    let barClass = "bg-waveform-dim"; // Default dim/paused
                    let isAnimated = false;

                    if (active && !paused) {
                        barClass = "bg-white"; // Standard active recording
                        isAnimated = true;
                    } else if (paused) {
                        barClass = "bg-waveform-dim";
                    }

                    // Specific resume logic (C3: Continue Recording)
                    if (pastBars > 0 || newBars > 0) {
                        if (i < pastBars) {
                            barClass = "bg-white"; // Past audio
                            isAnimated = false;
                        } else if (i === pastBars) {
                            // Playhead - rendered absolutely later, so skip this spot or render dim
                            barClass = "bg-transparent";
                        } else if (i > pastBars && i <= pastBars + newBars) {
                            barClass = "bg-danger"; // New audio
                            isAnimated = active && !paused;
                        } else {
                            barClass = "bg-transparent"; // Future/hidden
                        }
                    }

                    return (
                        <div
                            key={i}
                            className={cn(
                                "w-[3px] rounded-[1.5px] transition-all duration-300",
                                barClass,
                                isAnimated && "animate-waveform origin-center"
                            )}
                            style={{
                                height: `${height}%`,
                                animationDelay: isAnimated ? `${i * 0.05}s` : '0s'
                            }}
                        />
                    )
                })}
            </div>

            {/* Playhead for Continue Recording state */}
            {(pastBars > 0 || newBars > 0) && (
                <div
                    className="absolute w-[2px] h-[80%] bg-danger z-10"
                    style={{
                        left: `calc(1rem + ${pastBars * 5}px)` // Roughly calc position: px-4 (1rem) + 3px bar + 2px gap
                    }}
                />
            )}
        </div>
    )
}
