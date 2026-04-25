import Dexie, { type EntityTable } from "dexie";

export interface UploadMetadata {
  id?: number;
  upload_id: string;
  session_id: string;
  filename: string;
  total_chunks: number;
  chunk_size: number;
  created_at: string;
  updated_at?: string;
  output_format: string; // only "soap_note" | "ehr" | "to-do" (match AI/backend)
  format: string; // UI key only: "soap" | "clinical" | "todo"
  display_name?: string;
  record_id?: string;
  duration_sec?: number;
}

export interface UploadChunk {
  id?: number;
  upload_id: string;
  chunk_index: number;
  blob: Blob;
}

export const db = new Dexie("MedSTTDatabase") as Dexie & {
  uploads: EntityTable<UploadMetadata, "id">;
  chunks: EntityTable<UploadChunk, "id">;
};

db.version(1).stores({
  uploads: "++id, upload_id, session_id",
  chunks: "++id, upload_id, [upload_id+chunk_index]",
});

db.version(2).stores({
  uploads: "++id, upload_id, session_id",
  chunks: "++id, upload_id, [upload_id+chunk_index]",
});

export const saveUploadSession = async (
  metadata: Omit<UploadMetadata, "id" | "created_at">,
  audioBlob: Blob,
) => {
  await db.transaction("rw", db.uploads, db.chunks, async () => {
    // Save metadata
    await db.uploads.add({
      ...metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Slice and save chunks
    const chunkCount = Math.ceil(audioBlob.size / metadata.chunk_size);
    const chunks: Omit<UploadChunk, "id">[] = [];

    for (let i = 0; i < chunkCount; i++) {
      const start = i * metadata.chunk_size;
      const end = Math.min(start + metadata.chunk_size, audioBlob.size);
      chunks.push({
        upload_id: metadata.upload_id,
        chunk_index: i,
        blob: audioBlob.slice(start, end),
      });
    }

    await db.chunks.bulkAdd(chunks);
  });
};

export const cleanupUploadSession = async (upload_id: string) => {
  await db.transaction("rw", db.uploads, db.chunks, async () => {
    await db.uploads.where({ upload_id }).delete();
    await db.chunks.where({ upload_id }).delete();
  });
};

/** Stream mode: save metadata at init (total_chunks=0). Chunks added via addStreamChunk. Dự phòng recover nếu stream lỗi. */
export const saveStreamUploadMetadata = async (
  metadata: Omit<UploadMetadata, "id" | "created_at">,
) => {
  await db.uploads.add({
    ...metadata,
    total_chunks: metadata.total_chunks ?? 0,
    chunk_size: metadata.chunk_size ?? 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

/** Stream mode: add one chunk to IndexedDB (backup for recovery). */
export const addStreamChunk = async (
  upload_id: string,
  chunk_index: number,
  blob: Blob,
) => {
  await db.transaction("rw", db.uploads, db.chunks, async () => {
    await db.chunks.add({ upload_id, chunk_index, blob });
    await db.uploads.where({ upload_id }).modify({ updated_at: new Date().toISOString() });
  });
};

/** Retention for local upload chunks so we can recover after mất mạng / chuyển tab / thoát trình duyệt (cùng thiết bị). */
export const UPLOAD_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

/** Remove upload sessions older than maxAgeMs. Use 24h so recovery works when user returns after closing tab/browser. */
export const clearStaleUploadSessions = async (maxAgeMs: number = UPLOAD_SESSION_MAX_AGE_MS) => {
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  const all = await db.uploads.toArray();
  const stale = all.filter((u) => (u.created_at || "") < cutoff);
  await db.transaction("rw", db.uploads, db.chunks, async () => {
    for (const u of stale) {
      await db.uploads.where("upload_id").equals(u.upload_id).delete();
      await db.chunks.where("upload_id").equals(u.upload_id).delete();
    }
  });
};
