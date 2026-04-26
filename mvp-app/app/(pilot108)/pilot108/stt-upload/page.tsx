'use client';

/**
 * Ghi âm stream (chunk PUT liên tục + stream/end) hoặc upload file chia chunk + retry —
 * cùng backend /ai/stt/upload/* và queue AI. IndexedDB (lib/db) dự phòng recover / gửi lại chunk thiếu.
 */

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Mic, Square, Upload } from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import {
  sttGetJob,
  sttUploadChunkWithRetry,
  sttUploadComplete,
  sttUploadInit,
  sttUploadListIncomplete,
  sttUploadStatus,
  sttUploadStreamEnd,
  sttUploadStreamInit,
  type SttJob,
  type SttOutputFormat,
} from '@/lib/api/sttUpload';
import {
  addStreamChunk,
  cleanupUploadSession,
  db,
  saveStreamUploadMetadata,
  saveUploadSession,
} from '@/lib/db';

/** Match backend default `stt_upload_chunk_size_bytes` (524288) so init total_chunks stays consistent. */
const CHUNK_SIZE_DEFAULT = 524288;

const formats: { value: SttOutputFormat; label: string }[] = [
  { value: 'soap_note', label: 'SOAP' },
  { value: 'ehr', label: 'EHR' },
  { value: 'operative_note', label: 'Operative' },
  { value: 'to-do', label: 'To-do' },
];

function uid() {
  return crypto.randomUUID();
}

async function pollJob(jobId: string, onTick: (j: SttJob) => void): Promise<SttJob> {
  const deadline = Date.now() + 8 * 60 * 1000;
  for (;;) {
    const j = await sttGetJob(jobId);
    onTick(j);
    if (j.status === 'done' || j.status === 'failed') return j;
    if (Date.now() > deadline) throw new Error('Job poll timeout');
    await new Promise((r) => setTimeout(r, 1200));
  }
}

