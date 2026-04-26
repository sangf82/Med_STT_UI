import { getAuthToken } from "../auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://medmate-backend-k25riftvia-as.a.run.app";

export type WebRtcSdp = { type: "offer" | "answer"; sdp: string };
export type WebRtcCandidate = {
  seq: number;
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  usernameFragment?: string;
};

export async function initLiveSession(displayName?: string): Promise<{ live_session_id: string }> {
  const fd = new FormData();
  if (displayName) fd.set("display_name", displayName);
  const res = await authedFetch("/ai/stt/live/init", { method: "POST", body: fd });
  if (!res.ok) throw new Error(`live init failed: ${res.status}`);
  return res.json();
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getLiveOffer(liveSessionId: string): Promise<WebRtcSdp | null> {
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/offer`);
  if (!res.ok) throw new Error(`get offer failed: ${res.status}`);
  const body = (await res.json()) as { offer?: WebRtcSdp | null };
  return body.offer || null;
}

export async function postLiveAnswer(liveSessionId: string, answer: WebRtcSdp): Promise<void> {
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answer),
  });
  if (!res.ok) throw new Error(`post answer failed: ${res.status}`);
}

export async function postLiveOffer(liveSessionId: string, offer: WebRtcSdp): Promise<void> {
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });
  if (!res.ok) throw new Error(`post offer failed: ${res.status}`);
}

export async function getLiveAnswer(liveSessionId: string): Promise<WebRtcSdp | null> {
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/answer`);
  if (!res.ok) throw new Error(`get answer failed: ${res.status}`);
  const body = (await res.json()) as { answer?: WebRtcSdp | null };
  return body.answer || null;
}

export async function getLiveSnapshot(
  liveSessionId: string,
): Promise<{ display_name?: string; status?: string; has_offer?: boolean; has_answer?: boolean }> {
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/snapshot`);
  if (!res.ok) throw new Error(`snapshot failed: ${res.status}`);
  return res.json();
}

export async function addLiveCandidate(
  liveSessionId: string,
  role: "offerer" | "answerer",
  candidate: RTCIceCandidateInit,
): Promise<void> {
  if (!candidate.candidate) return;
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/candidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role,
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid ?? null,
      sdpMLineIndex: candidate.sdpMLineIndex ?? null,
      usernameFragment: candidate.usernameFragment ?? null,
    }),
  });
  if (!res.ok) throw new Error(`add candidate failed: ${res.status}`);
}

export async function getLiveCandidates(
  liveSessionId: string,
  role: "offerer" | "answerer",
  after = 0,
): Promise<WebRtcCandidate[]> {
  const q = new URLSearchParams({ role, after: String(after) });
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/candidates?${q.toString()}`);
  if (!res.ok) throw new Error(`get candidates failed: ${res.status}`);
  const body = (await res.json()) as { items?: WebRtcCandidate[] };
  return body.items || [];
}

export async function closeLiveSession(liveSessionId: string): Promise<void> {
  const res = await authedFetch(`/ai/stt/live/${encodeURIComponent(liveSessionId)}/close`, { method: "POST" });
  if (!res.ok) throw new Error(`close live session failed: ${res.status}`);
}
