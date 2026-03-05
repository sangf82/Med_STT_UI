import * as React from "react"
import { Play, Pause, Square } from 'lucide-react'
import { cn } from "@/lib/utils"

export type ControlState = 'recording' | 'paused' | 'replaying';

export interface RecordingControlsProps {
    state: ControlState;
    onPause?: () => void;
    onResume?: () => void;
    onReplay?: () => void;
    onPauseReplay?: () => void;
    onSave?: () => void;
    className?: string;
}

export function RecordingControls({
    state,
    onPause,
    onResume,
    onReplay,
    onPauseReplay,
    onSave,
    className,
}: RecordingControlsProps) {
    const isRecording = state === 'recording';
    const isPaused = state === 'paused';
    const isReplaying = state === 'replaying';

    // Left button: Replay / Pause-replay
    // - Disabled during recording
    // - Enabled when paused → starts replay from beginning
    // - During replay → click pauses replay
    const handleLeftClick = () => {
        if (isRecording) return; // disabled
        if (isReplaying) {
            onPauseReplay?.();
        } else if (isPaused) {
            onReplay?.();
        }
    };

    // Center button: Record/Pause toggle
    // - During recording → pause
    // - During paused → resume recording
    // - During replay → disabled
    const handleCenterClick = () => {
        if (isReplaying) return; // disabled
        if (isRecording) {
            onPause?.();
        } else if (isPaused) {
            onResume?.();
        }
    };

    return (
        <div className={cn("flex flex-row items-center justify-between px-[40px] w-full h-[100px]", className)}>
            {/* Left button — Play/Replay (icon only, no background) */}
            <div className="w-[48px] h-[48px] flex items-center justify-center">
                <button
                    onClick={handleLeftClick}
                    disabled={isRecording}
                    className={cn(
                        "w-[48px] h-[48px] flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none",
                        isRecording ? "opacity-30 cursor-default" : "cursor-pointer"
                    )}
                    aria-label={isReplaying ? "Pause Replay" : "Replay"}
                >
                    {isReplaying ? (
                        <Pause
                            className="w-6 h-6"
                            style={{ color: '#219EBC', fill: '#219EBC' }}
                        />
                    ) : (
                        <Play
                            className="w-6 h-6 translate-x-[1px]"
                            style={{
                                color: isRecording ? '#999999' : '#219EBC',
                                fill: isRecording ? '#999999' : '#219EBC',
                            }}
                        />
                    )}
                </button>
            </div>

            {/* Center button — Pause (recording) or Record (paused) */}
            <button
                onClick={handleCenterClick}
                disabled={isReplaying}
                className={cn(
                    "w-[72px] h-[72px] rounded-full flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-none",
                    isReplaying && "opacity-30 cursor-default"
                )}
                style={{ border: '1.5px solid #D0D0D0' }}
                aria-label={isRecording ? 'Pause' : 'Resume Recording'}
            >
                {isRecording ? (
                    /* Pause icon when recording */
                    <Pause className="w-7 h-7" style={{ color: '#333333', fill: '#333333' }} />
                ) : (
                    /* Red dot when paused — ready to resume */
                    <div
                        className="rounded-full bg-danger"
                        style={{ width: 52, height: 52 }}
                    />
                )}
            </button>

            {/* Right button — Save (icon only, no background) */}
            <div className="w-[48px] h-[48px] flex items-center justify-center">
                <button
                    onClick={onSave}
                    className="w-[48px] h-[48px] flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-none cursor-pointer"
                    aria-label="Save"
                >
                    <Square
                        className="w-6 h-6"
                        style={{ color: '#333333', fill: '#333333' }}
                    />
                </button>
            </div>
        </div>
    );
}
