import { Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FAB() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/recording')}
            className="absolute bottom-[16px] left-[50%] translate-x-[-50%] w-[64px] h-[64px] rounded-full bg-danger text-white shadow-[0_4px_20px_rgba(230,57,70,0.4)] flex items-center justify-center transition-transform active:scale-95 z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="New Recording"
        >
            <Mic className="w-[28px] h-[28px]" strokeWidth={2} />
        </button>
    );
}
