import { apiClient } from "../apiClient";
import { getAuthToken, logout } from "../auth";

// AI-supported output formats only (must match backend AVAILABLE_OUTPUT_FORMATS)
export const AVAILABLE_OUTPUT_FORMATS = ["soap_note", "ehr", "to-do", "freetext"] as const;
export type OutputFormat = (typeof AVAILABLE_OUTPUT_FORMATS)[number];

/** Normalize to one of AVAILABLE_OUTPUT_FORMATS only (matches backend/AI). */
export function normalizeOutputFormat(value: string | undefined): OutputFormat {
  if (!value || !value.trim()) return "soap_note";
  const raw = value.trim().toLowerCase().replace(/\s/g, "_");
  if (raw === "soap_note" || raw === "soap") return "soap_note";
  if (raw === "ehr" || raw === "clinical") return "ehr";
  if (raw === "to-do" || raw === "todo" || raw === "todolist") return "to-do";
  if (raw === "freetext" || raw === "free" || raw === "free_text" || raw === "raw") return "freetext";
  return "soap_note";
}

// --- Types ---

export interface SttUsage {
  stt_used_count: number;
  stt_requests_limit: number;
  stt_remaining: number;
  stt_request_more_count: number;
}

export interface RequestMorePayload {
  rating?: number;
  referred_friend?: boolean;
}

export interface SttRecord {
  id: string;
  /** Current text (edited or from STT). List does not return this; only get-by-id does. */
  content?: string;
  /** AI raw STT output. Only in get-by-id response. */
  raw_text?: string;
  /** AI refined output. Only in get-by-id response. */
  refined_text?: string;
  output_format?: OutputFormat | string;
  status: "completed" | "failed" | "processing" | "pending";
  error_message?: string;
  elapsed_time?: number;
  created_at: string;
  updated_at: string;
  display_name?: string;
  patient_name?: string;
  context_record_id?: string;
  context_status?: "available" | "empty" | "unknown_patient" | string;
  context_text?: string;
  context_conflicts?: string[];
}

export interface SttRecordsResponse {
  items: SttRecord[];
  total: number;
  skip: number;
  limit: number;
}

export interface PatientFolder {
  id?: string | null;
  name: string;
  record_count: number;
  latest_record_at?: string | null;
  is_virtual?: boolean;
}

export interface PatientFoldersResponse {
  items: PatientFolder[];
  total: number;
}

export interface SttTranscriptionResponse {
  response?: {
    refined_text: string;
    raw_text: string;
    elapsed_time: number;
    record_id: string;
  };
  record_id: string;
  output_format?: string;
}

/** POST /ai/stt/change-format — Modal may return refined_text, text, json, etc. */
export interface SttChangeFormatResponse {
  refined_text?: string;
  text?: string;
  output_format?: OutputFormat | string;
  elapsed_time?: number;
  [key: string]: unknown;
}

export interface DailyActualCasesResponse {
  by_date: Record<string, number>;
  items: any[];
}

export interface LatestSoapContextResponse {
  has_context: boolean;
  is_empty_context: boolean;
  context: {
    id: string;
    case_id?: string;
    patient_id?: string;
    note_date?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    others?: string;
    management_plan?: Record<string, unknown>;
  } | null;
}

export interface ChunkedUploadInitResponse {
  upload_id: string;
  chunk_size: number;
  record_id: string;
}

export interface ChunkedUploadStatusResponse {
  missing_chunk_indexes: number[];
}

export interface ChunkedUploadCompleteResponse {
  job_id: string;
  record_id?: string;
}

