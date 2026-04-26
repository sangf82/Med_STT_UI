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
import { P108Shell } from '@/components/pilot108/P108Shell';
import { P108TerminalLog } from '@/components/medmate/P108TerminalLog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    let alive = true;
    const audioEl = audioRef.current;

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
      if (audioEl) {
        audioEl.pause();
        audioEl.srcObject = null;
      }
    };
  }, [liveSessionId]);

  const statusLine =
    snap?.status || (connected ? 'connected' : 'waiting');

  return (
    <P108Shell sessionTitle="Admin · STT live stream" showSessionBadge={false}>
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {liveSessionId || '—'}
          </Badge>
          <Badge variant="outline">{statusLine}</Badge>
        </div>

        {err ? (
          <Alert variant="destructive">
            <AlertTitle>Không kết nối</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        {snap ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snapshot</CardTitle>
              <CardDescription>Meta từ server cho phiên live</CardDescription>
            </CardHeader>
            <CardContent>
              <P108TerminalLog value={JSON.stringify(snap, null, 2)} maxHeight={160} />
            </CardContent>
          </Card>
        ) : null}

        <audio ref={audioRef} autoPlay controls className="w-full rounded-lg border border-border bg-muted/30 p-1" />
        <p className="text-xs text-muted-foreground">
          Luồng nghe live tách riêng khỏi chunk upload STT, ưu tiên độ trễ thấp bằng WebRTC.
        </p>
      </div>
    </P108Shell>
  );
}
