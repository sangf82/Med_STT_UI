'use client';

import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { getMyUsage } from '@/lib/api/sttMetrics';

export function FAB() {
    const router = useRouter();
    const { setShowSurvey } = useAppContext();
    const [checking, setChecking] = useState(false);

    const handleClick = async () => {
        if (checking) return;
        setChecking(true);
        try {
            const usage = await getMyUsage().catch(() => null);
            const limit = usage?.stt_requests_limit ?? 0;
            const remaining = usage?.stt_remaining ?? 0;
            const allowed = limit == null || limit <= 0 || remaining > 0;
            if (!allowed) {
                setShowSurvey(true);
                return;
            }
            router.push('/recording');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="fixed bottom-[32px] left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-50 px-4 flex justify-center">
            <button
                onClick={handleClick}
                disabled={checking}
                className="pointer-events-auto w-[64px] h-[64px] rounded-full bg-danger text-white shadow-[0_8px_24px_rgba(230,57,70,0.4)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-80"
                aria-label="New Recording"
            >
                {checking ? <Loader2 className="w-[28px] h-[28px] animate-spin" /> : <Mic className="w-[28px] h-[28px]" strokeWidth={2} />}
            </button>
        </div>
    );
}
