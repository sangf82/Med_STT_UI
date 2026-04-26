import { getAuthToken, logout } from "../auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://medmate-backend-k25riftvia-as.a.run.app";

export type SttOutputFormat = "soap_note" | "ehr" | "operative_note" | "to-do";

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers: HeadersInit = { ...(init?.headers as HeadersInit) };
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  return fetch(`${BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
}

async function throwIfAuthOrBad(res: Response): Promise<void> {
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw {
      status: res.status,
      message: (data as { detail?: string }).detail || res.statusText,
      data,
    };
  }
}

export type SttUploadInitResponse = {
  upload_id: string;
  chunk_size: number;
  record_id: string;
};

export async function sttUploadInit(params: {
  session_id: string;
  filename: string;
  total_chunks: number;
  chunk_size?: number;
  display_name?: string;
  output_format?: SttOutputFormat;
  recording_duration_sec?: number;
}): Promise<SttUploadInitResponse> {
  const fd = new FormData();
  fd.set("session_id", params.session_id);
  fd.set("filename", params.filename);
  fd.set("total_chunks", String(params.total_chunks));
  if (params.chunk_size != null) fd.set("chunk_size", String(params.chunk_size));
  if (params.display_name) fd.set("display_name", params.display_name);
  fd.set("output_format", params.output_format ?? "soap_note");
  if (params.recording_duration_sec != null) {
    fd.set("recording_duration_sec", String(params.recording_duration_sec));
  }
  const res = await authedFetch("/ai/stt/upload/init", { method: "POST", body: fd });
  await throwIfAuthOrBad(res);
  return res.json();
}

export async function sttUploadChunk(
  upload_id: string,
  chunk_index: number,
  blob: Blob,
  filename = "chunk.bin",
): Promise<void> {
  const fd = new FormData();
  fd.set("upload_id", upload_id);
  fd.set("chunk_index", String(chunk_index));
  fd.set("chunk", blob, filename);
  const res = await authedFetch("/ai/stt/upload/chunk", { method: "PUT", body: fd });
  await throwIfAuthOrBad(res);
}

/** Retry transient failures (network / 5xx / 429). Idempotent on server for same chunk_index. */
export async function sttUploadChunkWithRetry(
  upload_id: string,
  chunk_index: number,
  blob: Blob,
  filename?: string,
  maxAttempts = 6,
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await sttUploadChunk(upload_id, chunk_index, blob, filename);
      return;
    } catch (e) {
      lastErr = e;
      const status = (e as { status?: number })?.status;
      if (status != null && status >= 400 && status < 500 && status !== 429) throw e;
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
  throw lastErr;
}

export async function sttUploadComplete(body: {
  upload_id: string;
  record_id: string;
  output_format?: SttOutputFormat;
}): Promise<{ job_id: string; upload_id: string; record_id: string }> {
  const res = await authedFetch("/ai/stt/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_id: body.upload_id,
      record_id: body.record_id,
      output_format: body.output_format ?? "soap_note",
    }),
  });
  await throwIfAuthOrBad(res);
  return res.json();
}

export async function sttUploadStreamInit(params: {
  session_id: string;
  filename?: string;
  display_name?: string;
  output_format?: SttOutputFormat;
  recording_duration_sec?: number;
}): Promise<SttUploadInitResponse> {
  const fd = new FormData();
  fd.set("session_id", params.session_id);
  fd.set("filename", params.filename ?? "audio.webm");
  if (params.display_name) fd.set("display_name", params.display_name);
  fd.set("output_format", params.output_format ?? "soap_note");
  if (params.recording_duration_sec != null) {
    fd.set("recording_duration_sec", String(params.recording_duration_sec));
  }
  const res = await authedFetch("/ai/stt/upload/stream/init", { method: "POST", body: fd });
  await throwIfAuthOrBad(res);
  return res.json();
}

export async function sttUploadStreamEnd(body: {
  upload_id: string;
  total_chunks: number;
  record_id: string;
  output_format?: SttOutputFormat;
  recording_duration_sec?: number;
}): Promise<{ job_id: string; upload_id: string; record_id: string }> {
  const res = await authedFetch("/ai/stt/upload/stream/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_id: body.upload_id,
      total_chunks: body.total_chunks,
      record_id: body.record_id,
      output_format: body.output_format ?? "soap_note",
      recording_duration_sec: body.recording_duration_sec,
    }),
  });
  await throwIfAuthOrBad(res);
  return res.json();
}

export type SttUploadStatusResponse = {
  session: Record<string, unknown>;
  missing_chunk_indexes: number[];
};

export async function sttUploadStatus(uploadId: string): Promise<SttUploadStatusResponse> {
  const res = await authedFetch(`/ai/stt/upload/status/${encodeURIComponent(uploadId)}`);
  await throwIfAuthOrBad(res);
  return res.json();
}

export async function sttUploadListIncomplete(): Promise<{
  uploads: Array<Record<string, unknown>>;
}> {
  const res = await authedFetch("/ai/stt/upload/incomplete");
  await throwIfAuthOrBad(res);
  return res.json();
}

export type SttJob = {
  id: string;
  status: string;
  result?: unknown;
  error?: unknown;
  record_id?: string;
  upload_id?: string | null;
};

export async function sttGetJob(jobId: string): Promise<SttJob> {
  const res = await authedFetch(`/ai/stt/jobs/${encodeURIComponent(jobId)}`);
  await throwIfAuthOrBad(res);
  return res.json();
}
