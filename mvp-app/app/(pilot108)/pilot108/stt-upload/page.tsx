'use client';

/**
 * Pilot 108 BDD capture: record audio, call P108 AI step1/step2, then create a checklist draft.
 * This page must not use legacy `/ai/stt/upload/stream/init` because that quota flow is outside P108 BDD.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import { P108TerminalLog } from '@/components/medmate/P108TerminalLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  addLiveCandidate,
  closeLiveSession,
  getLiveAnswer,
  getLiveCandidates,
  initLiveSession,
  postLiveOffer,
} from '@/lib/api/sttAdminStreamSession';
import {
  P108MobileTopBar,
  P108PhoneFrame,
  P108ProcessingSteps,
  P108RecordingControls,
  P108Waveform,
  p108Be,
  p108Mono,
  p108News,
} from '@/components/pilot108/P108Design';
import { PILOT108_INDIVIDUAL_BDD as BDD } from '@/lib/bdd/pilot108IndividualBdd';
import { pilot108CreateDraft } from '@/lib/api/pilot108Individual';
import { getAuthToken } from '@/lib/auth';
import { setP108LiveSessionId } from '@/lib/p108LiveSession';
import { cn } from '@/lib/utils';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://medmate-backend-k25riftvia-as.a.run.app';

type P108Step1Heard = {
  patient_code: string;
  spoken_name?: string;
  confidence?: number;
};

type P108Step1Response = {
  heard?: P108Step1Heard[];
  raw_transcript?: string;
};

type P108Step2ChecklistItem = {
  id: string;
  text: string;
  patient_code?: string;
  patient_name?: string;
};

type P108Step2Response = {
  checklist?: P108Step2ChecklistItem[];
};

function uid() {
  return crypto.randomUUID();
}

async function p108Fetch(path: string, init: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers: HeadersInit = { ...(init.headers as HeadersInit | undefined) };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail || response.statusText);
  }
  return response.json() as Promise<T>;
}

export default function Pilot108SttUploadPage() {
  const router = useRouter();
  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamOn, setStreamOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [draftId, setDraftId] = useState('');
  const [stepResult, setStepResult] = useState<P108Step2Response | null>(null);
  const [liveSessionId, setLiveSessionId] = useState('');
  const [liveStatus, setLiveStatus] = useState('Sẵn sàng ghi — chưa bật micro');
  /** Server pipeline (step1 → step2 → draft); null = không chạy AI. */
  const [processingStepIndex, setProcessingStepIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const p108AudioChunksRef = useRef<Blob[]>([]);
  const uploadCtxRef = useRef<{ upload_id: string; record_id: string; started_at: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const livePcRef = useRef<RTCPeerConnection | null>(null);
  const livePollRef = useRef<number | null>(null);
  const answererSeqRef = useRef(0);

  useEffect(() => {
    if (!streamOn || paused) return;
    const started = uploadCtxRef.current?.started_at || Date.now();
    const id = window.setInterval(() => setElapsedMs(Date.now() - started), 250);
    return () => window.clearInterval(id);
  }, [streamOn, paused]);

  const captureSubtitle = useMemo(() => {
    if (processingStepIndex !== null) return BDD.processingSteps[processingStepIndex] ?? 'Đang xử lý…';
    if (streamOn) return paused ? 'Tạm dừng ghi' : 'Đang ghi âm';
    return 'Sẵn sàng';
  }, [paused, processingStepIndex, streamOn]);

  const timerLabel = useMemo(() => {
    const total = Math.max(0, Math.floor(elapsedMs / 1000));
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    const tenth = Math.floor((elapsedMs % 1000) / 100);
    return `${minutes}:${seconds}.${tenth}`;
  }, [elapsedMs]);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => (prev ? `${prev}\n` : '') + line);
  }, []);

  const cleanupLiveAudio = useCallback(async () => {
    if (livePollRef.current) {
      window.clearInterval(livePollRef.current);
      livePollRef.current = null;
    }
    const pc = livePcRef.current;
    livePcRef.current = null;
    if (pc) pc.close();
    const id = liveSessionId;
    if (id) {
      await closeLiveSession(id).catch(() => {});
    }
    setP108LiveSessionId(null);
    setLiveSessionId('');
    setLiveStatus('Live: đã đóng');
  }, [liveSessionId]);

  const startLiveAudioOffer = useCallback(
    async (stream: MediaStream) => {
      const live = await initLiveSession('Pilot 108 live recording');
      const sessionId = live.live_session_id;
      setLiveSessionId(sessionId);
      setP108LiveSessionId(sessionId);
      setLiveStatus('Live: phiên đã tạo — chờ admin bắt tay nối');
      answererSeqRef.current = 0;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      livePcRef.current = pc;
      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        void addLiveCandidate(sessionId, 'offerer', event.candidate.toJSON()).catch(() => {});
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await postLiveOffer(sessionId, { type: 'offer', sdp: offer.sdp || '' });
      setLiveStatus('Live: đã gửi offer — chờ admin');

      livePollRef.current = window.setInterval(() => {
        void (async () => {
          try {
            const answer = await getLiveAnswer(sessionId);
            if (answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              setLiveStatus('Live: admin đã kết nối');
            }
            const candidates = await getLiveCandidates(sessionId, 'answerer', answererSeqRef.current);
            for (const candidate of candidates) {
              answererSeqRef.current = Math.max(answererSeqRef.current, candidate.seq);
              await pc.addIceCandidate({
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
                usernameFragment: candidate.usernameFragment,
              });
            }
          } catch {
            /* keep live polling while recording */
          }
        })();
      }, 1200);
    },
    [],
  );

  const processP108Audio = useCallback(
    async (audio: File) => {
      try {
      setProcessingStepIndex(0);
      pushLog('P108 step1-hear → sending audio');
      const formData = new FormData();
      formData.set('thread_id', uid());
      formData.set('audio', audio, audio.name);
      formData.set(
        'patient_contexts',
        JSON.stringify([
          { patient_name: 'Nguyễn Văn Tuấn', summary: '', latest: '' },
          { patient_name: 'Trần Thị Lan', summary: '', latest: '' },
        ]),
      );
      const step1 = await readJsonOrThrow<P108Step1Response>(
        await p108Fetch('/internal/ai/p108/step1-hear', { method: 'POST', body: formData }),
      );
      const heard = Array.isArray(step1.heard) ? step1.heard : [];
      pushLog(`P108 step1-hear ← heard ${heard.length} patient(s)`);
      const actual_patients = heard.map((row) => ({
        patient_code: row.patient_code,
        patient_name: row.spoken_name || '',
        summary: '',
        latest: '',
      }));
      setProcessingStepIndex(1);
      const step2 = await readJsonOrThrow<P108Step2Response>(
        await p108Fetch('/internal/ai/p108/step2-resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thread_id: formData.get('thread_id'), actual_patients }),
        }),
      );
      const checklist = Array.isArray(step2.checklist) ? step2.checklist : [];
      setStepResult(step2);
      pushLog(`P108 step2-resolve ← checklist ${checklist.length} item(s)`);
      if (!checklist.length) {
        throw new Error('P108 AI did not return checklist items');
      }
      setProcessingStepIndex(2);
      const draft = await pilot108CreateDraft({
        items: checklist.map((item) => ({
          id: item.id,
          text: item.text,
          patient_code: item.patient_code?.trim() || undefined,
          patient_name: item.patient_name?.trim() || undefined,
        })),
        idempotency_key: `p108_capture_${Date.now()}`,
      });
      setDraftId(draft.id);
      pushLog(`P108 draft created → ${draft.id}`);
      setProcessingStepIndex(null);
      router.push(`/pilot108/processing?state=success&draftId=${encodeURIComponent(draft.id)}`);
      } catch (err) {
        setProcessingStepIndex(null);
        setLiveStatus('Xử lý AI thất bại — kiểm tra mạng / log');
        throw err;
      }
    },
    [pushLog, router],
  );

  const handleStreamStart = async () => {
    setBusy(true);
    setDraftId('');
    setStepResult(null);
    setProcessingStepIndex(null);
    setLiveStatus('Đang mở micro & live…');
    setLog('');
    p108AudioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      await startLiveAudioOffer(stream).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        setLiveStatus(`Live không khả dụng: ${message}`);
        pushLog(`Live audio unavailable: ${message}`);
      });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      setStreamOn(true);
      setPaused(false);
      setElapsedMs(0);
      setLiveStatus('Đang ghi âm…');
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          p108AudioChunksRef.current.push(ev.data);
        }
      };
      uploadCtxRef.current = { upload_id: 'p108-bdd-capture', record_id: 'p108-bdd-capture', started_at: Date.now() };
      mr.start(1000);
      pushLog('P108 live audio recording started');
    } catch (e) {
      pushLog(`P108 recording start failed: ${String(e)}`);
      setStreamOn(false);
      setPaused(false);
      uploadCtxRef.current = null;
      setLiveStatus('Sẵn sàng ghi — chưa bật micro');
    } finally {
      setBusy(false);
    }
  };

  const handlePauseResume = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state === 'recording') {
      mr.pause();
      setPaused(true);
      setLiveStatus('Tạm dừng ghi…');
      pushLog('recording paused');
      return;
    }
    if (mr.state === 'paused') {
      mr.resume();
      setPaused(false);
      setLiveStatus('Đang ghi âm…');
      pushLog('recording resumed');
    }
  };

  const handleStreamStop = async () => {
    setBusy(true);
    try {
      const mr = mediaRecorderRef.current;
      const stream = streamRef.current;
      if (mr && mr.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          mr.addEventListener('stop', () => resolve(), { once: true });
          mr.stop();
        });
      }
      stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
      const ctx = uploadCtxRef.current;
      uploadCtxRef.current = null;
      setStreamOn(false);
      if (!ctx) {
        pushLog('No active P108 recording context.');
        setLiveStatus('Sẵn sàng ghi — chưa bật micro');
        return;
      }
      const audioBlob = new Blob(p108AudioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size <= 0) {
        pushLog('Không có âm thanh — không gọi P108 AI.');
        setLiveStatus('Không có dữ liệu âm thanh');
        return;
      }
      const audio = new File([audioBlob], `p108-live-${Date.now()}.webm`, { type: 'audio/webm' });
      await processP108Audio(audio);
      await cleanupLiveAudio();
    } catch (e) {
      pushLog(`P108 recording stop failed: ${String(e)}`);
      setProcessingStepIndex(null);
      setLiveStatus('Xử lý thất bại — xem log hoặc thử lại');
      await cleanupLiveAudio();
    } finally {
      setBusy(false);
    }
  };

  const handleFileUpload = async () => {
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      pushLog('Chọn file âm thanh trước.');
      return;
    }
    setBusy(true);
    setDraftId('');
    setStepResult(null);
    setProcessingStepIndex(null);
    setLog('');
    try {
      await processP108Audio(file);
      if (input) input.value = '';
    } catch (e) {
      pushLog(`P108 file capture failed: ${String(e)}`);
      setProcessingStepIndex(null);
      setLiveStatus('Xử lý file thất bại — xem log');
    } finally {
      setBusy(false);
    }
  };

  return (
    <P108Shell sessionTitle="New Recording" showSessionBadge={false}>
      <P108PhoneFrame data-testid="p108-h2-stt-root" className="min-h-[760px]">
        <P108MobileTopBar title="Phiên ghi" subtitle={captureSubtitle} actionHref="/pilot108/team" />
        <main className="flex min-h-[646px] flex-col items-center justify-center gap-12 px-5 py-10">
          <h1 className={cn('text-center text-[28px] font-semibold leading-tight text-[#020617]', p108News)}>New Recording</h1>
          <P108Waveform active={streamOn && !paused} />
          <p className={cn('tabular-nums text-[48px] font-medium leading-none text-[#0F172A]', p108Mono)}>
            {streamOn ? timerLabel : '00:00.0'}
          </p>
          <P108RecordingControls
            recording={streamOn}
            paused={paused}
            busy={busy}
            onStart={() => void handleStreamStart()}
            onPause={handlePauseResume}
            onStop={() => void handleStreamStop()}
          />
          {processingStepIndex !== null ? (
            <div className="w-full max-w-[360px] rounded-xl border border-[#E2E8F0] bg-white px-3 py-4 text-left shadow-sm">
              <p className={cn('mb-3 text-center text-xs font-semibold uppercase tracking-wide text-[#64748B]', p108Be)}>
                Luồng xử lý sau khi dừng ghi
              </p>
              <P108ProcessingSteps steps={BDD.processingSteps} activeIndex={processingStepIndex} />
            </div>
          ) : (
            <div className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center shadow-sm">
              <p className={cn('text-xs font-medium text-[#64748B]', p108Be)}>{liveStatus}</p>
              {liveSessionId ? <p className={cn('mt-1 font-mono text-[10px] text-[#94A3B8]', p108Be)}>{liveSessionId}</p> : null}
            </div>
          )}
          {draftId ? (
            <Link href={`/pilot108/individual?draftId=${encodeURIComponent(draftId)}`} className={cn('text-sm font-medium text-[#FB8A0A] underline-offset-2 hover:underline', p108Be)}>
              Review generated checklist
            </Link>
          ) : null}
        </main>
      </P108PhoneFrame>

      <details className="mx-auto mt-4 max-w-[390px] rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm sm:max-w-2xl">
        <summary className={cn('cursor-pointer font-medium text-[#475569]', p108Be)}>
          Debug upload / file tools
        </summary>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/pilot108/processing?state=upload" className={cn('text-sm font-medium text-[#FB8A0A] hover:underline', p108Be)}>
              Preview H3
            </Link>
            <span className={cn('text-xs text-[#64748B]', p108Be)}>BDD endpoint: /internal/ai/p108</span>
          </div>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className={cn('text-[15px]', p108News)}>Upload audio file</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <input ref={fileInputRef} type="file" accept="audio/*,.m4a,.webm,.mp3,.wav,.ogg" className="text-sm" />
              <Button type="button" variant="default" className={cn('h-10', p108Be)} disabled={busy} onClick={() => void handleFileUpload()}>
                <Upload className="h-4 w-4" />
                Run P108 AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className={cn('text-[15px]', p108News)}>Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <P108TerminalLog value={log} maxHeight={192} />
            </CardContent>
          </Card>

          {stepResult ? (
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className={cn('text-[15px]', p108News)}>P108 checklist JSON</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <P108TerminalLog value={JSON.stringify(stepResult, null, 2)} maxHeight={256} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </details>
    </P108Shell>
  );
}
