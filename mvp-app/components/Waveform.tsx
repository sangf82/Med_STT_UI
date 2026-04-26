'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface WaveformProps extends React.HTMLAttributes<HTMLDivElement> {
    levels: number[];
    active?: boolean;
    paused?: boolean;
    prePauseLevels?: number;
    replaying?: boolean;
    seekPosition?: number;
    /** Ref to the playing Audio element — Waveform reads currentTime directly */
    audioRef?: React.RefObject<HTMLAudioElement | null>;
    /** Known recording duration in seconds (reliable, unlike audio.duration which can be Infinity for WebM) */
    durationSec?: number;
    onSeek?: (position: number) => void;
}

const BAR_WIDTH = 2;
const BAR_GAP = 2;
const WAVEFORM_HEIGHT = 280;
const BAR_STEP = BAR_WIDTH + BAR_GAP;

export function Waveform({
    levels,
    active = false,
    paused = false,
    prePauseLevels = 0,
    replaying = false,
    seekPosition = 1,
    audioRef,
    durationSec = 0,
    onSeek,
    className,
    ...props
}: WaveformProps) {
    void active;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const stripRef = React.useRef<HTMLDivElement>(null);
    const thumbRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);
    const rafId = React.useRef(0);
    const [halfBars, setHalfBars] = React.useState(40);
    const [layoutWidth, setLayoutWidth] = React.useState(350);
    const [layoutCenterX, setLayoutCenterX] = React.useState(175);
    const centerXRef = React.useRef(175);

    React.useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth;
                const half = w / 2 - 20;
                setHalfBars(Math.floor(half / BAR_STEP));
                const cx = w / 2;
                centerXRef.current = cx;
                setLayoutCenterX(cx);
                setLayoutWidth(w);
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const totalLevels = levels.length;
    const isReviewMode = (paused || replaying) && totalLevels > 0;

    // --- Scrollbar drag ---
    const posFromEvent = React.useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e
            ? (e.touches[0]?.clientX ?? 0)
            : (e as MouseEvent).clientX;
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }, []);

    const handleTrackDown = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDragging.current = true;
        onSeek?.(posFromEvent(e));
    }, [posFromEvent, onSeek]);

    React.useEffect(() => {
        const move = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current) return;
            e.preventDefault();
            onSeek?.(posFromEvent(e));
        };
        const up = () => { isDragging.current = false; };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [posFromEvent, onSeek]);

    // Helper: set strip translateX + thumb position directly via DOM (no React render)
    const applyPosition = React.useCallback((pos: number) => {
        if (!stripRef.current) return;
        const centerX = centerXRef.current;
        const totalW = totalLevels * BAR_STEP;
        const offset = centerX - pos * totalW;
        stripRef.current.style.transform = `translateX(${offset}px)`;
        if (thumbRef.current && trackRef.current) {
            const trackW = trackRef.current.clientWidth;
            const thumbX = Math.max(0, Math.min(trackW - 36, pos * (trackW - 36)));
            thumbRef.current.style.left = `${thumbX}px`;
        }
    }, [totalLevels]);

    // RAF loop: read audio.currentTime directly, update DOM transform (no setState!)
    React.useEffect(() => {
        if (!replaying || !audioRef?.current) {
            cancelAnimationFrame(rafId.current);
            return;
        }
        const audio = audioRef.current;
        let active = true;
        const tick = () => {
            if (!active) return;
            // Update position only when actually playing
            if (!audio.paused && !audio.ended) {
                const dur = durationSec > 0 ? durationSec : (Number.isFinite(audio.duration) ? audio.duration : 0);
                if (dur > 0) {
                    applyPosition(Math.min(1, audio.currentTime / dur));
                }
            }
            // Keep looping as long as replaying — play() may start after RAF begins
            rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);
        return () => {
            active = false;
            cancelAnimationFrame(rafId.current);
        };
    }, [replaying, audioRef, applyPosition, durationSec]);

    // When seekPosition changes (paused scrub, or replay stopped), apply it
    React.useEffect(() => {
        if (isReviewMode && !replaying) {
            applyPosition(seekPosition);
        }
    }, [seekPosition, isReviewMode, replaying, applyPosition]);

    // ========== REVIEW / REPLAY MODE ==========
    // Render ALL bars in a single strip, translate it with GPU-accelerated CSS transform.
    if (isReviewMode) {
        const barsH = WAVEFORM_HEIGHT;
        const totalW = totalLevels * BAR_STEP;
        const pos = Math.max(0, Math.min(1, seekPosition));
        const initialOffset = layoutCenterX - pos * totalW;

        return (
            <div ref={containerRef} className={cn("w-full", className)} {...props}>
                <div
                    className="w-full relative overflow-hidden bg-waveform-bg cursor-pointer"
                    style={{ height: WAVEFORM_HEIGHT }}
                    onMouseDown={handleTrackDown}
                    onTouchStart={handleTrackDown}
                >
                    {/* All bars in a single translated strip */}
                    <div
                        ref={stripRef}
                        className="absolute top-0 flex items-center gap-[2px]"
                        style={{
                            height: barsH,
                            willChange: 'transform',
                            transform: `translateX(${initialOffset}px)`,
                        }}
                    >
                        {levels.map((level, i) => {
                            const minH = 3;
                            const maxH = barsH * 0.85;
                            const h = Math.max(minH, level * maxH);

                            let colorClass: string;
                            if (prePauseLevels > 0 && i >= prePauseLevels) {
                                colorClass = "bg-waveform-new";
                            } else {
                                colorClass = "bg-waveform-bar";
                            }

                            return (
                                <div
                                    key={i}
                                    className={cn("rounded-[1px] shrink-0", colorClass)}
                                    style={{ width: BAR_WIDTH, height: h }}
                                />
                            );
                        })}
                    </div>

                    {/* Center red line — fixed */}
                    <div
                        className="absolute bg-waveform-center"
                        style={{ left: '50%', top: 0, width: 2, height: barsH, transform: 'translateX(-1px)' }}
                    />
                </div>

                {/* Scrollbar */}
                <div
                    ref={trackRef}
                    className="relative cursor-pointer select-none"
                    style={{ width: '100%', height: 32, marginTop: 2, touchAction: 'none' }}
                    onMouseDown={handleTrackDown}
                    onTouchStart={handleTrackDown}
                >
                    <div
                        className="absolute w-full rounded-full"
                        style={{ height: 1, top: '50%', transform: 'translateY(-50%)', background: 'transparent' }}
                    />
                    <div
                        ref={thumbRef}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: 36,
                            height: 5,
                            left: Math.max(0, pos * (layoutWidth - 36)),
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'var(--text-muted)',
                            opacity: 0.45,
                        }}
                    />
                </div>
            </div>
        );
    }

    // ========== LIVE RECORDING MODE ==========
    const startIdx = Math.max(0, totalLevels - halfBars);
    const visibleLevels = levels.slice(startIdx);

    return (
        <div
            ref={containerRef}
            className={cn("w-full flex items-center relative overflow-hidden bg-waveform-bg", className)}
            style={{ height: WAVEFORM_HEIGHT }}
            {...props}
        >
            <div
                className="absolute top-0 bottom-0 flex items-center justify-end"
                style={{ left: 20, right: '50%', paddingRight: 2 }}
            >
                <div className="flex items-center gap-[2px] h-full" style={{ alignItems: 'center' }}>
                    {visibleLevels.map((level, i) => {
                        const actualIdx = startIdx + i;
                        const minH = 3;
                        const maxH = WAVEFORM_HEIGHT * 0.85;
                        const h = Math.max(minH, level * maxH);

                        let colorClass = "bg-waveform-bar";
                        if (prePauseLevels > 0 && actualIdx >= prePauseLevels) {
                            colorClass = "bg-waveform-new";
                        }

                        return (
                            <div
                                key={actualIdx}
                                className={cn("rounded-[1px] shrink-0", colorClass)}
                                style={{ width: BAR_WIDTH, height: h }}
                            />
                        );
                    })}
                </div>
            </div>

            <div
                className="absolute top-0 bottom-0 bg-waveform-center"
                style={{ left: '50%', width: 2, transform: 'translateX(-1px)' }}
            />
        </div>
    );
}

