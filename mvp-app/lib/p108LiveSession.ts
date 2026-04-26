/** Phiên WebRTC admin `/admin/stt-stream/:id` — đồng bộ qua sessionStorage + event (cùng tab). */

export const P108_LIVE_SESSION_STORAGE_KEY = 'medmate.p108.liveSessionId';

export const P108_LIVE_SESSION_CHANGED = 'p108-live-session-changed';

export function getP108LiveSessionId(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(P108_LIVE_SESSION_STORAGE_KEY)?.trim() || '';
}

export function setP108LiveSessionId(id: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const v = (id || '').trim();
  if (v) sessionStorage.setItem(P108_LIVE_SESSION_STORAGE_KEY, v);
  else sessionStorage.removeItem(P108_LIVE_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(P108_LIVE_SESSION_CHANGED));
}
