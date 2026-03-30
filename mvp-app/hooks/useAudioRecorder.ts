'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export type RecorderState = 'idle' | 'recording' | 'paused';

export interface UseAudioRecorderReturn {
    /** Current recorder state */
    state: RecorderState;
    /** Elapsed recording time in ms (excludes paused time) */
    timeMs: number;
    /** Real-time audio level 0-1 for waveform visualization */
    audioLevel: number;
    /** Array of captured audio levels (one per ~50ms tick) for waveform bars */
    levels: number[];
    /** Cached audio blob URL after stop — null while recording */
    audioUrl: string | null;
    /** Raw audio blob */
    audioBlob: Blob | null;
    /** Start recording (requests mic permission). options.onChunk(blob, chunkIndex) called on each dataavailable for streaming upload. */
    start: (options?: { onChunk?: (blob: Blob, chunkIndex: number) => void }) => Promise<void>;
    /** Pause recording */
    pause: () => void;
    /** Resume recording */
    resume: () => void;
    /** Stop recording and produce blob. Returns a Promise that resolves with the final blob when MediaRecorder has finished (use this blob for upload to avoid race). */
    stop: () => Promise<Blob | null>;
    /** Reset all state */
    reset: () => void;
    /** Number of levels captured before the most recent pause */
    prePauseLevels: number;
    /** Get exact count of chunks generated */
    getChunkCount: () => number;
}

const LEVEL_INTERVAL = 60; // ms between level samples

/** Opus in WebM: request high bitrate; browser may cap or ignore (common cap ~128–256). */
const RECORDING_AUDIO_BITS_PER_SECOND = 320_000;

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [state, setState] = useState<RecorderState>('idle');
    const [timeMs, setTimeMs] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [levels, setLevels] = useState<number[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [prePauseLevels, setPrePauseLevels] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const mimeTypeRef = useRef<string>('audio/webm');
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const stopResolveRef = useRef<((blob: Blob | null) => void) | null>(null);
    const onChunkRef = useRef<((blob: Blob, chunkIndex: number) => void) | null>(null);
    const streamChunkIndexRef = useRef(0);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            timerRef.current && clearInterval(timerRef.current);
            levelTimerRef.current && clearInterval(levelTimerRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => {});
            }
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startTimers = useCallback(() => {
        // Time counter
        timerRef.current = setInterval(() => {
            setTimeMs(prev => prev + 100);
        }, 100);

        // Level sampler
        levelTimerRef.current = setInterval(() => {
            if (analyserRef.current && dataArrayRef.current) {
                analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
                const arr = dataArrayRef.current;
                let sum = 0;
                for (let i = 0; i < arr.length; i++) {
                    const v = (arr[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / arr.length);
                const normalized = Math.min(1, rms * 3); // amplify slightly
                setAudioLevel(normalized);
                setLevels(prev => [...prev, normalized]);
            }
        }, LEVEL_INTERVAL);
    }, []);

    const stopTimers = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (levelTimerRef.current) {
            clearInterval(levelTimerRef.current);
            levelTimerRef.current = null;
        }
    }, []);

    const start = useCallback(async (options?: { onChunk?: (blob: Blob, chunkIndex: number) => void }) => {
        onChunkRef.current = options?.onChunk ?? null;
        streamChunkIndexRef.current = 0;
        try {
            // No sampleRate constraint: let OS use native mic rate (often 48 kHz), closer to native recorders.
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: { ideal: 1 },
                    echoCancellation: { ideal: false },
                    noiseSuppression: { ideal: false },
                    autoGainControl: { ideal: false },
                }
            });
            streamRef.current = stream;

            // Set up Web Audio API analyser for levels
            const track = stream.getAudioTracks()[0];
            const nativeRate = track?.getSettings?.().sampleRate;
            let audioCtx: AudioContext;
            try {
                audioCtx = new AudioContext({
                    latencyHint: 'interactive',
                    ...(typeof nativeRate === 'number' && nativeRate > 0 ? { sampleRate: nativeRate } : {}),
                });
            } catch {
                audioCtx = new AudioContext({ latencyHint: 'interactive' });
            }
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

            // Set up MediaRecorder for actual audio capture
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            mimeTypeRef.current = mimeType;
            let recorder: MediaRecorder;
            try {
                recorder = new MediaRecorder(stream, {
                    mimeType,
                    audioBitsPerSecond: RECORDING_AUDIO_BITS_PER_SECOND,
                });
            } catch {
                recorder = new MediaRecorder(stream, { mimeType });
            }
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                    const cb = onChunkRef.current;
                    if (cb) {
                        const idx = streamChunkIndexRef.current;
                        cb(e.data, idx);
                        streamChunkIndexRef.current = idx + 1;
                    }
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);
                setAudioUrl(prevUrl => { if (prevUrl) URL.revokeObjectURL(prevUrl); return url; });
                setAudioBlob(blob);
                const resolve = stopResolveRef.current;
                if (resolve) {
                    stopResolveRef.current = null;
                    resolve(blob);
                }
            };

            recorder.start(200); // collect data every 200ms
            setState('recording');
            setTimeMs(0);
            setLevels([]);
            setPrePauseLevels(0);
            startTimers();
        } catch (err) {
            console.error('Microphone access denied or unavailable:', err);
        }
    }, [startTimers]);

    const pause = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            // Request any buffered data before pausing
            mediaRecorderRef.current.requestData();
            mediaRecorderRef.current.pause();
        }
        stopTimers();
        setAudioLevel(0);
        setPrePauseLevels(prev => {
            // First pause: capture current levels length
            // Subsequent: keep the first pause point
            return prev === 0 ? levels.length : prev;
        });

        // Build a temporary audio blob from accumulated chunks for replay
        // Use a short timeout so the last requestData() chunk arrives
        setTimeout(() => {
            if (chunksRef.current.length > 0) {
                const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
                const url = URL.createObjectURL(blob);
                setAudioBlob(prev => { if (prev) URL.revokeObjectURL(URL.createObjectURL(prev)); return blob; });
                setAudioUrl(prevUrl => { if (prevUrl) URL.revokeObjectURL(prevUrl); return url; });
            }
        }, 100);

        setState('paused');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stopTimers, levels.length]);

    const resume = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.resume();
        }
        setState('recording');
        startTimers();
    }, [startTimers]);

    const stop = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            stopResolveRef.current = resolve;
            stopTimers();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            } else {
                // Already inactive: no onstop will fire, resolve with current blob
                stopResolveRef.current = null;
                resolve(audioBlob);
            }
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => {});
            }
            setAudioLevel(0);
            setState('idle');
        });
    }, [stopTimers, audioBlob]);

    const reset = useCallback(() => {
        stopTimers();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(() => {});
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setState('idle');
        setTimeMs(0);
        setAudioLevel(0);
        setLevels([]);
        setPrePauseLevels(0);
        setAudioUrl(null);
        setAudioBlob(null);
        mediaRecorderRef.current = null;
        streamRef.current = null;
        analyserRef.current = null;
        audioCtxRef.current = null;
        chunksRef.current = [];
        dataArrayRef.current = null;
    }, [stopTimers, audioUrl]);

    const getChunkCount = useCallback(() => streamChunkIndexRef.current, []);

    return {
        state,
        timeMs,
        audioLevel,
        levels,
        audioUrl,
        audioBlob,
        start,
        pause,
        resume,
        stop,
        reset,
        prePauseLevels,
        getChunkCount,
    };
}
