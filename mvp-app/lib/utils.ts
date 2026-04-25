import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function parseSoapSections(text: string): { label: string; content: string }[] {
    return text
        .split('\n\n')
        .filter(s => s.trim().length > 0)
        .map(sec => {
            const idx = sec.indexOf(':');
            return {
                label: sec.substring(0, idx).trim(),
                content: sec.substring(idx + 1).trim(),
            };
        });
}

export function formatTimeMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const deci = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deci}`;
}

export function formatDurationSec(sec?: number): string {
    if (typeof sec !== 'number' || isNaN(sec) || sec <= 0) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTimeSec(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
