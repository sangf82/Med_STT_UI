'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { Waveform } from '@/components/Waveform';
import { RecordingControls } from '@/components/RecordingControls';
import { Badge } from '@/components/Badge';
import { formatTimeMs } from '@/lib/utils';
import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// C1: Active
// C2: Paused
// C3: Resume (Active again with past state)

export default function RecordingPage() {
    const t = useTranslations('Recording');
    const router = useRouter();

    const [state, setState] = useState<'active' | 'paused' | 'resume'>('active');
    const [timeMs, setTimeMs] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state === 'active' || state === 'resume') {
            interval = setInterval(() => {
                setTimeMs(prev => prev + 100);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [state]);

    const handlePause = () => setState('paused');
    const handleResume = () => setState('resume');
    const handleStop = () => router.push('/save');
    const handleBack = () => router.push('/dashboard');

    let titleIndicator = null;
    if (state === 'active' || state === 'resume') {
        titleIndicator = (
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse-fast" />
                <span className="text-[17px] font-bold">{t('newRecording')}</span>
            </div>
        );
    } else {
        titleIndicator = <span className="text-[17px] font-bold">{t('newRecording')}</span>;
    }

    return (
        <div className="flex flex-col min-h-screen fade-in">
            <Header
                centerNode={titleIndicator}
                onBack={handleBack}
                rightNode={
                    <button className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 text-text-primary transition-colors hover:bg-bg-surface">
                        <Info className="w-6 h-6" />
                    </button>
                }
            />

            <div className="flex-1 flex flex-col items-center justify-between pt-12 pb-16">

                {/* Timer Area */}
                <div className="flex flex-col items-center gap-4">
                    <div className="text-[52px] font-light font-mono leading-none tracking-tight">
                        {formatTimeMs(timeMs)}
                    </div>
                    <div className="h-[24px]">
                        {state === 'paused' && (
                            <Badge variant="warn" className="bg-accent-orange text-white shadow-sm flex items-center gap-1.5 px-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                {t('paused')}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Waveform Area */}
                <div className="w-full flex flex-col items-center gap-6 mt-8">
                    <Waveform
                        active={state === 'active' || state === 'resume'}
                        paused={state === 'paused'}
                        barCount={60}
                        pastBars={state === 'resume' || state === 'paused' ? 30 : 0}
                        newBars={state === 'resume' ? 25 : 0}
                    />

                    {/* Optional scrubber when paused - visual only for demo */}
                    {state === 'paused' && (
                        <div className="w-[80%] max-w-[300px] h-[4px] bg-border rounded-full relative overflow-hidden">
                            <div className="absolute top-0 left-0 bottom-0 bg-accent-blue w-[45%]" />
                        </div>
                    )}
                </div>

                {/* Controls Area */}
                <div className="w-full mt-12">
                    <RecordingControls
                        state={state}
                        onPause={handlePause}
                        onResume={handleResume}
                        onStop={handleStop}
                    />
                </div>

            </div>
        </div>
    );
}