export interface SttJobResponse {
  id?: string;
  upload_id?: string;
  user_id?: string;
  session_id?: string;
  status: "pending" | "processing" | "done" | "failed";
  result?: {
    refined_text: string;
    raw_text: string;
    elapsed_time: number;
    record_id: string;
  };
  error?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SttJobListItem {
  id: string;
  upload_id?: string;
  user_id?: string;
  session_id?: string;
  status: "pending" | "processing" | "done" | "failed";
  result?: {
    refined_text?: string;
    raw_text?: string;
    elapsed_time?: number;
    record_id?: string;
  };
  error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SttJobListResponse {
  jobs: SttJobListItem[];
}

export interface IncompleteUpload {
  upload_id: string;
  filename?: string;
  total_chunks?: number;
  created_at?: string;
}

export interface IncompleteUploadsResponse {
  uploads: IncompleteUpload[]; // backend returns { uploads: [...] }
}

/** Đổi raw_text sang format khác (soap_note | ehr | to-do | freetext) qua Modal; không tốn quota STT audio. */
export function sttChangeFormat(payload: {
  raw_text: string;
  output_format: OutputFormat | string;
}) {
  const output_format = normalizeOutputFormat(String(payload.output_format));
  return apiClient<SttChangeFormatResponse>("/ai/stt/change-format", {
    method: "POST",
    body: JSON.stringify({
      raw_text: payload.raw_text,
      output_format,
    }),
  });
}

// --- API Functions ---

// 1. Usage Management
export const getMyUsage = () => apiClient<SttUsage>("/stt-metrics/me/usage");

export const requestMoreStt = (payload: RequestMorePayload) =>
  apiClient<{ ok: boolean; message: string }>("/stt-metrics/me/request-more", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// 2. Case Tracking
export const getDailyRequiredCases = () =>
  apiClient<{ daily_required_soap_count: number }>(
    "/stt-metrics/me/daily-required-cases",
  );

export const setDailyRequiredCases = (daily_required_soap_count: number) =>
  apiClient<{ daily_required_soap_count: number }>(
    "/stt-metrics/me/daily-required-cases",
    {
      method: "PUT",
      body: JSON.stringify({ daily_required_soap_count }),
    },
  );

export const updateDailyRequiredCases = (count: number) =>
  apiClient<{ count: number; daily_required_soap_count: number }>(
    "/stt-metrics/me/daily-cases",
    {
      method: "PATCH",
      body: JSON.stringify({ count }),
    },
  );

export const getDailyActualCases = (fromDate?: string, toDate?: string) => {
  const params: Record<string, string> = {};
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  return apiClient<DailyActualCasesResponse>(
    "/stt-metrics/me/daily-actual-cases",
    { params },
  );
};

export const getLatestSoapContext = (params: { case_id?: string; patient_id?: string }) =>
  apiClient<LatestSoapContextResponse>("/soap-notes/context/latest", {
    params: {
      ...(params.case_id ? { case_id: params.case_id } : {}),
      ...(params.patient_id ? { patient_id: params.patient_id } : {}),
    },
  });

export const updateDailyActualCases = (date: string, actual_cases: number) =>
  apiClient<{ date: string; actual_cases: number }>(
    "/stt-metrics/me/daily-actual-cases",
    {
      method: "PUT",
      body: JSON.stringify({ date, actual_cases }),
    },
  );

// 3. Record Management
export const getMyRecords = (skip = 0, limit = 50, output_format?: string) => {
  const params: Record<string, string> = {
    skip: skip.toString(),
    limit: limit.toString(),
  };
  if (output_format) params.output_format = output_format;
  return apiClient<SttRecordsResponse>("/stt-metrics/me/records", {
    params,
    cache: "no-store",
  });
};

export const getRecordById = (recordId: string) =>
  apiClient<SttRecord>(`/stt-metrics/me/records/${recordId}`);

export const getMyPatientFolders = () =>
  apiClient<PatientFoldersResponse>("/stt-metrics/me/patient-folders", {
    cache: "no-store",
  });

export const createMyPatientFolder = (name: string) =>
  apiClient<{ id: string; name: string }>("/stt-metrics/me/patient-folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const renameMyPatientFolder = (folderName: string, newName: string) =>
  apiClient<{ name: string; renamed: boolean }>(`/stt-metrics/me/patient-folders/${encodeURIComponent(folderName)}`, {
    method: "PATCH",
    body: JSON.stringify({ new_name: newName }),
  });

export const deleteMyPatientFolder = (folderName: string, clearRecords = true) =>
  apiClient<{ deleted: boolean; clear_records: boolean }>(
    `/stt-metrics/me/patient-folders/${encodeURIComponent(folderName)}`,
    {
      method: "DELETE",
      params: { clear_records: String(clearRecords) },
    },
  );

export const getPatientFolderRecords = (folderName: string, skip = 0, limit = 50) =>
  apiClient<SttRecordsResponse>(`/stt-metrics/me/patient-folders/${encodeURIComponent(folderName)}/records`, {
    params: {
      skip: String(skip),
      limit: String(limit),
    },
    cache: "no-store",
  });

export const updateRecord = (
  recordId: string,
  payload: { content?: string; display_name?: string; patient_name?: string },
) => {
  // NOTE: The backend requires "content" field in the PATCH body.
  // Ensure all callers provide it. If you only want to update display_name,
  // you must still provide the current content.
  return apiClient<SttRecord>(`/stt-metrics/me/records/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/** Re-run STT for a failed record. Returns 202; poll getRecordById for result. */
export const retryRecord = (recordId: string) =>
  apiClient<{ message: string; record_id: string }>(
    `/stt-metrics/me/records/${recordId}/retry`,
    { method: "POST" },
  );

/** Delete an STT record. Hypothesis user only; 204 on success. */
export const deleteRecord = (recordId: string) =>
  apiClient<void>(`/stt-metrics/me/records/${recordId}`, { method: "DELETE" });

// 4. AI Transcription

export const basicSttAudio = async (
  audioBlob: Blob,
  session_id: string,
  output_format?: OutputFormat | string,
) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "record.webm");
  formData.append("session_id", session_id);
  formData.append("output_format", normalizeOutputFormat(output_format));

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token") ||
        document.cookie.match(new RegExp("(^| )auth_token=([^;]+)"))?.[2]
      : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw { status: response.status, message: response.statusText };
  }
  return response.json() as Promise<SttTranscriptionResponse>;
};

export const transcribeAudio = async (
  audioBlob: Blob,
  output_format?: OutputFormat | string,
) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "record.webm");
  formData.append("output_format", normalizeOutputFormat(output_format));
  // Note: Don't set Content-Type header manually when using FormData, browser will set it with boundaries

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token") ||
        document.cookie.match(new RegExp("(^| )auth_token=([^;]+)"))?.[2]
      : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/transcribe`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw { status: response.status, message: response.statusText };
  }
  return response.json() as Promise<SttTranscriptionResponse>;
};

// --- Chunked Upload & Queue ---
// Backend expects FormData for init/complete/abandon (not JSON).

export const initChunkedUpload = async (
  filename: string,
  total_chunks: number,
  session_id: string,
  chunk_size?: number,
  display_name?: string,
  output_format?: OutputFormat | string,
  file_size?: number,
): Promise<ChunkedUploadInitResponse> => {
  const form = new FormData();
  form.append("session_id", session_id);
  form.append("filename", filename);
  form.append("total_chunks", total_chunks.toString());
  if (chunk_size != null) form.append("chunk_size", chunk_size.toString());
  if (file_size != null && file_size > 0) form.append("file_size", file_size.toString());
  if (display_name != null && String(display_name).trim())
    form.append("display_name", String(display_name).trim());
  form.append("output_format", normalizeOutputFormat(output_format));

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/upload/init`;
  const res = await fetch(url, { method: "POST", headers, body: form });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error("Unauthorized");
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, message: err.detail || res.statusText };
  }
  return res.json();
};

/** 512KB chunk: max 1 minute per request then timeout. */
export const CHUNK_UPLOAD_TIMEOUT_MS = 60 * 1000;

export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunkBlob: Blob,
  options?: { timeoutMs?: number },
) => {
  const timeoutMs = options?.timeoutMs ?? CHUNK_UPLOAD_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = controller.signal;

  const formData = new FormData();
  formData.append("upload_id", uploadId);
  formData.append("chunk_index", chunkIndex.toString());
  formData.append("chunk", chunkBlob);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token") ||
        document.cookie.match(new RegExp("(^| )auth_token=([^;]+)"))?.[2]
      : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/upload/chunk`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: formData,
      signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw { status: response.status, message: response.statusText };
    }
    return response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      throw { status: 408, message: "Chunk upload timeout (max 1 min)" };
    }
    throw e;
  }
};

/** Upload one chunk with retries (default 2 retries = 3 attempts). On final failure throws. */
export const uploadChunkWithRetry = async (
  uploadId: string,
  chunkIndex: number,
  chunkBlob: Blob,
  maxAttempts = 3,
): Promise<void> => {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await uploadChunk(uploadId, chunkIndex, chunkBlob);
      return;
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastErr;
};

export const getChunkedUploadStatus = (uploadId: string) =>
  apiClient<ChunkedUploadStatusResponse>(`/ai/stt/upload/status/${uploadId}`);

/** Stream mode: init when recording starts; chunks uploaded during recording (no IndexedDB). */
export const initStreamUpload = async (params: {
  session_id: string;
  filename?: string;
  display_name?: string;
  output_format?: OutputFormat | string;
}): Promise<ChunkedUploadInitResponse> => {
  const form = new FormData();
  form.append("session_id", params.session_id);
  form.append("filename", params.filename ?? "audio.webm");
  if (params.display_name?.trim()) form.append("display_name", params.display_name.trim());
  form.append("output_format", normalizeOutputFormat(params.output_format ?? "soap_note"));

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/upload/stream/init`;
  const res = await fetch(url, { method: "POST", headers, body: form });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error("Unauthorized");
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, message: err.detail || res.statusText };
  }
  return res.json();
};

/** Stream mode: finalize after recording stopped; enqueues STT job. */
export const streamEndUpload = async (payload: {
  upload_id: string;
  total_chunks: number;
  record_id?: string;
  output_format?: OutputFormat | string;
  recording_duration_sec?: number;
  display_name?: string;
  patient_name?: string;
}): Promise<ChunkedUploadCompleteResponse> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/upload/stream/end`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      upload_id: payload.upload_id,
      total_chunks: payload.total_chunks,
      record_id: payload.record_id,
      output_format: payload.output_format,
      recording_duration_sec: payload.recording_duration_sec,
      display_name: payload.display_name,
      patient_name: payload.patient_name,
    }),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error("Unauthorized");
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, message: err.detail || res.statusText };
  }
  return res.json();
};

