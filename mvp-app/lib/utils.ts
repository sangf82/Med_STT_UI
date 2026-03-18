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

export function normalizeSoapPlanMarkdownForDisplay(raw: string): string {
    if (!raw || typeof raw !== 'string') return raw;

    const lines = raw.split('\n');
    const normalized: string[] = [];
    let inPlanSection = false;

    const isPlanHeader = (line: string) =>
        /^\s*(?:[-*•]\s*)?(?:P\s*(?:\((?:Plan|Kế\s*hoạch)\))?|Plan|Kế\s*hoạch)\s*:/i.test(line);

    const isSoapSectionHeader = (line: string) =>
        /^\s*(?:[-*•]\s*)?(?:One-liner|S|O|A|P)\s*(?:\([^)]*\))?\s*:/i.test(line);

    for (const line of lines) {
        if (isPlanHeader(line)) {
            inPlanSection = true;
            normalized.push(line);
            continue;
        }

        if (inPlanSection && isSoapSectionHeader(line)) {
            inPlanSection = false;
        }

        if (inPlanSection) {
            if (line.trim().length === 0) {
                normalized.push(line);
                continue;
            }

            const alreadyTaskLine = line.match(/^(\s*)[-*]\s+\[[xX ]\]\s+(.+)$/);
            if (alreadyTaskLine) {
                normalized.push(line);
                continue;
            }

            const lineWithPrefix = line.match(/^(\s*)(?:[-*•]|\d+[.)])\s+(.+)$/);
            if (lineWithPrefix) {
                normalized.push(`${lineWithPrefix[1]}- [ ] ${lineWithPrefix[2]}`);
                continue;
            }

            const plainLine = line.match(/^(\s*)(.+)$/);
            if (plainLine) {
                normalized.push(`${plainLine[1]}- [ ] ${plainLine[2]}`);
                continue;
            }
        }

        normalized.push(line);
    }

    return normalized.join('\n');
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
