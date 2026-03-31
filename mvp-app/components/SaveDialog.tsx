'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createMyPatientFolder, getMyPatientFolders } from '@/lib/api/sttMetrics';

export interface SaveDialogProps {
    onCancel: () => void;
    onSave: (name: string, format: string, patientName: string) => void;
    initialPatientName?: string;
}

type FormatKey = 'soap' | 'clinical' | 'operative' | 'todo' | 'raw';

const UNKNOWN_FOLDER_NAMES = new Set([
    'unknown patient',
    'unknown',
    'unassigned',
]);

const isUnknownVirtualFolder = (folder: { name: string; is_virtual?: boolean }) => {
    if (!folder.is_virtual) return false;
    return UNKNOWN_FOLDER_NAMES.has(folder.name.trim().toLowerCase());
};

const generatePatientName = () => {
    const now = new Date();
    const datePart = now
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        .replace(/\//g, '');
    const timePart = now
        .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        .replace(/:/g, '');
    return `Patient_${datePart}_${timePart}`;
};

export function SaveDialog({ onCancel, onSave, initialPatientName }: SaveDialogProps) {
    const t = useTranslations('Recording');
    const defaultName = `Ca khám ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')}` +
        `_${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '')}`;
    const [name, setName] = useState(defaultName);
    const [patientName, setPatientName] = useState((initialPatientName || '').trim());
    const [format, setFormat] = useState<FormatKey>('soap');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
    const [patientOptions, setPatientOptions] = useState<string[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [creatingPatient, setCreatingPatient] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const patientDropdownRef = useRef<HTMLDivElement>(null);

    const formatOptions: { key: FormatKey; labelKey: string }[] = [
        { key: 'soap', labelKey: 'formatSoap' },
        { key: 'clinical', labelKey: 'formatClinical' },
        { key: 'operative', labelKey: 'formatOperative' },
        { key: 'todo', labelKey: 'formatTodo' },
        { key: 'raw', labelKey: 'formatRaw' },
    ];

    const selectedLabel = t(formatOptions.find(o => o.key === format)!.labelKey);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    useEffect(() => {
        if (!patientDropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target as Node)) {
                setPatientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [patientDropdownOpen]);

    useEffect(() => {
        let cancelled = false;
        setLoadingPatients(true);
        getMyPatientFolders()
            .then((res) => {
                if (cancelled) return;
                const folders = Array.isArray(res?.items) ? res.items : [];
                const realPatients = folders
                    .filter((folder) => !isUnknownVirtualFolder(folder))
                    .map((folder) => folder.name.trim())
                    .filter(Boolean);
                setPatientOptions(Array.from(new Set(realPatients)));
                if (!patientName && realPatients.length > 0) {
                    setPatientName(realPatients[0]);
                }
            })
            .catch(() => {
                if (!cancelled) setPatientOptions([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingPatients(false);
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const value = (initialPatientName || '').trim();
        if (value) setPatientName(value);
    }, [initialPatientName]);

    const handleAddPatient = async () => {
        const suggested = generatePatientName();
        const name = prompt('Nhập tên bệnh nhân mới:', suggested);
        const trimmed = (name || '').trim() || suggested;
        if (!trimmed) return;

        setCreatingPatient(true);
        try {
            await createMyPatientFolder(trimmed);
            setPatientOptions((prev) => {
                if (prev.some((item) => item === trimmed)) return prev;
                return [...prev, trimmed];
            });
            setPatientName(trimmed);
            setPatientDropdownOpen(false);
        } catch {
            alert('Không thể tạo bệnh nhân lúc này. Vui lòng thử lại sau.');
        } finally {
            setCreatingPatient(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6 bg-bg-overlay fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onCancel} />

            {/* Dialog card */}
            <div
                className="relative w-full max-w-[340px] bg-save-card-bg flex flex-col"
                style={{
                    borderRadius: 20,
                    padding: '24px 24px 16px 24px',
                }}
            >
                <h2 className="text-[20px] font-bold text-text-primary">
                    {t('saveRecording')}
                </h2>

                <div className="h-6" />

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-[15px] text-text-primary bg-transparent border-b border-b-[#CCCCCC] pb-2 outline-none focus:border-b-accent-blue transition-colors"
                />

                <div className="h-5" />

                <span className="text-[13px] text-text-muted">Assign to Patient</span>
                <div className="h-1" />
                <div ref={patientDropdownRef} className="relative">
                    <button
                        onClick={() => setPatientDropdownOpen((v) => !v)}
                        className="w-full flex items-center justify-between py-1 transition-opacity active:opacity-60"
                    >
                        <span className={`text-[16px] font-bold ${patientName ? 'text-text-primary' : 'text-text-muted'}`}>
                            {patientName || 'Chọn bệnh nhân'}
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 text-text-muted transition-transform ${patientDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    <div className="h-px w-full bg-[#D0D0D0]" />
                    {patientDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-full bg-save-card-bg rounded-xl shadow-card border border-border z-10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-44 overflow-y-auto">
                            {patientOptions.map((patient) => (
                                <button
                                    key={patient}
                                    onClick={() => {
                                        setPatientName(patient);
                                        setPatientDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-[15px] transition-colors ${patientName === patient
                                        ? 'text-accent-blue font-semibold bg-accent-blue/10'
                                        : 'text-text-primary hover:bg-bg-surface'
                                        }`}
                                >
                                    {patient}
                                </button>
                            ))}
                            <div className="h-px bg-divider" />
                            <button
                                type="button"
                                onClick={handleAddPatient}
                                disabled={creatingPatient}
                                className="w-full text-left px-4 py-2.5 text-[15px] text-accent-blue font-semibold hover:bg-bg-surface transition-colors disabled:opacity-60"
                            >
                                <span className="inline-flex items-center gap-2">
                                    {creatingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {creatingPatient ? 'Đang tạo bệnh nhân...' : 'Thêm bệnh nhân'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
                {loadingPatients && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-text-muted">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tải danh sách bệnh nhân...
                    </div>
                )}

                <div className="h-5" />

                <span className="text-[13px] text-text-muted">
                    {t('outputFormat')}
                </span>

                <div className="h-1" />

                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1.5 py-1 transition-opacity active:opacity-60"
                    >
                        <span className="text-[16px] font-bold text-text-primary">{selectedLabel}</span>
                        <ChevronDown
                            className={`w-4 h-4 text-text-primary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-[200px] bg-save-card-bg rounded-xl shadow-card border border-border z-10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                            {formatOptions.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => { setFormat(opt.key); setDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[15px] transition-colors ${format === opt.key
                                        ? 'text-accent-blue font-semibold bg-accent-blue/10'
                                        : 'text-text-primary hover:bg-bg-surface'
                                        }`}
                                >
                                    {t(opt.labelKey)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-2" />

                <div className="flex items-center h-[48px]">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-full flex items-center justify-center text-[16px] font-semibold transition-opacity active:opacity-60 text-[#888888]"
                    >
                        {t('cancel')}
                    </button>

                    <div className="w-px h-5 bg-[#D0D0D0]" />

                    <button
                        onClick={() => onSave((name?.trim() || defaultName), format, patientName.trim())}
                        className="flex-1 h-full flex items-center justify-center text-[16px] font-bold text-accent-blue transition-opacity active:opacity-60"
                        title={t('save')}
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
