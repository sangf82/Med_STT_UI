'use client';

import React, { createContext, useContext, useState } from 'react';
import { initialRecordings, doctorProfile, type Profile, type Recording } from '@/lib/mockData';

interface AppContextProps {
    recordings: Recording[];
    setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>;
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
    const [profile, setProfile] = useState(doctorProfile);

    return (
        <AppContext.Provider value={{ recordings, setRecordings, profile, setProfile }}>
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
