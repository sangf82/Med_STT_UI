'use client';

import { useAppContext } from '@/context/AppContext';
import { SurveyDialog } from './SurveyDialog';
import { DailyReportDialog } from './DailyReportDialog';

export function GlobalSurvey() {
    const { showSurvey, setShowSurvey, showDailyReport, setShowDailyReport } = useAppContext();

    return (
        <>
            {showSurvey && <SurveyDialog onClose={() => setShowSurvey(false)} />}
            {showDailyReport && <DailyReportDialog onClose={() => setShowDailyReport(false)} />}
        </>
    );
}
