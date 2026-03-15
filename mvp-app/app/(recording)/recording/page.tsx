'use client';

const STT_LOG = '[STT]';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { Waveform } from '@/components/Waveform';
import { RecordingControls } from '@/components/RecordingControls';
import type { ControlState } from '@/components/RecordingControls';
import { SaveDialog } from '@/components/SaveDialog';
import { formatTimeMs } from '@/lib/utils';
import { Loader2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { getMyUsage, type OutputFormat, AVAILABLE_OUTPUT_FORMATS, initStreamUpload, streamEndUpload, uploadChunkWithRetry } from '@/lib/api/sttMetrics';
import { saveStreamUploadMetadata, addStreamChunk, cleanupUploadSession, db } from '@/lib/db';
import { useAppContext } from '@/context/AppContext';


// C1: Active Recording
// C2: Paused
// C3: Continue Recording (resume)
// C4: Save Dialog

export default function RecordingPage() {
    const t = useTranslations('Recording');
    const router = useRouter();

    const recorder = useAudioRecorder();
    const { showSurvey, setShowSurvey, addActiveUploadId, removeActiveUploadId } = useAppContext();
    const [showSave, setShowSave] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [hasReplayed, setHasReplayed] = useState(false);
    const [seekPosition, setSeekPosition] = useState(1);
    const audioElRef = useRef<HTMLAudioElement | null>(null);
    const hasStarted = useRef(false);
    const [isStarting, setIsStarting] = useState(true);
    const streamUploadIdRef = useRef<string | null>(null);
    const streamRecordIdRef = useRef<string | null>(null);
    const streamChunkCountRef = useRef(0);
    /** Pending chunk upload promises — await trước khi stream/end để tránh thiếu chunk trên server. */
    const pendingChunkUploadsRef = useRef<Promise<unknown>[]>([]);
    const [limitChecked, setLimitChecked] = useState(false);
    const [canRecord, setCanRecord] = useState<boolean | null>(null);
    const outputFormatRef = useRef<OutputFormat>('soap_note');
    // Known duration in seconds — reliable unlike audio.duration which is Infinity for WebM
    const knownDurationSec = recorder.timeMs / 1000;

    // Check STT limit before allowing record (402 trước khi record, không phải lúc xong)
    useEffect(() => {
        let cancelled = false;
        getMyUsage()
            .then((usage) => {
                if (cancelled) return;
                const limit = usage.stt_requests_limit;
                const remaining = usage.stt_remaining ?? 0;
                const allowed = limit == null || limit <= 0 || remaining > 0;
                setCanRecord(allowed);
                if (!allowed) setShowSurvey(true);
                setLimitChecked(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setCanRecord(true);
                    setLimitChecked(true);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Auto-start recording: stream init then start; chunks uploaded during recording (no IndexedDB)
    useEffect(() => {
        if (!limitChecked || canRecord !== true || hasStarted.current) return;
        hasStarted.current = true;
        const sessionId = `sess_${Date.now()}`;
        const defaultName = `Ca khám ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')}_${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '')}`;
        initStreamUpload({
            session_id: sessionId,
            filename: 'record.webm',
            display_name: defaultName,
            output_format: 'soap_note',
        })
            .then(async (initRes) => {
                streamUploadIdRef.current = initRes.upload_id;
                streamRecordIdRef.current = initRes.record_id ?? null;
                streamChunkCountRef.current = 0;
                addActiveUploadId(initRes.upload_id);
                pendingChunkUploadsRef.current = [];
                console.info(STT_LOG, { flow: 'stream_init', record_id: initRes.record_id, upload_id: initRes.upload_id, session_id: sessionId });
                await saveStreamUploadMetadata({
                    upload_id: initRes.upload_id,
                    session_id: sessionId,
                    filename: 'record.webm',
                    total_chunks: 0,
                    chunk_size: 1,
                    output_format: 'soap_note',
                    format: 'soap',
                    display_name: defaultName,
                    record_id: initRes.record_id,
                });
                return recorder.start({
                    onChunk: (blob, idx) => {
                        if (!streamUploadIdRef.current) return;
                        const uid = streamUploadIdRef.current;
                        if (idx === 0 || idx % 20 === 19) {
                            console.info(STT_LOG, { flow: 'stream_chunk', upload_id: uid, chunk_index: idx, chunk_size: blob.size });
                        }
                        const uploadPromise = uploadChunkWithRetry(uid, idx, blob, 3).catch((e) => {
                            console.warn(STT_LOG, { flow: 'stream_chunk', upload_id: uid, chunk_index: idx, error: String(e?.message ?? e) });
                        });
                        pendingChunkUploadsRef.current.push(uploadPromise);
                        addStreamChunk(uid, idx, blob).catch(() => {}); // IDB chỉ dự phòng, không block stream
                        streamChunkCountRef.current = idx + 1;
                    },
                });
            })
            .catch((err) => {
                console.warn(STT_LOG, { flow: 'stream_init', error: String(err?.message ?? err), status: err?.status });
                if (err?.status === 402) setShowSurvey(true);
                hasStarted.current = false;
            })
            .finally(() => setIsStarting(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limitChecked, canRecord]);

    useEffect(() => {
        if (recorder.state === 'recording' && isStarting) setIsStarting(false);
    }, [recorder.state, isStarting]);

    // Screen Wake Lock: giữ màn hình sáng khi đang ghi âm (Chrome mobile)
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const requestWakeLock = useCallback(async () => {
        if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
        try {
            wakeLockRef.current = await (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> } }).wakeLock!.request('screen');
            wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
        } catch {
            // Ignore (e.g. low battery, not supported)
        }
    }, []);
    const releaseWakeLock = useCallback(() => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => {});
            wakeLockRef.current = null;
        }
    }, []);
    useEffect(() => {
        if (recorder.state === 'recording') {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }
        return () => releaseWakeLock();
    }, [recorder.state, requestWakeLock, releaseWakeLock]);
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && recorder.state === 'recording') requestWakeLock();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [recorder.state, requestWakeLock]);

    // Determine control state
    let controlState: ControlState = 'recording';
    if (recorder.state === 'paused') controlState = 'paused';
    if (replaying) controlState = 'replaying';

    // Replay logic — Waveform handles animation via audioRef, no setState per frame
    const startReplay = useCallback(() => {
        if (!recorder.audioUrl) return;
        setHasReplayed(true);

        // Clean up any previous audio
        if (audioElRef.current) {
            audioElRef.current.pause();
            audioElRef.current.onended = null;
            audioElRef.current.oncanplay = null;
        }

        const audio = new Audio(recorder.audioUrl);
        audioElRef.current = audio;

        const startFrom = seekPosition < 1 ? seekPosition : 0;
        setSeekPosition(startFrom);
        setReplaying(true);

        audio.onended = () => {
            setReplaying(false);
            setSeekPosition(1);
        };

        // oncanplay can fire multiple times — use a flag to only act once
        let didStart = false;
        audio.oncanplay = () => {
            if (didStart) return;
            didStart = true;
            // Use known duration from recorder (audio.duration is often Infinity for WebM)
            const dur = knownDurationSec > 0 ? knownDurationSec : (Number.isFinite(audio.duration) ? audio.duration : 0);
            if (startFrom > 0 && dur > 0) {
                audio.currentTime = startFrom * dur;
            }
            audio.play().catch(() => {
                setReplaying(false);
            });
        };

        audio.load();
    }, [recorder.audioUrl, seekPosition, knownDurationSec]);

    const pauseReplay = useCallback(() => {
        if (audioElRef.current) {
            const dur = knownDurationSec > 0 ? knownDurationSec : (Number.isFinite(audioElRef.current.duration) ? audioElRef.current.duration : 0);
            if (dur > 0) {
                setSeekPosition(audioElRef.current.currentTime / dur);
            }
            audioElRef.current.pause();
        }
        setReplaying(false);
    }, [knownDurationSec]);

    const handleSeek = useCallback((pos: number) => {
        setSeekPosition(pos);
        if (audioElRef.current) {
            const dur = knownDurationSec > 0 ? knownDurationSec : (Number.isFinite(audioElRef.current.duration) ? audioElRef.current.duration : 0);
            if (dur > 0) {
                audioElRef.current.currentTime = pos * dur;
            }
        }
    }, [knownDurationSec]);

    // Cleanup replay on unmount
    useEffect(() => {
        return () => {
            audioElRef.current?.pause();
        };
    }, []);

    const handlePause = () => {
        recorder.pause();
        setSeekPosition(1); // show end of recording (current position)
    };
    const handleResume = () => {
        recorder.resume();
        setSeekPosition(1); // reset for next pause
    };
    const handleBack = async () => {
        if (streamUploadIdRef.current) {
            const uid = streamUploadIdRef.current;
            console.info(STT_LOG, { flow: 'stream_abandon', upload_id: uid, record_id: streamRecordIdRef.current ?? undefined });
            const { abandonUpload } = await import('@/lib/api/sttMetrics');
            abandonUpload(uid).catch(() => {});
            await cleanupUploadSession(uid).catch(() => {});
            removeActiveUploadId(uid);
            streamUploadIdRef.current = null;
        }
        recorder.stop();
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
        } else {
            router.push('/dashboard');
        }
    };
    const handleSave = () => {
        recorder.pause();
        setShowSave(true);
    };
    const handleCancelSave = () => setShowSave(false);
    const saveInProgressRef = useRef(false);
    const handleConfirmSave = async (name: string, format: string) => {
        if (saveInProgressRef.current) return;
        saveInProgressRef.current = true;
        setShowSave(false);
        const UI_TO_OUTPUT_FORMAT: Record<string, OutputFormat> = { soap: 'soap_note', clinical: 'ehr', todo: 'to-do', raw: 'freetext' };
        const outputFormat: OutputFormat = UI_TO_OUTPUT_FORMAT[format] ?? AVAILABLE_OUTPUT_FORMATS[0];
        outputFormatRef.current = outputFormat;

        const uploadId = streamUploadIdRef.current;
        const recordId = streamRecordIdRef.current;

        if (!uploadId) {
            console.error(STT_LOG, { flow: 'stream_end', error: 'No stream upload session' });
            saveInProgressRef.current = false;
            return;
        }

        // Stop recorder synchronously — after this, all onChunk callbacks have fired
        await recorder.stop();
        const exactChunkCount = recorder.getChunkCount();
        if (exactChunkCount <= 0) {
            console.error(STT_LOG, { flow: 'stream_end', upload_id: uploadId, record_id: recordId, error: 'No chunks' });
            saveInProgressRef.current = false;
            return;
        }

        // Capture pending promises before navigating away (component will unmount)
        const pendingUploads = [...pendingChunkUploadsRef.current];
        pendingChunkUploadsRef.current = [];
        streamUploadIdRef.current = null;
        streamRecordIdRef.current = null;

        // Navigate to dashboard IMMEDIATELY — user sees record in "processing" state
        router.push('/dashboard');

        // Fire-and-forget: finish upload in background (detached from component lifecycle)
        // BackgroundUploader will recover if this fails
        (async () => {
            try {
                await Promise.allSettled(pendingUploads);
                console.info(STT_LOG, { flow: 'stream_end_bg', upload_id: uploadId, record_id: recordId, total_chunks: exactChunkCount });
                try {
                    await streamEndUpload({
                        upload_id: uploadId,
                        total_chunks: exactChunkCount,
                        record_id: recordId ?? undefined,
                        output_format: outputFormat,
                    });
                } catch (streamEndErr: any) {
                    if (streamEndErr?.status === 400) {
                        const localChunks = await db.chunks.where({ upload_id: uploadId }).sortBy('chunk_index');
                        if (localChunks.length > 0) {
                            console.info(STT_LOG, { flow: 'stream_end_retry_bg', upload_id: uploadId, reupload_count: localChunks.length });
                            for (const c of localChunks) {
                                if (c.blob) await uploadChunkWithRetry(uploadId, c.chunk_index, c.blob, 3).catch(() => {});
                            }
                            await streamEndUpload({
                                upload_id: uploadId,
                                total_chunks: exactChunkCount,
                                record_id: recordId ?? undefined,
                                output_format: outputFormat,
                            });
                        } else {
                            throw streamEndErr;
                        }
                    } else {
                        throw streamEndErr;
                    }
                }
                await cleanupUploadSession(uploadId).catch(() => {});
                removeActiveUploadId(uploadId);
                console.info(STT_LOG, { flow: 'stream_end_bg_done', upload_id: uploadId, record_id: recordId });
            } catch (bgErr: any) {
                console.error(STT_LOG, { flow: 'stream_end_bg', upload_id: uploadId, error: String(bgErr?.message ?? bgErr) });
                // Don't cleanup — BackgroundUploader will retry from IDB
                removeActiveUploadId(uploadId);
            }
        })();
    };

    // Keep seekPosition in sync during playback
    useEffect(() => {
        const audio = audioElRef.current;
        if (!audio || !replaying) return;

        const handleTimeUpdate = () => {
            const dur = knownDurationSec > 0 ? knownDurationSec : (Number.isFinite(audio.duration) ? audio.duration : 0);
            if (dur > 0) {
                setSeekPosition(audio.currentTime / dur);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, [replaying, knownDurationSec]);

    // Calculate display time
    const displayTimeMs = (recorder.state === 'recording')
        ? recorder.timeMs
        : Math.floor(seekPosition * (recorder.timeMs || 0));

    // Header center: recording indicator + title (show "Starting..." while getUserMedia runs)
    const isRecording = recorder.state === 'recording';
    const titleIndicator = (
        <div className="flex items-center gap-2">
            {isStarting && (
                <Loader2 className="w-4 h-4 text-accent-blue animate-spin shrink-0" />
            )}
            {!isStarting && isRecording && (
                <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse-fast" />
            )}
            <span className="text-[17px] font-semibold">
                {isStarting ? t('startingRecording') : t('newRecording')}
            </span>
        </div>
    );

    if (limitChecked && canRecord === false) {
        return (
            <div className="flex flex-col min-h-screen fade-in relative">
                <Header
                    centerNode={<span className="text-[17px] font-semibold">{t('newRecording')}</span>}
                    onBack={handleBack}
                    rightNode={null}
                />
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <p className="text-[18px] font-semibold text-text-primary mb-2">
                        Bạn đã hết lượt ghi âm
                    </p>
                    <p className="text-[14px] text-text-muted mb-4">
                        Vui lòng đánh giá để nhận thêm lượt sử dụng.
                    </p>
                    <p className="text-[13px] text-text-muted">
                        (Cửa sổ đánh giá đã hiển thị bên dưới)
                    </p>
                </div>
            </div>
        );
    }

    if (!limitChecked) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-page items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                <p className="text-[14px] text-text-muted">Đang kiểm tra lượt sử dụng...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen fade-in relative">
            <Header
                centerNode={titleIndicator}
                onBack={handleBack}
                rightNode={
                    <button className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 text-text-primary transition-colors hover:bg-bg-surface">
                        <MoreVertical className="w-6 h-6" />
                    </button>
                }
            />

            <div className="flex-1 flex flex-col items-center pt-6 pb-[34px]">

                {/* Timer (or "Starting..." while mic is being requested) */}
                <div className="text-[52px] font-light leading-none tracking-tight text-center">
                    {isStarting ? (
                        <span className="text-[24px] text-text-muted">{t('startingRecording')}</span>
                    ) : (
                        formatTimeMs(displayTimeMs)
                    )}
                </div>

                {/* Spacer */}
                <div className="h-3" />

                {/* Waveform */}
                <Waveform
                    levels={recorder.levels}
                    active={recorder.state === 'recording'}
                    paused={recorder.state === 'paused'}
                    prePauseLevels={hasReplayed ? recorder.prePauseLevels : 0}
                    replaying={replaying}
                    seekPosition={seekPosition}
                    audioRef={audioElRef}
                    durationSec={knownDurationSec}
                    onSeek={handleSeek}
                />

                {/* Flex spacer pushes controls to bottom */}
                <div className="flex-1" />

                {/* Controls */}
                <RecordingControls
                    state={controlState}
                    onPause={handlePause}
                    onResume={handleResume}
                    onReplay={startReplay}
                    onPauseReplay={pauseReplay}
                    onSave={handleSave}
                />
            </div>

            {/* Save Dialog Overlay (C4) */}
            {showSave && (
                <SaveDialog
                    onCancel={handleCancelSave}
                    onSave={handleConfirmSave}
                />
            )}

            {isProcessing && (
                <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-bg-page animate-in fade-in duration-300">
                    <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                    <p className="text-[16px] font-semibold text-text-primary mb-1">
                        Đang phân tích dữ liệu...
                    </p>
                    <p className="text-[13px] text-text-muted">
                        Vui lòng không đóng trang
                    </p>
                </div>
            )}

        </div>
    );
}
