'use client';

import React, { createContext, useContext, useState } from 'react';
import { initialRecordings, doctorProfile, type Profile, type Recording } from '@/lib/mockData';

interface AppContextProps {
    recordings: Recording[];
    setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>;
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    filter: string | null;
    setFilter: React.Dispatch<React.SetStateAction<string | null>>;
    showSurvey: boolean;
    setShowSurvey: (show: boolean) => void;
    showTrialPanel: boolean;
    setShowTrialPanel: (show: boolean) => void;
    showNotificationDot: boolean;
    setShowNotificationDot: (show: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
    const [profile, setProfile] = useState(doctorProfile);
    const [filter, setFilter] = useState<string | null>(null);
    const [showSurvey, setShowSurvey] = useState(false);
    const [showTrialPanel, setShowTrialPanel] = useState(initialRecordings.length >= 5);
    const [showNotificationDot, setShowNotificationDot] = useState(initialRecordings.length >= 5);

    return (
        <AppContext.Provider value={{
            recordings, setRecordings,
            profile, setProfile,
            filter, setFilter,
            showSurvey, setShowSurvey,
            showTrialPanel, setShowTrialPanel,
            showNotificationDot, setShowNotificationDot
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