export default function Pilot108SttUploadPage() {
  const [outputFormat, setOutputFormat] = useState<SttOutputFormat>('to-do');
  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamOn, setStreamOn] = useState(false);
  const [job, setJob] = useState<SttJob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamUploadChainRef = useRef(Promise.resolve());
  const uploadCtxRef = useRef<{
    upload_id: string;
    record_id: string;
    chunk_index: number;
    started_at: number;
  } | null>(null);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => (prev ? `${prev}\n` : '') + line);
  }, []);

  const handleStreamStart = async () => {
    setBusy(true);
    setJob(null);
    setLog('');
    try {
      const session_id = uid();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const init = await sttUploadStreamInit({
        session_id,
        filename: 'stream.webm',
        output_format: outputFormat,
      });
      uploadCtxRef.current = {
        upload_id: init.upload_id,
        record_id: init.record_id,
        chunk_index: 0,
        started_at: Date.now(),
      };
      await saveStreamUploadMetadata({
        upload_id: init.upload_id,
        session_id,
        filename: 'stream.webm',
        total_chunks: 0,
        chunk_size: 1,
        output_format: outputFormat,
        format: 'todo',
      });
      pushLog(`stream/init → upload_id=${init.upload_id} record_id=${init.record_id}`);

      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = rec;
      streamUploadChainRef.current = Promise.resolve();

      rec.ondataavailable = (ev) => {
        if (ev.data.size === 0) return;
        const blob = ev.data;
        streamUploadChainRef.current = streamUploadChainRef.current
          .catch(() => {})
          .then(async () => {
            const ctx = uploadCtxRef.current;
            if (!ctx) return;
            const idx = ctx.chunk_index;
            await sttUploadChunkWithRetry(ctx.upload_id, idx, blob, `c${idx}.webm`);
            await addStreamChunk(ctx.upload_id, idx, blob).catch(() => {});
            ctx.chunk_index = idx + 1;
            pushLog(`chunk ${idx} ok (${blob.size} B)`);
          })
          .catch((e) => {
            pushLog(`chunk pipeline (dừng upload session này): ${String(e)}`);
            uploadCtxRef.current = null;
          });
      };

      rec.start(900);
      setStreamOn(true);
      pushLog('Recording… (Stop khi xong)');
    } catch (e) {
      pushLog(`Start failed: ${String(e)}`);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      uploadCtxRef.current = null;
    } finally {
      setBusy(false);
    }
  };

  const handleStreamStop = async () => {
    setBusy(true);
    try {
      const rec = mediaRecorderRef.current;
      const ctx = uploadCtxRef.current;
      if (rec && rec.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          rec.onstop = () => resolve();
          rec.stop();
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      await streamUploadChainRef.current.catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;

      if (!ctx) {
        pushLog('No active stream session');
        return;
      }
      const total = ctx.chunk_index;
      if (total < 1) {
        pushLog('Không có chunk âm thanh — ghi lại lâu hơn một chút.');
        uploadCtxRef.current = null;
        return;
      }
      const sec = (Date.now() - ctx.started_at) / 1000;
      pushLog(`stream/end total_chunks=${total} …`);
      const end = await sttUploadStreamEnd({
        upload_id: ctx.upload_id,
        record_id: ctx.record_id,
        total_chunks: total,
        output_format: outputFormat,
        recording_duration_sec: sec,
      });
      uploadCtxRef.current = null;
      pushLog(`Queued job_id=${end.job_id}`);
      const finalJob = await pollJob(end.job_id, setJob);
      pushLog(`Job ${finalJob.status}`);
      await cleanupUploadSession(end.upload_id).catch(() => {});
    } catch (e) {
      pushLog(`Stop/end failed: ${String(e)}`);
    } finally {
      setStreamOn(false);
      setBusy(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async () => {
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      pushLog('Chọn file âm thanh trước.');
      return;
    }
    setBusy(true);
    setJob(null);
    setLog('');
    const session_id = uid();
    let upload_id = '';
    try {
      const preTotal = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_DEFAULT));
      const init = await sttUploadInit({
        session_id,
        filename: file.name || 'audio.m4a',
        total_chunks: preTotal,
        chunk_size: CHUNK_SIZE_DEFAULT,
        output_format: outputFormat,
        recording_duration_sec: undefined,
      });
      upload_id = init.upload_id;
      const sliceSize = init.chunk_size;
      const total_chunks = Math.max(1, Math.ceil(file.size / sliceSize));
      if (sliceSize !== CHUNK_SIZE_DEFAULT || total_chunks !== preTotal) {
        throw new Error(
          `chunk_size/total_chunks không khớp (server=${sliceSize}, cần ${total_chunks} chunk, đã init ${preTotal}). Hãy thử lại.`,
        );
      }
      pushLog(`init → upload_id=${init.upload_id} chunk_size=${sliceSize} total_chunks=${total_chunks}`);

      await saveUploadSession(
        {
          upload_id: init.upload_id,
          session_id,
          filename: file.name || 'audio',
          total_chunks,
          chunk_size: sliceSize,
          output_format: outputFormat,
          format: 'todo',
          record_id: init.record_id,
        },
        file,
      );

      for (let i = 0; i < total_chunks; i++) {
        const start = i * sliceSize;
        const end = Math.min(start + sliceSize, file.size);
        const blob = file.slice(start, end);
        await sttUploadChunkWithRetry(init.upload_id, i, blob, `chunk-${i}`);
        pushLog(`chunk ${i + 1}/${total_chunks} uploaded`);
      }

      const done = await sttUploadComplete({
        upload_id: init.upload_id,
        record_id: init.record_id,
        output_format: outputFormat,
      });
      pushLog(`complete → job_id=${done.job_id}`);
      const finalJob = await pollJob(done.job_id, setJob);
      pushLog(`Job ${finalJob.status}`);
      await cleanupUploadSession(init.upload_id).catch(() => {});
      if (input) input.value = '';
    } catch (e) {
      pushLog(`File upload failed: ${String(e)}`);
      if (upload_id) await cleanupUploadSession(upload_id).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const handleResumeIncomplete = async () => {
    setBusy(true);
    setLog('');
    try {
      const { uploads } = await sttUploadListIncomplete();
      if (!uploads?.length) {
        pushLog('Không có upload đang dở trên server.');
        return;
      }
      for (const row of uploads) {
        const upload_id = String((row as { upload_id?: string }).upload_id || '');
        if (!upload_id) continue;
        const { missing_chunk_indexes } = await sttUploadStatus(upload_id);
        if (!missing_chunk_indexes?.length) {
          pushLog(`${upload_id}: không thiếu chunk`);
          continue;
        }
        pushLog(`${upload_id}: thiếu ${missing_chunk_indexes.length} chunk — thử gửi lại từ IndexedDB…`);
        for (const idx of missing_chunk_indexes) {
          const local = await db.chunks
            .where('upload_id')
            .equals(upload_id)
            .filter((c) => c.chunk_index === idx)
            .first();
          if (!local?.blob) {
            pushLog(`  chunk ${idx}: không có trong trình duyệt (IndexedDB)`);
            continue;
          }
          await sttUploadChunkWithRetry(upload_id, idx, local.blob, `retry-${idx}`);
          pushLog(`  chunk ${idx}: đã gửi lại`);
        }
        const again = await sttUploadStatus(upload_id);
        if (!again.missing_chunk_indexes?.length) {
          pushLog(`${upload_id}: đủ chunk — bấm Complete trên UI cũ hoặc gọi API complete nếu session chunked.`);
        }
      }
    } catch (e) {
      pushLog(`Resume: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const card = 'overflow-hidden rounded-lg border border-[#CBD5E1] bg-white';
  const head = 'border-b border-[#CBD5E1] bg-white px-4 py-3';
  const h2 =
    'text-[15px] font-semibold tracking-tight text-[#020617] [font-family:var(--font-p108-newsreader),Newsreader,serif]';
  const sub = 'mt-0.5 text-xs text-[#64748B] [font-family:var(--font-p108-be),sans-serif]';
  const btn =
    'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#219EBC] px-4 text-sm font-medium text-white transition hover:bg-[#1a8bab] disabled:opacity-50 [font-family:var(--font-p108-be),sans-serif]';
  const btnOutline =
    'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm font-medium text-[#003554] transition hover:bg-[#F1F5F9] disabled:opacity-50 [font-family:var(--font-p108-be),sans-serif]';

  return (
    <P108Shell sessionTitle="STT · stream & file" showSessionBadge={false}>
      <div className="mx-auto max-w-lg space-y-4 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/pilot108"
            className="text-sm font-medium text-[#219EBC] hover:underline [font-family:var(--font-p108-be),sans-serif]"
          >
            ← Pilot hub
          </Link>
          <select
            className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 text-sm text-[#0F172A]"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as SttOutputFormat)}
          >
            {formats.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <section className={card}>
          <div className={head}>
            <h2 className={h2}>Stream ghi âm → AI</h2>
            <p className={sub}>POST stream/init, PUT từng chunk (retry), POST stream/end → job queue.</p>
          </div>
          <div className="flex flex-wrap gap-3 p-4">
            <button
              type="button"
              className={btn}
              disabled={busy || streamOn}
              onClick={() => void handleStreamStart()}
            >
              {busy && !streamOn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              Start
            </button>
            <button
              type="button"
              className={btnOutline}
              disabled={busy || !streamOn}
              onClick={() => void handleStreamStop()}
            >
              {busy && streamOn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Stop &amp; gửi AI
            </button>
          </div>
        </section>

        <section className={card}>
          <div className={head}>
            <h2 className={h2}>Upload file (chunk + retry)</h2>
            <p className={sub}>POST init, PUT chunk có retry, POST complete. Lưu chunk vào IndexedDB để resume.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <input ref={fileInputRef} type="file" accept="audio/*,.m4a,.webm,.mp3,.wav,.ogg" className="text-sm" />
            <button type="button" className={btn} disabled={busy} onClick={() => void handleFileUpload()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </button>
          </div>
        </section>

        <section className={card}>
          <div className={head}>
            <h2 className={h2}>Resume chunk thiếu</h2>
            <p className={sub}>GET incomplete + status; gửi lại chunk thiếu từ IndexedDB (cùng máy đã lưu).</p>
          </div>
          <div className="p-4">
            <button type="button" className={btnOutline} disabled={busy} onClick={() => void handleResumeIncomplete()}>
              Quét &amp; gửi lại chunk thiếu
            </button>
          </div>
        </section>

        <section className={card}>
          <div className={head}>
            <h2 className={h2}>Log</h2>
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-xs text-[#475569]">
            {log || '—'}
          </pre>
        </section>

        {job ? (
          <section className={card}>
            <div className={head}>
              <h2 className={h2}>Job: {job.status}</h2>
              <p className={sub}>id={job.id}</p>
            </div>
            <pre className="max-h-64 overflow-auto p-4 font-mono text-xs text-[#475569]">
              {JSON.stringify(job, null, 2)}
            </pre>
          </section>
        ) : null}
      </div>
    </P108Shell>
  );
}
