import Dexie, { type EntityTable } from "dexie";

export interface UploadMetadata {
  id?: number;
  upload_id: string;
  session_id: string;
  filename: string;
  total_chunks: number;
  chunk_size: number;
  created_at: string;
  format_type: string;
  format: string; // "clinical", "todo", "none", etc.
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

export const saveUploadSession = async (
  metadata: Omit<UploadMetadata, "id" | "created_at">,
  audioBlob: Blob,
) => {
  await db.transaction("rw", db.uploads, db.chunks, async () => {
    // Save metadata
    await db.uploads.add({
      ...metadata,
      created_at: new Date().toISOString(),
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
