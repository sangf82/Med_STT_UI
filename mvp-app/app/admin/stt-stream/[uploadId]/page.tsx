'use client';

/**
 * Admin-only: listen to live STT stream upload (same chunks as clinician) + session display_name.
 * Open: /admin/stt-stream/{upload_id} (upload_id from recording screen link).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import {
  adminStreamLiveSseUrl,
  fetchAdminAssembledAudio,
  fetchAdminStreamSnapshot,
  type AdminStreamUploadSnapshot,
} from '@/lib/api/sttAdminStreamSession';

export default function AdminSttStreamMonitorPage() {
  const params = useParams();
  const uploadId = String(params.uploadId || '');
  const [snap, setSnap] = useState<AdminStreamUploadSnapshot | null>(null);
  const [err, setErr] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const lastPairRef = useRef<{ max: number; cnt: number }>({ max: -1, cnt: -1 });

  const refreshAudio = useCallback(
    async (maxChunk: number, storedCount: number) => {
      if (!uploadId || maxChunk < 0) return;
      const prev = lastPairRef.current;
      if (prev.max === maxChunk && prev.cnt === storedCount) return;
      lastPairRef.current = { max: maxChunk, cnt: storedCount };
      try {
        const blob = await fetchAdminAssembledAudio(uploadId, maxChunk);
        const url = URL.createObjectURL(blob);
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = url;
        const el = audioRef.current;
        if (el) {
          const wasPlaying = !el.paused && el.currentTime > 0;
          el.src = url;
          el.load();
          if (wasPlaying) void el.play().catch(() => {});
        }
      } catch {
        /* partial blob may fail briefly */
      }
    },
    [uploadId],
  );

  useEffect(() => {
    if (!uploadId) return;
    const t = getAuthToken();
    if (!t) {
      setErr('Cần đăng nhập (token admin).');
      return;
    }
    setErr('');
    lastPairRef.current = { max: -1, cnt: -1 };
    fetchAdminStreamSnapshot(uploadId)
      .then((s) => {
        setSnap(s);
        const mx = typeof s.max_chunk_index === 'number' ? s.max_chunk_index : -1;
        const cnt = typeof s.stored_chunk_count === 'number' ? s.stored_chunk_count : 0;
        if (mx >= 0) void refreshAudio(mx, cnt);
      })
      .catch((e: { message?: string }) => setErr(e?.message || '403/404 — kiểm tra quyền admin và upload_id'));

    const url = adminStreamLiveSseUrl(uploadId, t, 400);
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data) as Record<string, unknown>;
        if (d.error) return;
        setSnap((prev) => ({ ...(prev || {}), ...d }) as AdminStreamUploadSnapshot);
        const mx = typeof d.max_chunk_index === 'number' ? d.max_chunk_index : -1;
        const cnt = typeof d.stored_chunk_count === 'number' ? d.stored_chunk_count : 0;
        if (mx >= 0) void refreshAudio(mx, cnt);
      } catch {
        /* ignore */
      }
    };
    return () => {
      es.close();
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = null;
    };
  }, [uploadId, refreshAudio]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-lg font-semibold text-zinc-900">Admin · Nghe stream STT live</h1>
      <p className="font-mono text-xs text-zinc-500">upload_id: {uploadId}</p>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {snap ? (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800 shadow-sm">
          <p>
            <span className="text-zinc-500">display_name:</span>{' '}
            <span className="font-medium">{snap.display_name || '—'}</span>
          </p>
          <p className="text-xs text-zinc-500">
            Chunks: {snap.stored_chunk_count ?? 0} · max_idx {snap.max_chunk_index ?? '—'} · {snap.status ?? '—'}
          </p>
        </div>
      ) : null}
      <audio ref={audioRef} controls className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1" />
      <p className="text-xs text-zinc-500">
        Audio = ghép các chunk đã lên server (tăng dần theo SSE). Dùng để đối chiếu với transcript AI / tên bệnh nhân.
      </p>
    </div>
  );
}
