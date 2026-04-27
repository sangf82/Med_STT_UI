'use client';

/**
 * Pilot 108 — Personal Productivity (feature-[BDD] Personal Productivity.md)
 * Visual: pen `ERahL` / `VtdW0` (H4) + design tokens / components từ pen `MzSDs` / `rmCmK`.
 * Mock checklist: `?mockChecklist=1`. BDD harness (overlay / QA): `?bdd=1` only — not part of pen UI.
 * Finalized UI (design/E2E only): `?designMockFinalized=1` — local finalized draft + checklist rows, no server draft APIs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Pencil, Plus, Save, Share2, Trash2, X } from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import {
  pilot108CreateDraft,
  pilot108ExportDocx,
  pilot108FinalizeDraft,
  pilot108GetDraft,
  pilot108GetRoster,
  pilot108PatchDraftItems,
  pilot108ReopenDraft,
  pilot108ShareSnapshot,
  type Pilot108ApiError,
  type Pilot108Draft,
  type Pilot108DraftItem,
  type Pilot108RosterMember,
} from '@/lib/api/pilot108Individual';
import {
  PILOT108_PEN_CHECKLIST_ROWS_STRIP04,
  pilot108PenChecklistToEditableRows,
} from '@/lib/mocks/pilot108DesignAiMock';
import { PILOT108_INDIVIDUAL_BDD as BDD } from '@/lib/bdd/pilot108IndividualBdd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndividualAlerts } from '@/components/pilot108/individual/IndividualAlerts';
import { P108OrderRow } from '@/components/medmate/P108OrderRow';
import { P108StatusChip } from '@/components/medmate/P108StatusChip';
import { cn } from '@/lib/utils';

type EditableDraftItem = { id: string; text: string; assignee_id: string; patient_code: string; patient_name: string };
type LocalTaskUi = 'PENDING' | 'COMPLETED' | 'CANCELLED';

function uid() {
  return `item_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
}

function getErrorMessage(error: unknown) {
  const candidate = error as Pilot108ApiError;
  return candidate?.message || 'Something went wrong. Please try again.';
}

function rosterName(members: Pilot108RosterMember[], id: string) {
  return members.find((m) => m.member_id === id)?.name || '';
}

function buildMarkdown(items: Pilot108DraftItem[], members: Pilot108RosterMember[]): string {
  return (items || [])
    .map((item) => {
      const name = item.assignee_id ? rosterName(members, item.assignee_id) : '';
      const tag = name ? ` (@${name})` : '';
      const pc = (item.patient_code || '').trim();
      const pn = (item.patient_name || '').trim();
      const patientTag = pc || pn ? ` [${[pc, pn].filter(Boolean).join(' · ')}]` : '';
      return `- [ ]${patientTag} ${(item.text || '').trim()}${tag}`;
    })
    .join('\n');
}

const be =
  '[font-family:var(--font-p108-be),\"Be Vietnam Pro\",ui-sans-serif,system-ui,sans-serif]';
const news =
  '[font-family:var(--font-p108-newsreader),Newsreader,ui-serif,Georgia,serif]';
const p108Panel = 'overflow-hidden rounded-lg border border-border bg-card shadow-sm';
const p108PanelHead = 'border-b border-border px-4 py-3';
const p108H2 = cn('text-[15px] font-semibold tracking-tight text-foreground', news);
const p108Sub = cn('mt-0.5 text-xs leading-relaxed text-muted-foreground', be);
const p108TheadRow = 'border-b border-[#94A3B8] bg-muted';
const p108Th = cn(
  'px-3 py-4 text-left text-[12px] font-semibold text-foreground sm:px-4',
  be
);
const p108TbodyRow = 'border-b border-[#94A3B8] bg-card last:border-b-0';
const p108TableOuter = 'overflow-x-auto rounded-lg border border-[#94A3B8] bg-muted/40';
const inputPilot = cn(
  'h-10 border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30',
  be
);

export default function Pilot108IndividualPage() {
  const p108SessionTitle = useMemo(
    () =>
      `Danh sách việc · ${new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`,
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [roster, setRoster] = useState<Pilot108RosterMember[]>([]);
  const [bddHarness, setBddHarness] = useState(false);

  const [draft, setDraft] = useState<Pilot108Draft | null>(null);
  const [editableItems, setEditableItems] = useState<EditableDraftItem[]>([]);
  const [initialDraftItems, setInitialDraftItems] = useState<EditableDraftItem[]>([]);
  const [localTaskUi, setLocalTaskUi] = useState<Record<string, LocalTaskUi>>({});

  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [transcriptionError, setTranscriptionError] = useState(false);
  const [noTasksView, setNoTasksView] = useState(false);
  const noTasksRaw = 'The weather is nice today';
  const [offlineBanner, setOfflineBanner] = useState(false);
  const mockChecklistAppliedRef = useRef(false);
  const designMockFinalizedAppliedRef = useRef(false);
  const draftIdAppliedRef = useRef(false);

  const isFinalized = draft?.list_status === 'FINALIZED_LIST';

  useEffect(() => {
    const onLine = () => setOfflineBanner(!navigator.onLine);
    onLine();
    window.addEventListener('online', onLine);
    window.addEventListener('offline', onLine);
    return () => {
      window.removeEventListener('online', onLine);
      window.removeEventListener('offline', onLine);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setBddHarness(new URLSearchParams(window.location.search).get('bdd') === '1');
  }, []);

  useEffect(() => {
    if (!showProcessingOverlay) return;
    setProcessingStep(0);
    const t0 = window.setTimeout(() => setProcessingStep(1), 700);
    const t1 = window.setTimeout(() => setProcessingStep(2), 1400);
    const t2 = window.setTimeout(() => setProcessingStep(3), 2100);
    const t3 = window.setTimeout(() => setShowProcessingOverlay(false), 2800);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showProcessingOverlay]);

  const loadRoster = useCallback(async () => {
    const rosterRes = await pilot108GetRoster();
    setRoster(rosterRes.members || []);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await loadRoster();
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadRoster]);

  const pushToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3200);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading) return;
    if (draft) return;
    const params = new URLSearchParams(window.location.search);
    const draftId = params.get('draftId');
    if (!draftId) return;
    if (draftIdAppliedRef.current) return;
    draftIdAppliedRef.current = true;
    const run = async () => {
      setSaving(true);
      setError('');
      try {
        const res = await pilot108GetDraft(draftId);
        const mapped = toEditableItems(res.items || []);
        setDraft(res);
        setEditableItems(mapped);
        setInitialDraftItems(mapped);
        setLocalTaskUi({});
        pushToast('Admin-reviewed checklist loaded.');
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    };
    void run();
  }, [loading, draft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading) return;
    if (draft) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('designMockFinalized') === '1') return;
    if (params.get('mockChecklist') !== '1') return;
    if (mockChecklistAppliedRef.current) return;
    mockChecklistAppliedRef.current = true;
    setEditableItems(
      pilot108PenChecklistToEditableRows(PILOT108_PEN_CHECKLIST_ROWS_STRIP04, {
        newId: uid,
        defaultAssigneeId: roster[0]?.member_id || '',
      }),
    );
    setToast('Mock checklist loaded (?mockChecklist=1 · pen strip 04).');
    window.setTimeout(() => setToast(''), 3200);
  }, [loading, draft, roster]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('designMockFinalized') !== '1') return;
    if (designMockFinalizedAppliedRef.current) return;
    designMockFinalizedAppliedRef.current = true;
    const rows = pilot108PenChecklistToEditableRows(PILOT108_PEN_CHECKLIST_ROWS_STRIP04, {
      newId: uid,
      defaultAssigneeId: roster[0]?.member_id || '',
    });
    const items: Pilot108DraftItem[] = rows.map((r) => ({
      id: r.id,
      text: r.text,
      assignee_id: r.assignee_id || undefined,
      patient_code: r.patient_code || undefined,
      patient_name: r.patient_name || undefined,
      status: 'PENDING',
    }));
    const mockDraft: Pilot108Draft = {
      id: 'design-mock-finalized',
      user_id: 'design-preview',
      list_status: 'FINALIZED_LIST',
      items,
      share_scope: 'ONLY_ME',
    };
    setLocalTaskUi({});
    setEditableItems(rows);
    setInitialDraftItems(rows.map((r) => ({ ...r })));
    setDraft(mockDraft);
  }, [loading, roster]);

  const toEditableItems = (items: Pilot108DraftItem[]) =>
    (items || []).map((item) => ({
      id: item.id,
      text: item.text,
      assignee_id: item.assignee_id || '',
      patient_code: item.patient_code ?? '',
      patient_name: item.patient_name ?? '',
    }));

  const mergedItemsForDisplay = useMemo((): Pilot108DraftItem[] => {
    return editableItems.map((row) => {
      const srv = draft?.items?.find((i) => i.id === row.id);
      const ui = localTaskUi[row.id];
      const status = ui || srv?.status || (isFinalized ? 'PENDING' : 'DRAFT');
      return {
        id: row.id,
        text: row.text,
        assignee_id: row.assignee_id || undefined,
        patient_code: row.patient_code || undefined,
        patient_name: row.patient_name || undefined,
        status,
      };
    });
  }, [draft?.items, editableItems, isFinalized, localTaskUi]);

  const handleCreateDraft = async () => {
    if (!editableItems.length) {
      setError('Add at least one task row.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payloadItems = editableItems.map((item) => ({
        id: item.id.trim(),
        text: item.text.trim(),
        assignee_id: item.assignee_id || undefined,
        patient_code: item.patient_code.trim() || undefined,
        patient_name: item.patient_name.trim() || undefined,
      }));
      const res = await pilot108CreateDraft({
        items: payloadItems,
        idempotency_key: `create_${Date.now()}`,
      });
      const mapped = toEditableItems(res.items || []);
      setDraft(res);
      setEditableItems(mapped);
      setInitialDraftItems(mapped);
      setLocalTaskUi({});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePatchDraft = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const initialIds = new Set(initialDraftItems.map((item) => item.id));
      const currentIds = new Set(editableItems.map((item) => item.id));
      const deleteItemIds = Array.from(initialIds).filter((id) => !currentIds.has(id));
      const updates = editableItems.map((item) => ({
        id: item.id,
        text: item.text.trim(),
        assignee_id: item.assignee_id || undefined,
        patient_code: item.patient_code.trim(),
        patient_name: item.patient_name.trim(),
      }));
      const res = await pilot108PatchDraftItems(draft.id, { updates, delete_item_ids: deleteItemIds });
      const mapped = toEditableItems(res.items || []);
      setDraft(res);
      setEditableItems(mapped);
      setInitialDraftItems(mapped);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108FinalizeDraft(draft.id, `finalize_${Date.now()}`, 'ONLY_ME');
      setDraft(res);
      const mapped = toEditableItems(res.items || []);
      setEditableItems(mapped);
      setInitialDraftItems(mapped);
      setLocalTaskUi({});
      pushToast('Finalized list ready.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108ReopenDraft(draft.id);
      setDraft(res);
      const mapped = toEditableItems(res.items || []);
      setEditableItems(mapped);
      setInitialDraftItems(mapped);
      setLocalTaskUi({});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!draft) return;
    const md = buildMarkdown(draft.items || [], roster);
    try {
      if (navigator.share) {
        await navigator.share({ text: md, title: 'Markdown' });
      } else {
        await navigator.clipboard.writeText(md);
        pushToast('Markdown copied to clipboard');
      }
    } catch {
      pushToast('Share cancelled or unavailable');
    }
  };

  const handleExportDocx = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const blob = await pilot108ExportDocx(draft.id);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `pilot108-${draft.id}.docx`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleShareSnapshot = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      await pilot108ShareSnapshot(draft.id);
      pushToast('Snapshot saved (audit)');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const canCreateDraft = useMemo(
    () => !draft && editableItems.every((item) => item.id.trim() && item.text.trim()),
    [draft, editableItems],
  );
  const allowLocalAuthoring = bddHarness;

  const tickCross = (itemId: string, next: LocalTaskUi) => {
    setLocalTaskUi((prev) => ({ ...prev, [itemId]: next }));
  };

  if (loading) {
    return (
      <P108Shell sessionTitle={p108SessionTitle}>
        <div className="mx-auto flex min-h-[40vh] max-w-[390px] items-center justify-center gap-2 text-sm text-[#64748B]">
          <Loader2 className="h-5 w-5 animate-spin text-[#219EBC]" />
          Đang tải…
        </div>
      </P108Shell>
    );
  }

  return (
    <P108Shell sessionTitle={p108SessionTitle}>
      <div className="relative mx-auto w-full max-w-[390px] space-y-4 pb-16 sm:max-w-none">
        <IndividualAlerts
          offline={offlineBanner}
          waitingOffline={BDD.waitingOffline}
          toast={toast}
          error={error}
        />

        {bddHarness ? (
          <>
            {showProcessingOverlay ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
                role="status"
                aria-live="polite"
                data-testid="p108-bdd-processing-overlay"
              >
                <div className="w-full max-w-sm rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
                  <p className="text-center font-serif text-lg font-semibold text-white">Đang xử lý</p>
                  <ul className="mt-4 space-y-2 font-mono text-sm">
                    {BDD.processingSteps.map((label, i) => (
                      <li
                        key={label}
                        className={i === processingStep ? 'text-[#FB8A0A]' : i < processingStep ? 'text-emerald-400' : 'text-slate-500'}
                      >
                        {i < processingStep ? '✓ ' : i === processingStep ? '● ' : '○ '}
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {transcriptionError ? (
              <section className={p108Panel} role="alert" data-testid="p108-bdd-transcription-error">
                <div className="border-b border-red-100 bg-red-50/80 px-4 py-3">
                  <h2 className="text-[15px] font-semibold text-red-900">Transcription</h2>
                </div>
                <div className="space-y-4 p-4">
                  <p className="text-sm text-red-800">{BDD.transcriptionError}</p>
                  <Button
                    type="button"
                    variant="default"
                    className={cn('h-10', be)}
                    onClick={() => {
                      setTranscriptionError(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Back to Quick Capture
                  </Button>
                </div>
              </section>
            ) : null}

            {noTasksView ? (
              <section className={p108Panel} data-testid="p108-bdd-no-tasks">
                <div className={p108PanelHead}>
                  <h2 className={p108H2}>No actionable items</h2>
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Raw transcript</p>
                  <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">{noTasksRaw}</p>
                  <p className="text-sm text-slate-600">{BDD.noTasksPrompt}</p>
                  <Button
                    type="button"
                    variant="default"
                    className={cn('h-10', be)}
                    onClick={() => {
                      setNoTasksView(false);
                      setEditableItems((prev) =>
                        prev.length
                          ? prev
                          : [
                              {
                                id: uid(),
                                text: '',
                                assignee_id: roster[0]?.member_id || '',
                                patient_code: '',
                                patient_name: '',
                              },
                            ],
                      );
                    }}
                  >
                    Add Manually
                  </Button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {/* Draft / Finalized checklist — pen H4 surface only (roster editing → /pilot108/team) */}
        {(!bddHarness || (!noTasksView && !transcriptionError)) ? (
          <section className={p108Panel} data-testid="p108-h4-checklist-panel">
            <div className={`flex items-start justify-between gap-2 ${p108PanelHead}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={p108H2} data-testid="p108-h4-checklist-title">
                    {isFinalized ? 'Việc cần làm · Đã chốt' : 'Danh sách nháp'}
                  </h2>
                  <P108StatusChip
                    testId="p108-h4-status-chip"
                    className={cn(
                      'px-3 py-0.5 text-xs',
                      be,
                    )}
                    tone={isFinalized ? 'finalized' : 'draft'}
                    label={isFinalized ? 'FINALIZED' : 'DRAFT'}
                  />
                </div>
                <p className={p108Sub}>
                  {isFinalized
                    ? 'Đã chốt — đánh dấu hoàn thành / hủy. Bút chỉnh sửa để mở lại bản nháp.'
                    : (
                        <>
                          Bản nháp — chưa tick. Người thực hiện lấy từ roster (
                          <Link href="/pilot108/team" className="font-medium text-primary underline-offset-2 hover:underline">
                            chỉnh team
                          </Link>
                          ).
                        </>
                      )}
                </p>
              </div>
              {isFinalized ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Edit (reopen draft)"
                  aria-label="Edit list"
                  onClick={() => void handleReopen()}
                  disabled={saving}
                >
                  <Pencil className="h-5 w-5 text-primary" />
                </Button>
              ) : null}
            </div>

            <div className="space-y-3 p-4">
              <div className={p108TableOuter}>
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <thead>
                    <tr className={p108TheadRow}>
                      <th className={`${p108Th} min-w-[120px] max-w-[200px] border-r border-[#94A3B8]`}>
                        Thông tin bệnh nhân
                      </th>
                      <th className={`${p108Th} min-w-[130px] border-r border-[#94A3B8]`}>Việc làm</th>
                      <th className={`${p108Th} w-[88px] min-w-[65px] text-center sm:w-[110px]`}>
                        Người TH
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableItems.length === 0 ? (
                      <tr className={p108TbodyRow}>
                        <td
                          colSpan={3}
                          className="px-4 py-10 text-center text-xs text-[#64748B] [font-family:var(--font-p108-be),sans-serif]"
                        >
                          {allowLocalAuthoring
                            ? 'Thêm dòng bên dưới, rồi tạo bản nháp trên máy chủ.'
                            : 'Chưa có danh sách. Chờ admin xử lý STT, duyệt checklist và publish cho bạn.'}
                        </td>
                      </tr>
                    ) : (
                      editableItems.map((item, idx) => {
                        const disp = mergedItemsForDisplay.find((i) => i.id === item.id);
                        const st = disp?.status;
                        return (
                          <tr key={item.id} className={`${p108TbodyRow} ${st === 'CANCELLED' ? 'opacity-50' : ''}`}>
                            <td className="border-r border-[#94A3B8] bg-white px-3 py-3 align-top sm:px-4 sm:py-4">
                              {isFinalized ? (
                                <div className={cn('space-y-1', be)}>
                                  <p className="font-mono text-[11px] font-medium text-[#64748B]">
                                    {item.patient_code.trim() || '—'}
                                  </p>
                                  <p className="text-[13px] font-semibold text-[#0F172A]">
                                    {item.patient_name.trim() || '—'}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div>
                                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                                      Mã BN
                                    </label>
                                    <Input
                                      className={cn(inputPilot, 'h-8 font-mono text-xs')}
                                      value={item.patient_code}
                                      onChange={(e) =>
                                        setEditableItems((prev) =>
                                          prev.map((row, i) =>
                                            i === idx ? { ...row, patient_code: e.target.value } : row,
                                          ),
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                                      Họ tên
                                    </label>
                                    <Input
                                      className={cn(inputPilot, 'h-8 text-[13px]')}
                                      value={item.patient_name}
                                      onChange={(e) =>
                                        setEditableItems((prev) =>
                                          prev.map((row, i) =>
                                            i === idx ? { ...row, patient_name: e.target.value } : row,
                                          ),
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="border-r border-[#94A3B8] px-3 py-3 align-top sm:px-4 sm:py-4">
                              {isFinalized ? (
                                <div className="flex items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <P108OrderRow
                                      checked={st === 'COMPLETED'}
                                      disabled={st === 'CANCELLED'}
                                      onCheckedChange={(checked) =>
                                        tickCross(item.id, checked ? 'COMPLETED' : 'PENDING')
                                      }
                                      contentClassName={cn(
                                        'text-[13px] font-medium',
                                        be,
                                        st === 'COMPLETED' && 'text-muted-foreground line-through',
                                        st === 'CANCELLED' && 'text-muted-foreground'
                                      )}
                                      className={cn(
                                        'border-0 bg-transparent p-0 shadow-none',
                                        st === 'CANCELLED' && 'opacity-60'
                                      )}
                                    >
                                      {item.text}
                                    </P108OrderRow>
                                  </div>
                                  {st !== 'CANCELLED' ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="shrink-0 text-destructive hover:bg-destructive/10"
                                      aria-label="Đánh dấu hủy"
                                      onClick={() => tickCross(item.id, 'CANCELLED')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <P108OrderRow
                                      checked={false}
                                      checkboxDisabled
                                      contentClassName={cn('min-w-0 flex-1', be)}
                                      className="border-0 bg-transparent p-0 py-2 shadow-none sm:py-2.5"
                                    >
                                      <Input
                                        className={cn(inputPilot, 'h-auto border-0 bg-transparent p-0 text-[13px] shadow-none focus-visible:ring-0')}
                                        value={item.text}
                                        onChange={(e) =>
                                          setEditableItems((prev) =>
                                            prev.map((row, i) => (i === idx ? { ...row, text: e.target.value } : row)),
                                          )
                                        }
                                      />
                                    </P108OrderRow>
                                  </div>
                                  {allowLocalAuthoring ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="shrink-0 text-muted-foreground hover:text-destructive"
                                      aria-label="Xóa dòng"
                                      onClick={() => setEditableItems((prev) => prev.filter((row) => row.id !== item.id))}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-3 text-center align-top sm:py-4">
                              {roster.length === 0 ? (
                                <p className="text-left text-[11px] text-amber-800 [font-family:var(--font-p108-be),sans-serif]">
                                  {BDD.assigneeEmpty}
                                </p>
                              ) : (
                                <select
                                  className={cn(inputPilot, 'text-center text-[13px]')}
                                  value={item.assignee_id}
                                  disabled={isFinalized}
                                  onChange={(e) =>
                                    setEditableItems((prev) =>
                                      prev.map((row, i) => (i === idx ? { ...row, assignee_id: e.target.value } : row)),
                                    )
                                  }
                                >
                                  <option value="">—</option>
                                  {roster.map((m) => (
                                    <option key={m.member_id} value={m.member_id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!isFinalized && allowLocalAuthoring ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn('h-10', be)}
                  onClick={() =>
                    setEditableItems((prev) => [
                      ...prev,
                      {
                        id: uid(),
                        text: '',
                        assignee_id: roster[0]?.member_id || '',
                        patient_code: '',
                        patient_name: '',
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </Button>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {!draft && allowLocalAuthoring ? (
                  <Button
                    type="button"
                    variant="default"
                    className={cn('h-10', be)}
                    onClick={handleCreateDraft}
                    disabled={saving || !canCreateDraft}
                  >
                    <Save className="h-4 w-4" />
                    Create draft
                  </Button>
                ) : !draft ? (
                  <p className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#64748B]">
                    Danh sách việc cần làm được admin publish sau Step 2.
                  </p>
                ) : !isFinalized ? (
                  <>
                    <Button type="button" variant="outline" className={cn('h-10', be)} onClick={handlePatchDraft} disabled={saving}>
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      className={cn('h-10', be)}
                      onClick={() => void handleFinalize()}
                      disabled={saving}
                    >
                      Finalize
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" className={cn('h-10', be)} onClick={handleExportMarkdown} disabled={saving}>
                      <Share2 className="h-4 w-4" />
                      Export &amp; Share
                    </Button>
                    <Button type="button" variant="outline" className={cn('h-10', be)} onClick={handleShareSnapshot} disabled={saving}>
                      Snapshot
                    </Button>
                    <Button type="button" variant="outline" className={cn('h-10', be)} onClick={handleExportDocx} disabled={saving}>
                      <Download className="h-4 w-4" />
                      Export DOCX
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {bddHarness ? (
          <section
            className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground"
            data-testid="p108-bdd-qa-section"
          >
            <p className="font-medium text-foreground">QA / BDD edge paths</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', be)}
                data-testid="p108-bdd-qa-processing"
                onClick={() => setShowProcessingOverlay(true)}
              >
                Preview processing copy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', be)}
                data-testid="p108-bdd-qa-toast-no-audio"
                onClick={() => pushToast(BDD.noAudioToast)}
              >
                Toast: empty recording
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', be)}
                data-testid="p108-bdd-qa-transcription-error"
                onClick={() => setTranscriptionError(true)}
              >
                Screen: transcription error
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', be)}
                data-testid="p108-bdd-qa-no-tasks"
                onClick={() => setNoTasksView(true)}
              >
                Screen: no actionable tasks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', be)}
                data-testid="p108-bdd-qa-offline-banner"
                onClick={() => setOfflineBanner((v) => !v)}
              >
                Toggle offline banner
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', be)}
                disabled={!!draft}
                data-testid="p108-bdd-qa-fill-checklist"
                onClick={() => {
                  if (draft) {
                    pushToast('Reopen draft or start without a server draft to refill rows from pen.');
                    return;
                  }
                  setEditableItems(
                    pilot108PenChecklistToEditableRows(PILOT108_PEN_CHECKLIST_ROWS_STRIP04, {
                      newId: uid,
                      defaultAssigneeId: roster[0]?.member_id || '',
                    }),
                  );
                  pushToast('Draft table filled from pen e3zO7 · strip 04 (same checklist as design).');
                }}
              >
                Fill table from pen checklist (e3zO7·04)
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </P108Shell>
  );
}
