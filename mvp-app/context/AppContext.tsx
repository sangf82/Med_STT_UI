'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Profile, Recording } from '@/lib/types/app';
import { apiClient } from '@/lib/apiClient';
import { getAuthToken } from '@/lib/auth';

type AuthMeResponse = {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    npi?: string;
};

const EMPTY_PROFILE: Profile = {
    name: '',
    initials: '',
    specialty: '',
    hospital: '',
    email: '',
    phone: '',
    npi: '',
};

interface AppContextProps {
    recordings: Recording[];
    setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>;
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    filter: string | null;
    setFilter: React.Dispatch<React.SetStateAction<string | null>>;
    showSurvey: boolean;
    setShowSurvey: (show: boolean) => void;
    showDailyReport: boolean;
    setShowDailyReport: (show: boolean) => void;
    showTrialPanel: boolean;
    setShowTrialPanel: (show: boolean) => void;
    showNotificationDot: boolean;
    setShowNotificationDot: (show: boolean) => void;
    isRecoveringUploads: boolean;
    setIsRecoveringUploads: (show: boolean) => void;
    activeUploadIds: Set<string>;
    addActiveUploadId: (id: string) => void;
    removeActiveUploadId: (id: string) => void;
    totalRecordsFromApi: number;
    setTotalRecordsFromApi: (n: number) => void;
    totalByFormat: { soap: number; ehr: number; todo: number; free: number };
    setTotalByFormat: (v: { soap: number; ehr: number; todo: number; free: number }) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
    const [filter, setFilter] = useState<string | null>(null);
    const [showSurvey, setShowSurvey] = useState(false);
    const [showDailyReport, setShowDailyReport] = useState(false);
    const [showTrialPanel, setShowTrialPanel] = useState(false);
    const [showNotificationDot, setShowNotificationDot] = useState(false);
    const [isRecoveringUploads, setIsRecoveringUploads] = useState(false);
    const activeUploadIdsRef = useRef(new Set<string>());
    const [activeUploadIds, setActiveUploadIds] = useState<Set<string>>(new Set());
    const addActiveUploadId = useCallback((id: string) => {
        activeUploadIdsRef.current.add(id);
        setActiveUploadIds(new Set(activeUploadIdsRef.current));
    }, []);
    const removeActiveUploadId = useCallback((id: string) => {
        activeUploadIdsRef.current.delete(id);
        setActiveUploadIds(new Set(activeUploadIdsRef.current));
    }, []);
    const [totalRecordsFromApi, setTotalRecordsFromApi] = useState(0);
    const [totalByFormat, setTotalByFormat] = useState({ soap: 0, ehr: 0, todo: 0, free: 0 });

    useEffect(() => {
        const checkTime = () => {
            if (!getAuthToken()) return; // Don't show if not logged in

            const now = new Date();
            const hour = now.getHours();
            const todayStr = now.toISOString().split('T')[0];
            const lastReported = localStorage.getItem('daily_report_last_date');
            const pendingDate = localStorage.getItem('daily_report_pending_date');

            // Chỉ mở popup M3 một lần khi sau 17h và chưa báo cáo hôm nay; không gọi setShowDailyReport mỗi 60s khi đã có pending (tránh hỏi lại liên tục)
            if (hour >= 17 && lastReported !== todayStr && !pendingDate) {
                localStorage.setItem('daily_report_pending_date', todayStr);
                setShowDailyReport(true);
            }
        };
        checkTime();
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            globalThis.queueMicrotask(() => {
                try {
                    setProfile(JSON.parse(savedProfile) as Profile);
                } catch (e) {
                    console.error('Failed to parse cached profile', e);
                }
            });
        }

        const fetchProfile = async () => {
            if (!getAuthToken()) return;
            try {
                const userProfile = await apiClient<AuthMeResponse>('/auth/me');
                const newProfile: Profile = {
                    name: userProfile.name || 'User',
                    initials: (userProfile.name || 'U')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2),
                    specialty: userProfile.role || 'Doctor',
                    hospital: 'Memorial Hospital',
                    email: userProfile.email || '',
                    phone: userProfile.phone || '',
                    npi: userProfile.npi || '1234567890',
                };
                setProfile(newProfile);
                localStorage.setItem('user_profile', JSON.stringify(newProfile));
            } catch (err) {
                console.error('Failed to fetch profile on mount', err);
            }
        };

        void fetchProfile();
    }, []);

    // Keep localStorage in sync if profile is manually set elsewhere (e.g. login)
    useEffect(() => {
        if (!getAuthToken()) return;
        if (!profile.name && !profile.email && !profile.phone && !profile.npi) return;
        localStorage.setItem('user_profile', JSON.stringify(profile));
    }, [profile]);

    return (
        <AppContext.Provider value={{
            recordings, setRecordings,
            profile, setProfile,
            filter, setFilter,
            showSurvey, setShowSurvey,
            showDailyReport, setShowDailyReport,
            showTrialPanel, setShowTrialPanel,
            showNotificationDot, setShowNotificationDot,
            isRecoveringUploads, setIsRecoveringUploads,
            activeUploadIds, addActiveUploadId, removeActiveUploadId,
            totalRecordsFromApi, setTotalRecordsFromApi,
            totalByFormat, setTotalByFormat
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
