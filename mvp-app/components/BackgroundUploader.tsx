'use client';

import { useEffect, useRef } from 'react';
import { 
  pingServer,
  getIncompleteUploads, 
  getChunkedUploadStatus, 
  uploadChunk, 
  completeChunkedUpload,
  abandonUpload
} from '@/lib/api/sttMetrics';
import { getAuthToken } from '@/lib/auth';
import { db, cleanupUploadSession } from '@/lib/db';

export function BackgroundUploader() {
  const isRunning = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const runUploads = async () => {
      if (!getAuthToken()) return; // only call API when logged in
      // Prevent multiple overlaps
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        // 0. Confirm backend is reachable (design: gọi /ping trước khi /incomplete)
        const pingOk = await pingServer().catch(() => null);
        if (!pingOk) {
          isRunning.current = false;
          return;
        }
        // 1. Fetch incomplete uploads from BE
        const res = await getIncompleteUploads().catch(() => null);
        const uploads = res?.uploads ?? [];
        if (uploads.length === 0) {
          isRunning.current = false;
          return; // nothing to do
        }

        // 2. Try to resume each incomplete upload
        for (const item of uploads) {
          // Verify if we have this upload in local indexedDB
          const localMeta = await db.uploads.where({ upload_id: item.upload_id }).first();
          if (!localMeta) {
            // We don't have the blob on this device, let's abandon it so it stops showing up
            // Or maybe it's on another device? Standard flow: if we don't have it, abandon.
            await abandonUpload(item.upload_id).catch(() => null);
            continue;
          }

          // Fetch the missing chunk indexes
          const statusRes = await getChunkedUploadStatus(item.upload_id).catch(() => null);
          if (!statusRes) continue;

          for (const chunkIndex of statusRes.missing_chunk_indexes) {
            const chunkData = await db.chunks.where({ upload_id: item.upload_id, chunk_index: chunkIndex }).first();
            if (chunkData && chunkData.blob) {
              await uploadChunk(item.upload_id, chunkIndex, chunkData.blob).catch((e) => console.error("Chunk failed", e));
            }
          }

          // Finally try to complete
          try {
            await completeChunkedUpload({
              upload_id: item.upload_id,
              session_id: localMeta.session_id,
              format_type: localMeta.format_type,
              display_name: (localMeta as { display_name?: string }).display_name,
            });
            // If complete succeeds, remove from IndexedDB
            await cleanupUploadSession(item.upload_id);
          } catch (e: any) {
            console.error("Failed to complete resumed upload", e);
             // If error is 400 with missing chunks, it will just retry next interval
          }
        }
      } catch (err) {
        console.error("Resume block error:", err);
      } finally {
        isRunning.current = false;
      }
    };

    const onTrigger = () => runUploads();
    if (typeof window !== "undefined") {
      window.addEventListener("stt-trigger-upload", onTrigger);
    }
    runUploads();
    intervalId = setInterval(runUploads, 5000);

    return () => {
      clearInterval(intervalId);
      if (typeof window !== "undefined") {
        window.removeEventListener("stt-trigger-upload", onTrigger);
      }
    };
  }, []);

  return null; // pure headless component
}
