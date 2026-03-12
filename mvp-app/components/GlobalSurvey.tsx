'use client';

import { useAppContext } from '@/context/AppContext';
import { SurveyDialog } from './SurveyDialog';

export function GlobalSurvey() {
    const { showSurvey, setShowSurvey } = useAppContext();

    if (!showSurvey) return null;

    return <SurveyDialog onClose={() => setShowSurvey(false)} />;
}
