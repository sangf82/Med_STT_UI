import { apiClient } from "../apiClient";

export type ThongTinEntry = {
  id: string;
  user_id?: string;
  name: string;
  thong_tin: string;
  created_at?: string;
  updated_at?: string;
};

export const createThongTinEntry = (body: { name: string; thong_tin?: string }) =>
  apiClient<ThongTinEntry>("/thong-tin/entries", {
    method: "POST",
    body: JSON.stringify({ name: body.name, thong_tin: body.thong_tin ?? "" }),
  });

export const listThongTinEntries = (params?: { name?: string; limit?: number }) => {
  const q: Record<string, string> = {};
  if (params?.name?.trim()) q.name = params.name.trim();
  if (params?.limit != null) q.limit = String(params.limit);
  return apiClient<{ items: ThongTinEntry[] }>("/thong-tin/entries", { params: q });
};

export const getThongTinEntry = (id: string) =>
  apiClient<ThongTinEntry>(`/thong-tin/entries/${encodeURIComponent(id)}`);

export const deleteThongTinEntry = (id: string) =>
  apiClient<void>(`/thong-tin/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
