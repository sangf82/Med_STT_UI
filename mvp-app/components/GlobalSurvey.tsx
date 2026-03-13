'use client';

import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { SurveyDialog } from './SurveyDialog';
import { DailyReportDialog } from './DailyReportDialog';

export function GlobalSurvey() {
    const pathname = usePathname();
    const { showSurvey, setShowSurvey, showDailyReport, setShowDailyReport } = useAppContext();
    const isRecordingPage = pathname?.startsWith('/recording') ?? false;

    return (
        <>
            {showSurvey && !isRecordingPage && <SurveyDialog onClose={() => setShowSurvey(false)} />}
            {showDailyReport && <DailyReportDialog onClose={() => setShowDailyReport(false)} />}
        </>
    );
}
