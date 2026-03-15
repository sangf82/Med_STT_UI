'use client';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  pingServer,
  getIncompleteUploads,
  getChunkedUploadStatus,
  uploadChunkWithRetry,
  completeChunkedUpload,
  abandonUpload,
  normalizeOutputFormat,
} from '@/lib/api/sttMetrics';
import { getAuthToken } from '@/lib/auth';
import { db, cleanupUploadSession } from '@/lib/db';
import { useAppContext } from '@/context/AppContext';

export function BackgroundUploader() {
  const { setShowSurvey, setIsRecoveringUploads } = useAppContext();
  const isRunning = useRef(false);
  const hasLocalUploads = (useLiveQuery(() => db.uploads.count(), []) ?? 0) > 0;

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const runUploads = async () => {
      if (!getAuthToken()) return; // only call API when logged in
      // Prevent multiple overlaps
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        // 0. Confirm backend is reachable (khi deploy/restart pod, ping fail → return, cycle sau retry; session trong DB không mất, IndexedDB vẫn có chunk → recover được)
        const pingOk = await pingServer().catch(() => null);
        if (!pingOk) {
          isRunning.current = false;
          return;
        }
        // 1. Fetch incomplete uploads from BE (hoặc discover từ local nếu BE trả rỗng — recovery sau mất mạng/đóng tab)
        let uploads = (await getIncompleteUploads().catch(() => null))?.uploads ?? [];
        if (uploads.length === 0) {
          const localList = await db.uploads.toArray();
          const discovered: { upload_id: string; created_at?: string }[] = [];
          for (const meta of localList) {
            const statusRes = await getChunkedUploadStatus(meta.upload_id).catch(() => null);
            if ((statusRes as any)?.session?.status === 'uploading') discovered.push({ upload_id: meta.upload_id, created_at: meta.created_at });
          }
          uploads = discovered;
        }
        if (uploads.length === 0) {
          isRunning.current = false;
          return;
        }

        setIsRecoveringUploads(true);
        // 2. Try to resume each incomplete upload
        for (const item of uploads) {
          const localMeta = await db.uploads.where({ upload_id: item.upload_id }).first();
          if (!localMeta) {
            // No local chunks — check server session status before deciding
            const statusRes = await getChunkedUploadStatus(item.upload_id).catch(() => null);
            const sessionStatus = (statusRes as any)?.session?.status;
            if (sessionStatus === 'complete' || sessionStatus === 'abandoned') {
              // Session already handled server-side (job exists or was abandoned) — skip, don't call abandon again
              continue;
            }
            const createdAt = (item as { created_at?: string }).created_at;
            const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : Infinity;
            if (ageMs > 10 * 60 * 1000) {
              await abandonUpload(item.upload_id).catch(() => null);
            }
            continue;
          }

          const statusRes = await getChunkedUploadStatus(item.upload_id).catch(() => null);
          if (!statusRes) continue;
          const sessionStatus = (statusRes as any)?.session?.status;
          if (sessionStatus === 'complete') {
            // Already completed — job should exist. Just clean up local data.
            await cleanupUploadSession(item.upload_id);
            continue;
          }

          let chunkFailed = false;
          for (const chunkIndex of statusRes.missing_chunk_indexes) {
            const chunkData = await db.chunks.where({ upload_id: item.upload_id, chunk_index: chunkIndex }).first();
            if (!chunkData || !chunkData.blob) {
              // Chunk thiếu trên server và không còn trong IndexedDB → không khôi phục được, abandon để user ghi âm lại
              console.warn("Missing chunk locally, cannot recover", chunkIndex, item.upload_id);
              chunkFailed = true;
              await abandonUpload(item.upload_id).catch(() => null);
              await cleanupUploadSession(item.upload_id);
              break;
            }
            try {
              await uploadChunkWithRetry(item.upload_id, chunkIndex, chunkData.blob);
            } catch (e) {
              console.error("Chunk upload failed after retries", chunkIndex, e);
              chunkFailed = true;
              await abandonUpload(item.upload_id).catch(() => null);
              await cleanupUploadSession(item.upload_id);
              break;
            }
          }
          if (chunkFailed) {
            continue;
          }

          try {
            await completeChunkedUpload({
              upload_id: item.upload_id,
              session_id: localMeta.session_id,
              output_format: normalizeOutputFormat((localMeta as { output_format?: string; output_type?: string }).output_format ?? (localMeta as { output_type?: string }).output_type),
              record_id: (localMeta as { record_id?: string }).record_id,
            });
            await cleanupUploadSession(item.upload_id);
          } catch (e: any) {
            if (e?.status === 402) {
              setShowSurvey(true);
            }
            console.error("Failed to complete resumed upload", e);
          }
        }
      } catch (err: any) {
        if (err?.status === 402) {
          setShowSurvey(true);
        }
        console.error("Resume block error:", err);
      } finally {
        isRunning.current = false;
        setIsRecoveringUploads(false);
      }
    };

    const onTrigger = () => runUploads();
    /** Chrome mobile: khi quay lại tab từ app khác, chạy ngay + burst 2 lần nữa (1s, 2.5s) vì lần đầu có thể chạy trước khi tab thực sự active. */
    const visibleTimeoutRef = { current: [] as NodeJS.Timeout[] };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      visibleTimeoutRef.current.forEach(clearTimeout);
      visibleTimeoutRef.current = [];
      onTrigger();
      visibleTimeoutRef.current.push(setTimeout(onTrigger, 1000));
      visibleTimeoutRef.current.push(setTimeout(onTrigger, 2500));
    };
    const onPageShow = () => { onTrigger(); }; // bfcache restore (mobile: quay lại từ app khác)
    if (typeof window !== "undefined") {
      window.addEventListener("stt-trigger-upload", onTrigger);
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("online", onTrigger);
      window.addEventListener("pageshow", onPageShow);
    }
    runUploads();
    if (hasLocalUploads) {
      intervalId = setInterval(runUploads, 3000); // 3s khi còn upload pending (mobile: recover nhanh hơn sau khi quay lại)
    }

    return () => {
      if (intervalId != null) clearInterval(intervalId);
      visibleTimeoutRef.current.forEach(clearTimeout);
      visibleTimeoutRef.current = [];
      if (typeof window !== "undefined") {
        window.removeEventListener("stt-trigger-upload", onTrigger);
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("online", onTrigger);
        window.removeEventListener("pageshow", onPageShow);
      }
    };
  }, [hasLocalUploads]);

  return null; // pure headless component
}
