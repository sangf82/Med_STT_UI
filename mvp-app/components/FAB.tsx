import { Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FAB() {
    const router = useRouter();

    return (
        <div className="fixed bottom-[32px] left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-50 px-4 flex justify-center">
            <button
                onClick={() => router.push('/recording')}
                className="pointer-events-auto w-[64px] h-[64px] rounded-full bg-danger text-white shadow-[0_8px_24px_rgba(230,57,70,0.4)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label="New Recording"
            >
                <Mic className="w-[28px] h-[28px]" strokeWidth={2} />
            </button>
        </div>
    );
}
