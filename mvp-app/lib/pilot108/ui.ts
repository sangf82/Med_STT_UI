/** View-only UI types for Pilot108 (pen rmCmK / H4) — not API DTOs. */

export type P108ProcessingChipState = 'idle' | 'active' | 'done' | 'error';

export type P108InlineAlertTone = 'info' | 'success' | 'warning' | 'destructive';

export type P108ShareChoiceUi = 'external' | 'only_me';
