'use client';

/**
 * Admin-only: low-latency WebRTC live audio monitor.
 * Open: /admin/stt-stream/{live_session_id} from recording screen link.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  addLiveCandidate,
  getLiveCandidates,
  getLiveOffer,
  getLiveSnapshot,
  postLiveAnswer,
} from '@/lib/api/sttAdminStreamSession';

export default function AdminSttStreamMonitorPage() {
  const params = useParams();
  const liveSessionId = String(params.uploadId || '');
  const [snap, setSnap] = useState<{ display_name?: string; status?: string } | null>(null);
  const [err, setErr] = useState('');
  const [connected, setConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<number | null>(null);
  const answererSeqRef = useRef(0);
  const offererSeqRef = useRef(0);

  useEffect(() => {
    if (!liveSessionId) return;
    setErr('');
    let alive = true;

    const run = async () => {
      try {
        const meta = await getLiveSnapshot(liveSessionId);
        if (alive) setSnap(meta);

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (!remoteStream || !audioRef.current) return;
          audioRef.current.srcObject = remoteStream;
          void audioRef.current.play().catch(() => {});
          setConnected(true);
        };
        pc.onicecandidate = (event) => {
          if (!event.candidate) return;
          void addLiveCandidate(liveSessionId, 'answerer', event.candidate.toJSON()).catch(() => {});
        };

        const pullOffer = async (): Promise<void> => {
          if (!alive) return;
          const offer = await getLiveOffer(liveSessionId);
          if (!offer) {
            window.setTimeout(() => void pullOffer(), 1000);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await postLiveAnswer(liveSessionId, { type: 'answer', sdp: answer.sdp || '' });
        };

        await pullOffer();
        pollRef.current = window.setInterval(() => {
          void (async () => {
            try {
              const incoming = await getLiveCandidates(liveSessionId, 'offerer', offererSeqRef.current);
              for (const c of incoming) {
                offererSeqRef.current = Math.max(offererSeqRef.current, c.seq);
                await pc.addIceCandidate({
                  candidate: c.candidate,
                  sdpMid: c.sdpMid,
                  sdpMLineIndex: c.sdpMLineIndex,
                  usernameFragment: c.usernameFragment,
                });
              }
              const own = await getLiveCandidates(liveSessionId, 'answerer', answererSeqRef.current);
              for (const c of own) answererSeqRef.current = Math.max(answererSeqRef.current, c.seq);
            } catch {
              /* keep polling */
            }
          })();
        }, 1200);
      } catch (e: unknown) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Không kết nối được live session';
        setErr(msg);
      }
    };

    void run();
    return () => {
      alive = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      const pc = pcRef.current;
      pcRef.current = null;
      if (pc) pc.close();
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.srcObject = null;
      }
    };
  }, [liveSessionId]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-lg font-semibold text-zinc-900">Admin · Nghe live WebRTC</h1>
      <p className="font-mono text-xs text-zinc-500">live_session_id: {liveSessionId}</p>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {snap ? (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800 shadow-sm">
          <p>
            <span className="text-zinc-500">display_name:</span>{' '}
            <span className="font-medium">{snap.display_name || '—'}</span>
          </p>
          <p className="text-xs text-zinc-500">status: {snap.status || (connected ? 'connected' : 'waiting')}</p>
        </div>
      ) : null}
      <audio ref={audioRef} autoPlay controls className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1" />
      <p className="text-xs text-zinc-500">
        Luồng nghe live tách riêng khỏi chunk upload STT, ưu tiên độ trễ thấp bằng WebRTC.
      </p>
    </div>
  );
}
