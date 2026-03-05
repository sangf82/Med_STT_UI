'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Save dialog is now inline in the recording page (C4).
// This page just redirects to /recording if someone navigates here directly.
export default function SaveRecordingPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/recording');
    }, [router]);

    return null;
}
