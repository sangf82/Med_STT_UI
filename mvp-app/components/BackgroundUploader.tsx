'use client';

import { useEffect, useRef } from 'react';
import { 
  getIncompleteUploads, 
  getChunkedUploadStatus, 
  uploadChunk, 
  completeChunkedUpload,
  abandonUpload
} from '@/lib/api/sttMetrics';
import { db, cleanupUploadSession } from '@/lib/db';

export function BackgroundUploader() {
  const isRunning = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const runUploads = async () => {
      // Prevent multiple overlaps
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        // 1. Fetch incomplete uploads from BE
        const res = await getIncompleteUploads().catch(() => null);
        if (!res || !res.items || res.items.length === 0) {
          isRunning.current = false;
          return; // nothing to do
        }

        // 2. Try to resume each incomplete upload
        for (const item of res.items) {
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
              format_type: localMeta.format_type
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

    // Run string on mount to recover, and poll periodically
    runUploads();
    intervalId = setInterval(runUploads, 30000); // Check every 30s

    return () => clearInterval(intervalId);
  }, []);

  return null; // pure headless component
}
