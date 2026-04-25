import { getAuthToken } from "../auth";
import { apiClient } from "../apiClient";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://medmate-backend-k25riftvia-as.a.run.app";

/** GET /stt-metrics/admin/stream-sessions/{upload_id} — admin only */
export interface AdminStreamUploadSnapshot {
  upload_id: string;
  user_id?: string;
  session_id?: string;
  filename?: string;
  total_chunks: number;
  chunk_size: number;
  status?: string;
  record_id?: string;
  display_name?: string;
  stored_chunk_count?: number;
  min_chunk_index?: number;
  max_chunk_index?: number;
  created_at?: string;
  updated_at?: string;
}

export async function fetchAdminStreamSnapshot(
  uploadId: string,
): Promise<AdminStreamUploadSnapshot> {
  return apiClient<AdminStreamUploadSnapshot>(
    `/stt-metrics/admin/stream-sessions/${encodeURIComponent(uploadId)}`,
  );
}

export async function fetchAdminAssembledAudio(
  uploadId: string,
  maxChunkIndex?: number,
): Promise<Blob> {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (maxChunkIndex !== undefined && maxChunkIndex >= 0) {
    params.set("max_chunk_index", String(maxChunkIndex));
  }
  const qs = params.toString();
  const url = `${BASE_URL}/stt-metrics/admin/stream-sessions/${encodeURIComponent(uploadId)}/assembled${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`assembled audio failed: ${res.status}`);
  }
  return res.blob();
}

export async function fetchAdminStreamChunk(
  uploadId: string,
  chunkIndex: number,
): Promise<Blob> {
  const token = getAuthToken();
  const url = `${BASE_URL}/stt-metrics/admin/stream-sessions/${encodeURIComponent(uploadId)}/chunks/${chunkIndex}`;
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`chunk ${chunkIndex} failed: ${res.status}`);
  }
  return res.blob();
}

/** EventSource cannot send Authorization; pass JWT as query (same pattern as STT /me/events). */
export function adminStreamLiveSseUrl(uploadId: string, accessToken: string, pollMs = 400): string {
  const q = new URLSearchParams({
    access_token: accessToken,
    poll_ms: String(pollMs),
  });
  return `${BASE_URL}/stt-metrics/admin/stream-sessions/${encodeURIComponent(uploadId)}/live?${q}`;
}
