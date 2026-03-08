'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialRecordings, doctorProfile, type Profile, type Recording } from '@/lib/mockData';
import { apiClient } from '@/lib/apiClient';
import { getAuthToken } from '@/lib/auth';

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
    const [profile, setProfile] = useState<Profile>(doctorProfile);
    const [filter, setFilter] = useState<string | null>(null);
    const [showSurvey, setShowSurvey] = useState(false);
    const [showTrialPanel, setShowTrialPanel] = useState(initialRecordings.length >= 5);
    const [showNotificationDot, setShowNotificationDot] = useState(initialRecordings.length >= 5);

    useEffect(() => {
        // Load initially from localStorage to avoid UI flicker
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            try {
                setProfile(JSON.parse(savedProfile));
            } catch (e) {
                console.error("Failed to parse cached profile", e);
            }
        }

        const fetchProfile = async () => {
            if (!getAuthToken()) return;
            try {
                const userProfile = await apiClient<any>('/auth/me');
                const newProfile = {
                    name: userProfile.name || 'User',
                    initials: (userProfile.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                    specialty: userProfile.role || 'Doctor',
                    hospital: 'Memorial Hospital',
                    email: userProfile.email || '',
                    phone: userProfile.phone || '',
                    npi: userProfile.npi || '1234567890'
                };
                setProfile(newProfile);
                localStorage.setItem('user_profile', JSON.stringify(newProfile));
            } catch (err) {
                console.error('Failed to fetch profile on mount', err);
            }
        };

        fetchProfile();
    }, []);

    // Keep localStorage in sync if profile is manually set elsewhere (e.g. login)
    useEffect(() => {
        // Only update localStorage if not matching doctorProfile exactly or as a general rule
        if (profile !== doctorProfile) {
            localStorage.setItem('user_profile', JSON.stringify(profile));
        }
    }, [profile]);

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
