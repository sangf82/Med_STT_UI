import { apiClient } from "../apiClient";

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
  items: IncompleteUpload[];
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
) =>
  apiClient<SttRecord>(`/stt-metrics/me/records/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

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

export const initChunkedUpload = (
  filename: string,
  total_chunks: number,
  session_id: string,
  chunk_size?: number,
) => {
  const body: Record<string, any> = { filename, total_chunks, session_id };
  if (chunk_size) body.chunk_size = chunk_size;
  return apiClient<ChunkedUploadInitResponse>("/ai/stt/upload/init", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

export const completeChunkedUpload = (payload: {
  upload_id: string;
  session_id?: string;
  output_type?: string;
  format_type?: string;
}) =>
  apiClient<ChunkedUploadCompleteResponse>("/ai/stt/upload/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });

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

export const abandonUpload = (uploadId: string) =>
  apiClient<{ ok: boolean }>("/ai/stt/upload/abandon", {
    method: "POST",
    body: JSON.stringify({ upload_id: uploadId }),
  });
