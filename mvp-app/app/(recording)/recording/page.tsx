'use client';

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
import { initChunkedUpload } from '@/lib/api/sttMetrics';
import { saveUploadSession } from '@/lib/db';


// C1: Active Recording
// C2: Paused
// C3: Continue Recording (resume)
// C4: Save Dialog

export default function RecordingPage() {
    const t = useTranslations('Recording');
    const router = useRouter();

    const recorder = useAudioRecorder();
    const [showSave, setShowSave] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [hasReplayed, setHasReplayed] = useState(false);
    const [seekPosition, setSeekPosition] = useState(1);
    const audioElRef = useRef<HTMLAudioElement | null>(null);
    const hasStarted = useRef(false);
    // Known duration in seconds — reliable unlike audio.duration which is Infinity for WebM
    const knownDurationSec = recorder.timeMs / 1000;

    // Auto-start recording on mount
    useEffect(() => {
        if (!hasStarted.current) {
            hasStarted.current = true;
            recorder.start();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
    const handleBack = () => {
        recorder.stop();
        router.push('/dashboard');
    };
    const handleSave = () => {
        recorder.pause();
        setShowSave(true);
    };
    const handleCancelSave = () => setShowSave(false);
    const handleConfirmSave = async (name: string, format: string) => {
        recorder.stop();
        setShowSave(false);

        if (!recorder.audioBlob) {
            console.error("No audio blob to transcribe");
            return;
        }

        try {
            let formatType = 'soap_note';
            if (format === 'clinical') formatType = 'ehr';
            if (format === 'todo') formatType = 'to-do';
            if (format === 'none') formatType = 'free';

            const sessionId = `sess_${Date.now()}`;
            const CHUNK_SIZE = 1024 * 512;
            const totalChunksGuess = Math.ceil(recorder.audioBlob.size / CHUNK_SIZE);

<<<<<<< HEAD
            // 1. Init only (backend creates record status=uploading). Quick.
            const initRes = await initChunkedUpload(name || 'record.webm', totalChunksGuess, sessionId, CHUNK_SIZE);
=======
            // 1. Init with display_name (tên ca khám) and file info; backend creates record status=uploading.
            const initRes = await initChunkedUpload('record.webm', totalChunksGuess, sessionId, CHUNK_SIZE, name?.trim() || undefined);
>>>>>>> e623e1bb42ea90b8d1b2f44c79ad1214129ab35d
            const actualChunkSize = initRes.chunk_size || CHUNK_SIZE;
            const computedTotalChunks = Math.ceil(recorder.audioBlob.size / actualChunkSize);

            // 2. Persist session + chunks + display_name to IndexedDB. BackgroundUploader will send display_name on complete.
            await saveUploadSession({
                upload_id: initRes.upload_id,
                session_id: sessionId,
                filename: name,
                total_chunks: computedTotalChunks,
                chunk_size: actualChunkSize,
                format_type: formatType,
                format: format,
                display_name: name?.trim() || undefined,
            }, recorder.audioBlob);

            // 3. Return to list immediately; upload + STT run in background
            router.push('/dashboard');
        } catch (error) {
            console.error("Save/init failed", error);
            setIsProcessing(true);
            setTimeout(() => setIsProcessing(false), 2000);
        }
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

    // Header center: recording indicator + title
    const isRecording = recorder.state === 'recording';
    const titleIndicator = (
        <div className="flex items-center gap-2">
            {isRecording && (
                <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse-fast" />
            )}
            <span className="text-[17px] font-semibold">{t('newRecording')}</span>
        </div>
    );

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

                {/* Timer */}
                <div className="text-[52px] font-light leading-none tracking-tight text-center">
                    {formatTimeMs(displayTimeMs)}
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
