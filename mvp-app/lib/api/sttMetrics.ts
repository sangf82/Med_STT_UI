import { apiClient } from "../apiClient";
import { getAuthToken, logout } from "../auth";

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
  id: string; // the backend uses id or _id depending on serialization, assuming id here or we map it
  raw_text?: string;
  refined_text?: string;
  content?: string;
  output_type?: string;
  format_type?: string;
  output_format?: string;
  status: "completed" | "failed" | "processing" | "pending";
  error_message?: string;
  elapsed_time?: number;
  created_at: string;
  updated_at: string;
  display_name?: string;
}

export interface SttRecordsResponse {
  items: SttRecord[];
  total: number;
  skip: number;
  limit: number;
}

export interface SttTranscriptionResponse {
  response?: {
    refined_text: string;
    raw_text: string;
    elapsed_time: number;
    record_id: string;
  };
  record_id: string;
  output_type?: string;
  format_type?: string;
  output_format?: string;
}

export interface DailyActualCasesResponse {
  by_date: Record<string, number>;
  items: any[];
}

export interface ChunkedUploadInitResponse {
  upload_id: string;
  chunk_size: number;
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

export const updateDailyActualCases = (date: string, actual_cases: number) =>
  apiClient<{ date: string; actual_cases: number }>(
    "/stt-metrics/me/daily-actual-cases",
    {
      method: "PUT",
      body: JSON.stringify({ date, actual_cases }),
    },
  );

// 3. Record Management
export const getMyRecords = (skip = 0, limit = 50, output_type?: string) => {
  const params: Record<string, string> = {
    skip: skip.toString(),
    limit: limit.toString(),
  };
  if (output_type) params.output_type = output_type;
  return apiClient<SttRecordsResponse>("/stt-metrics/me/records", { params });
};

export const getRecordById = (recordId: string) =>
  apiClient<SttRecord>(`/stt-metrics/me/records/${recordId}`);

export const updateRecord = (
  recordId: string,
  payload: { content?: string; display_name?: string },
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

export const basicSttAudio = async (audioBlob: Blob, session_id: string) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "record.webm");
  formData.append("session_id", session_id);

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
  output_type?: string,
  format_type?: string,
) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "record.webm");
  if (output_type) formData.append("output_type", output_type);
  if (format_type) formData.append("format_type", format_type);
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
): Promise<ChunkedUploadInitResponse> => {
  const form = new FormData();
  form.append("session_id", session_id);
  form.append("filename", filename);
  form.append("total_chunks", total_chunks.toString());
  if (chunk_size != null) form.append("chunk_size", chunk_size.toString());
  if (display_name != null && display_name.trim())
    form.append("display_name", display_name.trim());

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

export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunkBlob: Blob,
) => {
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
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw { status: response.status, message: response.statusText };
  }
  return response.json();
};

export const getChunkedUploadStatus = (uploadId: string) =>
  apiClient<ChunkedUploadStatusResponse>(`/ai/stt/upload/status/${uploadId}`);

export const completeChunkedUpload = async (payload: {
  upload_id: string;
  session_id?: string;
  output_format?: string;
  output_type?: string;
  format_type?: string;
  display_name?: string;
}): Promise<ChunkedUploadCompleteResponse> => {
  const form = new FormData();
  form.append("upload_id", payload.upload_id);

  const finalFormat =
    payload.output_format ||
    payload.format_type ||
    payload.output_type ||
    "soap_note";
  form.append("output_format", finalFormat);

  if (payload.display_name != null && payload.display_name.trim()) {
    form.append("display_name", payload.display_name.trim());
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
