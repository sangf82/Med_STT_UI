'use client';

import { useEffect, useRef } from 'react';
import { 
  pingServer,
  getIncompleteUploads, 
  getChunkedUploadStatus, 
  uploadChunk, 
  completeChunkedUpload,
  abandonUpload,
  getSttJobStatus,
  updateRecord
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
            const completeRes = await completeChunkedUpload({
              upload_id: item.upload_id,
              output_format: localMeta.format_type,
              display_name: localMeta.filename // Ensures custom names reach the backend
            });
            // If complete succeeds, remove from IndexedDB
            await cleanupUploadSession(item.upload_id);

            // The backend might not apply display_name or format correctly until the job completes.
            // Start a non-blocking background poll to update the record with the latest config once done.
            if (completeRes.job_id) {
               const pollAndUpdateRecord = async (jobId: string, name: string) => {
                  let attempts = 0;
                  while (attempts < 120) { // Up to 10 minutes (5s interval)
                     await new Promise(r => setTimeout(r, 5000));
                     const jobRes = await getSttJobStatus(jobId).catch(() => null);
                     if (jobRes?.status === 'done') {
                        if (jobRes.result?.record_id) {
                           await updateRecord(jobRes.result.record_id, {
                              display_name: name,
                              content: jobRes.result.refined_text || jobRes.result.raw_text || ""
                           }).catch((e) => console.error("Poll update name failed:", e));
                        }
                        break;
                     } else if (jobRes?.status === 'failed') {
                        break;
                     }
                     attempts++;
                  }
               };
               // Do not await this so interval doesn't block!
               pollAndUpdateRecord(completeRes.job_id, localMeta.filename);
            }
          } catch (e) {
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

    // Run on mount and every 5s so async saves (init + IDB then redirect) get uploaded quickly
    runUploads();
    intervalId = setInterval(runUploads, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // pure headless component
}