export const completeChunkedUpload = async (payload: {
  upload_id: string;
  session_id?: string;
  output_format?: OutputFormat | string;
  record_id?: string;
}): Promise<ChunkedUploadCompleteResponse> => {
  const form = new FormData();
  form.append("upload_id", payload.upload_id);
  form.append("output_format", normalizeOutputFormat(payload.output_format));
  if (payload.record_id) {
    form.append("record_id", payload.record_id);
  }
  if (payload.session_id) {
    form.append("session_id", payload.session_id);
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/upload/complete`;
  const res = await fetch(url, { method: "POST", headers, body: form });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error("Unauthorized");
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, message: err.detail || res.statusText };
  }
  return res.json();
};

export const getSttJobStatus = (jobId: string) =>
  apiClient<SttJobResponse>(`/ai/stt/jobs/${jobId}`);

export const getSttJobsList = (statusFilter?: string, limit = 50) => {
  const params: Record<string, string> = { limit: limit.toString() };
  if (statusFilter) params.status_filter = statusFilter;
  return apiClient<SttJobListResponse>("/ai/stt/jobs", { params });
};

export const pingServer = () =>
  apiClient<{ ok: boolean; pong: boolean }>("/ping");

const STT_EVENTS_PATH = "/stt-metrics/me/events";

/** SSE URL for record status updates (EventSource). Token in query because EventSource cannot send headers. */
export function getSttEventsUrl(): string | null {
  if (typeof window === "undefined") return null;
  const token = getAuthToken();
  if (!token) return null;
  const base = process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app";
  return `${base}${STT_EVENTS_PATH}?access_token=${encodeURIComponent(token)}`;
}

export type SttEventRecordUpdated = { type: "record_updated"; record_id: string; status: string };
export type SttEventPing = { type: "ping" };
export type SttEvent = SttEventRecordUpdated | SttEventPing;

export const getIncompleteUploads = () =>
  apiClient<IncompleteUploadsResponse>("/ai/stt/upload/incomplete");

export const abandonUpload = async (
  uploadId: string,
): Promise<{ upload_id: string; status: string }> => {
  const form = new FormData();
  form.append("upload_id", uploadId);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/ai/stt/upload/abandon`;
  const res = await fetch(url, { method: "POST", headers, body: form });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error("Unauthorized");
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, message: err.detail || res.statusText };
  }
  return res.json();
};
