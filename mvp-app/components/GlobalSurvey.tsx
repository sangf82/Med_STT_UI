'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { SurveyDialog } from './SurveyDialog';
import { DailyReportDialog } from './DailyReportDialog';

export function GlobalSurvey() {
    const pathname = usePathname();
    const { showSurvey, setShowSurvey, showDailyReport, setShowDailyReport } = useAppContext();
    const isRecordingPage = pathname?.startsWith('/recording') ?? false;
    const prevWasRecording = useRef(false);

    // Khi vừa chuyển từ recording sang trang khác và còn pending M3 → hiện popup một lần
    useEffect(() => {
        const wasRecording = prevWasRecording.current;
        prevWasRecording.current = isRecordingPage;
        if (wasRecording && !isRecordingPage && typeof window !== 'undefined' && localStorage.getItem('daily_report_pending_date')) {
            setShowDailyReport(true);
        }
    }, [pathname, isRecordingPage, setShowDailyReport]);

    return (
        <>
            {showSurvey && !isRecordingPage && <SurveyDialog onClose={() => setShowSurvey(false)} />}
            {showDailyReport && !isRecordingPage && <DailyReportDialog onClose={() => setShowDailyReport(false)} />}
        </>
    );
}
