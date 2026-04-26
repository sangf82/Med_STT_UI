/**
 * Pilot 108 individual surface — exact English copy referenced by BDD
 * (Personal Productivity, Quick Edit, Team roster / assignee).
 * Single source for UI + Playwright assertions.
 */
export const PILOT108_INDIVIDUAL_BDD = {
  /** Aligns with real capture: blob → step1-hear → step2-resolve → create draft (not legacy generic “team identify”). */
  processingSteps: [
    'Đang gửi bản ghi…',
    'Step 1 — Nghe phiên & chuyển văn bản…',
    'Step 2 — Tạo checklist việc…',
    'Lưu bản nháp…',
  ] as const,
  transcriptionError: "Sorry, I couldn't hear that clearly. Try again?",
  noAudioToast: 'No audio captured',
  noTasksPrompt:
    "I couldn't find any to-do items. Would you like to create one manually?",
  shareTitle: 'Do you want to share this?',
  shareExternal: 'External',
  shareOnlyMe: 'Only Me',
  assigneeEmpty: 'No team members found. [Upload List Now]',
  waitingOffline: 'Waiting for connection...',
} as const;
