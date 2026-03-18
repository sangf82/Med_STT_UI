'use client';

const STT_LOG = '[STT]';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  pingServer,
  getIncompleteUploads,
  getChunkedUploadStatus,
  uploadChunkWithRetry,
  streamEndUpload,
  abandonUpload,
  normalizeOutputFormat,
} from '@/lib/api/sttMetrics';
import { getAuthToken } from '@/lib/auth';
import { db, cleanupUploadSession } from '@/lib/db';
import { useAppContext } from '@/context/AppContext';

export function BackgroundUploader() {
  const { setShowSurvey, setIsRecoveringUploads, activeUploadIds } = useAppContext();
  const isRunning = useRef(false);
  const activeIdsRef = useRef(activeUploadIds);
  activeIdsRef.current = activeUploadIds;
  const hasLocalUploads = (useLiveQuery(() => db.uploads.count(), []) ?? 0) > 0;

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const runUploads = async () => {
      if (!getAuthToken()) return;
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        const pingOk = await pingServer().catch(() => null);
        if (!pingOk) {
          isRunning.current = false;
          return;
        }

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

        const currentActiveIds = activeIdsRef.current;
        const filteredUploads = uploads.filter((u: { upload_id?: string }) => !u.upload_id || !currentActiveIds.has(u.upload_id));
        if (filteredUploads.length === 0) {
          isRunning.current = false;
          return;
        }
        console.info(STT_LOG, { flow: 'recover_start', upload_count: filteredUploads.length, upload_ids: filteredUploads.map((u: { upload_id?: string }) => u.upload_id), skipped_active: [...currentActiveIds] });
        setIsRecoveringUploads(true);

        for (const item of filteredUploads) {
          const localMeta = await db.uploads.where({ upload_id: item.upload_id }).first();
          if (localMeta) {
            const updatedAt = (localMeta as any).updated_at || localMeta.created_at;
            const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;
            if (ageMs < 15000) {
              console.info(STT_LOG, { flow: 'recover_skip_active_tab', upload_id: item.upload_id, ageMs });
              continue; // Actively being recorded in another tab
            }
          }

          if (!localMeta) {
            const statusRes = await getChunkedUploadStatus(item.upload_id).catch(() => null);
            const sessionStatus = (statusRes as any)?.session?.status;
            if (sessionStatus === 'complete' || sessionStatus === 'abandoned') {
              continue;
            }
            // No local data, check if it's old enough to abandon (15 minutes)
            const createdAt = (item as any).created_at;
            const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : Infinity;
            if (ageMs > 15 * 60 * 1000) {
              console.info(STT_LOG, { flow: 'recover_abandon_old', upload_id: item.upload_id, ageMs });
              await abandonUpload(item.upload_id).catch(() => null);
            }
            continue;
          }

          const statusRes = await getChunkedUploadStatus(item.upload_id).catch(() => null);
          if (!statusRes) continue;
          const session = (statusRes as { session?: { status?: string; total_chunks?: number } }).session;
          const sessionStatus = session?.status;
          if (sessionStatus === 'complete') {
            console.info(STT_LOG, { flow: 'recover_cleanup', upload_id: item.upload_id, reason: 'session_complete' });
            await cleanupUploadSession(item.upload_id);
            continue;
          }
          if (sessionStatus === 'abandoned') {
            console.info(STT_LOG, { flow: 'recover_cleanup', upload_id: item.upload_id, reason: 'session_abandoned' });
            await cleanupUploadSession(item.upload_id);
            continue;
          }

          const isStreamSession = session?.total_chunks === 0;
          const recordId = (localMeta as { record_id?: string }).record_id;

          if (isStreamSession) {
            const localChunks = await db.chunks.where({ upload_id: item.upload_id }).sortBy('chunk_index');
            console.info(STT_LOG, { flow: 'recover_stream', upload_id: item.upload_id, record_id: recordId, local_chunk_count: localChunks.length });
            if (localChunks.length === 0) {
              console.warn(STT_LOG, { flow: 'recover_stream', upload_id: item.upload_id, error: 'no local chunks, abandon' });
              await abandonUpload(item.upload_id).catch(() => null);
              await cleanupUploadSession(item.upload_id);
              continue;
            }
            let streamChunkFailed = false;
            for (const c of localChunks) {
              if (!c.blob) {
                streamChunkFailed = true;
                break;
              }
              try {
                await uploadChunkWithRetry(item.upload_id, c.chunk_index, c.blob);
              } catch (e) {
                console.error(STT_LOG, { flow: 'recover_stream', upload_id: item.upload_id, record_id: recordId, chunk_index: c.chunk_index, error: String((e as Error)?.message ?? e) });
                streamChunkFailed = true;
                break;
              }
            }
            if (streamChunkFailed) continue;
            try {
              await streamEndUpload({
                upload_id: item.upload_id,
                total_chunks: localChunks.length,
                record_id: recordId,
                output_format: normalizeOutputFormat((localMeta as { output_format?: string }).output_format ?? 'soap_note'),
                recording_duration_sec: (localMeta as any).duration_sec,
                display_name: (localMeta as any).display_name,
              });
              await cleanupUploadSession(item.upload_id);
              console.info(STT_LOG, { flow: 'recover_stream', upload_id: item.upload_id, record_id: recordId, total_chunks: localChunks.length, status: 'ok' });
            } catch (e: any) {
              if (e?.status === 402) setShowSurvey(true);
              console.error(STT_LOG, { flow: 'recover_stream', upload_id: item.upload_id, record_id: recordId, error: String(e?.message ?? e), status: e?.status });
            }
            continue;
          }

          // Legacy chunked upload path (non-stream) — just clean up local data if session is done
          console.info(STT_LOG, { flow: 'recover_chunked_skip', upload_id: item.upload_id, reason: 'legacy_chunked_not_supported' });
          await cleanupUploadSession(item.upload_id);
        }
      } catch (err: any) {
        if (err?.status === 402) setShowSurvey(true);
        console.error(STT_LOG, { flow: 'recover', error: String(err?.message ?? err) });
      } finally {
        isRunning.current = false;
        setIsRecoveringUploads(false);
      }
    };

    const onTrigger = () => runUploads();
    const visibleTimeoutRef = { current: [] as NodeJS.Timeout[] };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      visibleTimeoutRef.current.forEach(clearTimeout);
      visibleTimeoutRef.current = [];
      onTrigger();
      visibleTimeoutRef.current.push(setTimeout(onTrigger, 1000));
      visibleTimeoutRef.current.push(setTimeout(onTrigger, 2500));
    };
    const onPageShow = () => { onTrigger(); };
    if (typeof window !== "undefined") {
      window.addEventListener("stt-trigger-upload", onTrigger);
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("online", onTrigger);
      window.addEventListener("pageshow", onPageShow);
    }
    runUploads();
    if (hasLocalUploads) {
      intervalId = setInterval(runUploads, 3000);
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

  return null;
}
