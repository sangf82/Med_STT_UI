import { apiClient } from "../apiClient";
import { getAuthToken } from "../auth";

export type Pilot108RosterMember = {
  member_id: string;
  name: string;
  role?: string | null;
  email_or_id?: string | null;
};

export type Pilot108DraftItem = {
  id: string;
  text: string;
  assignee_id?: string | null;
  status?: string;
};

export type Pilot108ShareScope = "ONLY_ME" | "EXTERNAL";

export type Pilot108Draft = {
  id: string;
  user_id: string;
  list_status: "DRAFT_LIST" | "FINALIZED_LIST" | string;
  items: Pilot108DraftItem[];
  share_scope?: Pilot108ShareScope | null;
  created_at?: string;
  updated_at?: string;
  finalized_at?: string | null;
};

export type Pilot108ApiError = {
  status?: number;
  message: string;
  raw?: unknown;
};

function normalizeError(error: unknown): Pilot108ApiError {
  const unknownMessage = "Unexpected error";
  if (!error || typeof error !== "object") {
    return { message: unknownMessage, raw: error };
  }

  const source = error as { status?: number; message?: string; data?: unknown };
  const detail =
    (source.data as { detail?: string } | undefined)?.detail ||
    source.message ||
    unknownMessage;
  return {
    status: source.status,
    message: detail,
    raw: error,
  };
}

export async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw normalizeError(error);
  }
}

export const pilot108GetRoster = () =>
  apiCall(() => apiClient<{ members: Pilot108RosterMember[] }>("/pilot108/individual/roster"));

export const pilot108UpsertRosterBulk = (rawText: string) =>
  apiCall(() =>
    apiClient<{ members: Pilot108RosterMember[] }>("/pilot108/individual/roster/bulk", {
      method: "POST",
      body: JSON.stringify({ raw_text: rawText }),
    }),
  );

export const pilot108AddRosterMember = (payload: {
  name: string;
  role?: string | null;
  email_or_id?: string | null;
}) =>
  apiCall(() =>
    apiClient<{ member: Pilot108RosterMember; members: Pilot108RosterMember[] }>(
      "/pilot108/individual/roster/members",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  );

export const pilot108UpdateRosterMember = (
  memberId: string,
  payload: { name: string; role?: string | null; email_or_id?: string | null },
) =>
  apiCall(() =>
    apiClient<{ members: Pilot108RosterMember[] }>(`/pilot108/individual/roster/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );

export const pilot108DeleteRosterMember = (memberId: string) =>
  apiCall(() =>
    apiClient<{ members: Pilot108RosterMember[] }>(`/pilot108/individual/roster/members/${memberId}`, {
      method: "DELETE",
    }),
  );

export const pilot108CreateDraft = (payload: {
  items: Array<{ id: string; text: string; assignee_id?: string | null }>;
  idempotency_key?: string;
}) =>
  apiCall(() =>
    apiClient<Pilot108Draft>("/pilot108/individual/drafts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );

export const pilot108GetDraft = (draftId: string) =>
  apiCall(() => apiClient<Pilot108Draft>(`/pilot108/individual/drafts/${draftId}`));

export const pilot108PatchDraftItems = (
  draftId: string,
  payload: {
    updates: Array<{ id: string; text?: string; assignee_id?: string | null }>;
    delete_item_ids: string[];
  },
) =>
  apiCall(() =>
    apiClient<Pilot108Draft>(`/pilot108/individual/drafts/${draftId}/items`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );

export const pilot108FinalizeDraft = (
  draftId: string,
  idempotencyKey?: string,
  shareScope: Pilot108ShareScope = "ONLY_ME",
) =>
  apiCall(() =>
    apiClient<Pilot108Draft>(`/pilot108/individual/drafts/${draftId}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        confirm: true,
        idempotency_key: idempotencyKey,
        share_scope: shareScope,
      }),
    }),
  );

export const pilot108ReopenDraft = (draftId: string) =>
  apiCall(() =>
    apiClient<Pilot108Draft>(`/pilot108/individual/drafts/${draftId}/reopen`, {
      method: "POST",
    }),
  );

export const pilot108ShareSnapshot = (draftId: string) =>
  apiCall(() =>
    apiClient<{ snapshot: Record<string, unknown> }>(`/pilot108/individual/drafts/${draftId}/share-snapshot`, {
      method: "POST",
    }),
  );

export const pilot108ExportDocx = async (draftId: string): Promise<Blob> => {
  const token = getAuthToken();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "https://medmate-backend-k25riftvia-as.a.run.app"}/pilot108/individual/drafts/${draftId}/export-docx`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail || message;
    } catch {
      // ignore response parse errors
    }
    throw { status: response.status, message } as Pilot108ApiError;
  }

  return response.blob();
};
