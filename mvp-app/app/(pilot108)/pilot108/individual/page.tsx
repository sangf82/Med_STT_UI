'use client';

/**
 * Pilot 108 — Personal Productivity (feature-[BDD] Personal Productivity.md)
 * Layout: mobile-first 390px column, colors aligned to pen-stt-108 (teal / orange / slate).
 * STT record/stop still lives on /recording; this page owns roster + draft lifecycle (API).
 * Pen checklist for AI mocks: `e3zO7` → `x6ccy` → `cc4zw` (not the shadcn root `MzSDs`).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  Download,
  Loader2,
  Mic,
  Pencil,
  Plus,
  Search,
  Save,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import {
  pilot108AddRosterMember,
  pilot108CreateDraft,
  pilot108DeleteRosterMember,
  pilot108ExportDocx,
  pilot108FinalizeDraft,
  pilot108GetRoster,
  pilot108PatchDraftItems,
  pilot108ReopenDraft,
  pilot108ShareSnapshot,
  pilot108UpdateRosterMember,
  pilot108UpsertRosterBulk,
  type Pilot108ApiError,
  type Pilot108Draft,
  type Pilot108DraftItem,
  type Pilot108RosterMember,
  type Pilot108ShareScope,
} from '@/lib/api/pilot108Individual';
import {
  createThongTinEntry,
  deleteThongTinEntry,
  listThongTinEntries,
  type ThongTinEntry,
} from '@/lib/api/thongTinEntries';
import {
  PILOT108_PEN_CHECKLIST_ROWS_STRIP04,
  pilot108PenChecklistToEditableRows,
} from '@/lib/mocks/pilot108DesignAiMock';

type EditableDraftItem = { id: string; text: string; assignee_id: string };
type LocalTaskUi = 'PENDING' | 'COMPLETED' | 'CANCELLED';

const BDD = {
  processingSteps: [
    'Uploading Audio...',
    'Transcribing...',
    'Identifying Team Members...',
    'Formatting To-Do List...',
  ] as const,
  transcriptionError: "Sorry, I couldn't hear that clearly. Try again?",
  noAudioToast: 'No audio captured',
  noTasksPrompt:
    "I couldn't find any to-do items. Would you like to create one manually?",
  shareTitle: 'Do you want to share this?',
  shareExternal: 'External',
  shareOnlyMe: 'Only Me',
  assigneeEmpty: 'No team members found. [Upload List Now]',
  waitingOffline: 'Waiting for connection...',
} as const;

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
      return `- [ ] ${(item.text || '').trim()}${tag}`;
    })
    .join('\n');
}

const card =
  'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5';
const cardHead = 'border-b border-slate-100 bg-slate-50/90 px-4 py-3';
const h2 = 'text-[15px] font-semibold tracking-tight text-slate-900';
const sub = 'mt-0.5 text-xs leading-relaxed text-slate-500';
const btnTeal =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#219EBC] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a8bab] disabled:pointer-events-none disabled:opacity-50';
const btnOrange =
  'inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FB8A0A] text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#e67d00] disabled:opacity-50';
const btnOutline =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50';
const btnGhost = 'inline-flex h-9 items-center justify-center rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-100';
const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#219EBC] focus:ring-2 focus:ring-[#219EBC]/20';

export default function Pilot108IndividualPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [roster, setRoster] = useState<Pilot108RosterMember[]>([]);
  const [bulkRosterText, setBulkRosterText] = useState('');
  const [newMember, setNewMember] = useState({ name: '', role: '', email_or_id: '' });
  const [editingMemberId, setEditingMemberId] = useState('');
  const [editingMember, setEditingMember] = useState({ name: '', role: '', email_or_id: '' });

  const [draft, setDraft] = useState<Pilot108Draft | null>(null);
  const [editableItems, setEditableItems] = useState<EditableDraftItem[]>([]);
  const [initialDraftItems, setInitialDraftItems] = useState<EditableDraftItem[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [localTaskUi, setLocalTaskUi] = useState<Record<string, LocalTaskUi>>({});

  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [transcriptionError, setTranscriptionError] = useState(false);
  const [noTasksView, setNoTasksView] = useState(false);
  const [noTasksRaw, setNoTasksRaw] = useState('The weather is nice today');
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [thongTinEntries, setThongTinEntries] = useState<ThongTinEntry[]>([]);
  const [thongTinQuery, setThongTinQuery] = useState('');
  const [thongTinForm, setThongTinForm] = useState({ name: '', thong_tin: '' });
  const [thongTinLoading, setThongTinLoading] = useState(false);
  const [thongTinSaving, setThongTinSaving] = useState(false);

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

  const loadThongTin = useCallback(
    async (nameFilter?: string) => {
      setThongTinLoading(true);
      try {
        const res = await listThongTinEntries({
          name: (nameFilter ?? thongTinQuery).trim() || undefined,
          limit: 100,
        });
        setThongTinEntries(res.items || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setThongTinLoading(false);
      }
    },
    [thongTinQuery],
  );

  const loadRoster = useCallback(async () => {
    const rosterRes = await pilot108GetRoster();
    setRoster(rosterRes.members || []);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadRoster(), loadThongTin('')]);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadRoster, loadThongTin]);

  const handleCreateThongTin = async () => {
    const name = thongTinForm.name.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }
    setThongTinSaving(true);
    setError('');
    try {
      await createThongTinEntry({
        name,
        thong_tin: thongTinForm.thong_tin.trim(),
      });
      setThongTinForm({ name: '', thong_tin: '' });
      await loadThongTin(thongTinQuery);
      pushToast('Saved thong_tin entry');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setThongTinSaving(false);
    }
  };

  const handleDeleteThongTin = async (entryId: string) => {
    setThongTinSaving(true);
    setError('');
    try {
      await deleteThongTinEntry(entryId);
      await loadThongTin(thongTinQuery);
      pushToast('Deleted entry');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setThongTinSaving(false);
    }
  };

  const pushToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3200);
  };

  const toEditableItems = (items: Pilot108DraftItem[]) =>
    (items || []).map((item) => ({
      id: item.id,
      text: item.text,
      assignee_id: item.assignee_id || '',
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
        status,
      };
    });
  }, [draft?.items, editableItems, isFinalized, localTaskUi]);

  const handleBulkRoster = async () => {
    if (!bulkRosterText.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108UpsertRosterBulk(bulkRosterText);
      setRoster(res.members || []);
      setBulkRosterText('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108AddRosterMember({
        name: newMember.name.trim(),
        role: newMember.role.trim() || undefined,
        email_or_id: newMember.email_or_id.trim() || undefined,
      });
      setRoster(res.members || []);
      setNewMember({ name: '', role: '', email_or_id: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await pilot108DeleteRosterMember(memberId);
      setRoster(res.members || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const beginEditMember = (member: Pilot108RosterMember) => {
    setEditingMemberId(member.member_id);
    setEditingMember({
      name: member.name || '',
      role: member.role || '',
      email_or_id: member.email_or_id || '',
    });
  };

  const handleSaveMember = async () => {
    if (!editingMemberId || !editingMember.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108UpdateRosterMember(editingMemberId, {
        name: editingMember.name.trim(),
        role: editingMember.role.trim() || undefined,
        email_or_id: editingMember.email_or_id.trim() || undefined,
      });
      setRoster(res.members || []);
      setEditingMemberId('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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

  const handleConfirmFinalize = async (scope: Pilot108ShareScope) => {
    if (!draft) return;
    setSaving(true);
    setError('');
    setShareModalOpen(false);
    try {
      const res = await pilot108FinalizeDraft(draft.id, `finalize_${Date.now()}`, scope);
      setDraft(res);
      const mapped = toEditableItems(res.items || []);
      setEditableItems(mapped);
      setInitialDraftItems(mapped);
      setLocalTaskUi({});
      if (scope === 'EXTERNAL') {
        const md = buildMarkdown(res.items || [], roster);
        const line = (res.items || [])
          .map((item) => {
            const n = item.assignee_id ? rosterName(roster, item.assignee_id) : '';
            return `[ ] ${item.text.trim()}${n ? ` (@${n})` : ''}`;
          })
          .join('\n');
        try {
          if (navigator.share) {
            await navigator.share({ text: line || md, title: 'To-do list' });
          }
        } catch {
          /* user cancelled share sheet */
        }
      }
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

  const tickCross = (itemId: string, next: LocalTaskUi) => {
    setLocalTaskUi((prev) => ({ ...prev, [itemId]: next }));
  };

  if (loading) {
    return (
      <P108Shell>
        <div className="mx-auto flex max-w-[390px] min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#219EBC]" />
          Loading…
        </div>
      </P108Shell>
    );
  }

  return (
    <P108Shell>
      <div className="relative mx-auto w-full max-w-[390px] space-y-4 pb-16">
        {offlineBanner ? (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900"
          >
            {BDD.waitingOffline}
          </div>
        ) : null}

        {toast ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-900">
            {toast}
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {/* Quick Capture — BDD: Given on Quick Capture; Record on /recording */}
        <section className={card}>
          <div className={cardHead}>
            <h2 className={h2}>Quick Capture</h2>
            <p className={sub}>
              Tap Record, speak your tasks, then Stop. You should see a Draft To-Do List (editable, not tickable until
              finalized).
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 px-4 py-8">
            <Link
              href="/recording?pilot108=1"
              className={btnOrange}
              aria-label="Record"
              title="Stream STT to-do + persona / thông tin + link admin live"
            >
              <Mic className="h-7 w-7" strokeWidth={2.2} />
            </Link>
            <p className="text-center text-xs text-slate-500">Opens Record &amp; STT (stream upload + AI).</p>
            <button type="button" className={btnOutline} onClick={() => setShowProcessingOverlay(true)}>
              Preview processing copy
            </button>
          </div>
        </section>

        {/* Processing overlay — BDD exact strings (UI reference until wired to real pipeline) */}
        {showProcessingOverlay ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
            role="status"
            aria-live="polite"
          >
            <div className="w-full max-w-sm rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-center font-serif text-lg font-semibold text-white">Processing</p>
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

        {/* Transcription error — BDD */}
        {transcriptionError ? (
          <section className={card} role="alert">
            <div className="border-b border-red-100 bg-red-50/80 px-4 py-3">
              <h2 className="text-[15px] font-semibold text-red-900">Transcription</h2>
            </div>
            <div className="space-y-4 p-4">
              <p className="text-sm text-red-800">{BDD.transcriptionError}</p>
              <button
                type="button"
                className={btnTeal}
                onClick={() => {
                  setTranscriptionError(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Back to Quick Capture
              </button>
            </div>
          </section>
        ) : null}

        {/* No actionable tasks — BDD */}
        {noTasksView ? (
          <section className={card}>
            <div className={cardHead}>
              <h2 className={h2}>No actionable items</h2>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Raw transcript</p>
              <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">{noTasksRaw}</p>
              <p className="text-sm text-slate-600">{BDD.noTasksPrompt}</p>
              <button type="button" className={btnOutline} onClick={() => setNoTasksView(false)}>
                Close
              </button>
            </div>
          </section>
        ) : null}

        {/* Roster — BDD context + onboarding error when empty */}
        <details className={`${card} [&[open]_summary_.chevron]:rotate-180`} open={roster.length === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className={h2}>Team roster</h2>
              <p className={sub}>Context for names (e.g. Xavier Nguyen). Optional before assignees.</p>
            </div>
            <ChevronDown className="chevron h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200" />
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-4">
            <textarea
              value={bulkRosterText}
              onChange={(e) => setBulkRosterText(e.target.value)}
              placeholder="Comma-separated names"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#219EBC]"
            />
            <button type="button" className={btnTeal} onClick={handleBulkRoster} disabled={saving || !bulkRosterText.trim()}>
              Save roster
            </button>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className={inputClass}
                placeholder="New name"
                value={newMember.name}
                onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
              />
              <button type="button" className={btnOutline} onClick={handleAddMember} disabled={saving || !newMember.name.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {roster.map((m) =>
                editingMemberId === m.member_id ? (
                  <div key={m.member_id} className="flex flex-wrap gap-1 rounded-lg border border-slate-100 p-2">
                    <input
                      className={inputClass}
                      value={editingMember.name}
                      onChange={(e) => setEditingMember((p) => ({ ...p, name: e.target.value }))}
                    />
                    <button type="button" className={btnTeal} onClick={handleSaveMember} disabled={saving}>
                      Save
                    </button>
                    <button type="button" className={btnGhost} onClick={() => setEditingMemberId('')}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div key={m.member_id} className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-1.5">
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <span className="flex gap-1">
                      <button type="button" className={btnGhost} onClick={() => beginEditMember(m)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className={btnGhost} onClick={() => void handleDeleteMember(m.member_id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </details>

        <section className={card}>
          <div className={cardHead}>
            <h2 className={h2}>Kho thong_tin</h2>
            <p className={sub}>Tao va lay list theo name de dung lam input cho API khac.</p>
          </div>
          <div className="space-y-3 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className={inputClass}
                placeholder="Filter by name"
                value={thongTinQuery}
                onChange={(e) => setThongTinQuery(e.target.value)}
              />
              <button
                type="button"
                className={btnOutline}
                disabled={thongTinLoading}
                onClick={() => void loadThongTin(thongTinQuery)}
              >
                {thongTinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Get list
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <input
                className={inputClass}
                placeholder="name (required)"
                value={thongTinForm.name}
                onChange={(e) => setThongTinForm((p) => ({ ...p, name: e.target.value }))}
              />
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#219EBC]"
                rows={4}
                placeholder="thong_tin"
                value={thongTinForm.thong_tin}
                onChange={(e) => setThongTinForm((p) => ({ ...p, thong_tin: e.target.value }))}
              />
              <button type="button" className={btnTeal} disabled={thongTinSaving} onClick={() => void handleCreateThongTin()}>
                {thongTinSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save entry
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Thong tin</th>
                    <th className="px-2 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {thongTinEntries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-2 py-6 text-center text-xs text-slate-500">
                        No entries
                      </td>
                    </tr>
                  ) : (
                    thongTinEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-2 py-2 align-top font-medium text-slate-800">{entry.name}</td>
                        <td className="px-2 py-2 align-top text-slate-700">
                          <p className="whitespace-pre-wrap break-words">{entry.thong_tin || '—'}</p>
                        </td>
                        <td className="px-2 py-2 text-right align-top">
                          <button
                            type="button"
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            disabled={thongTinSaving}
                            onClick={() => void handleDeleteThongTin(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Draft / Finalized checklist */}
        {!noTasksView && !transcriptionError ? (
          <section className={card}>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
              <div>
                <h2 className={h2}>{isFinalized ? 'To-Do · Finalized' : 'Draft To-Do List'}</h2>
                <p className={sub}>
                  {isFinalized
                    ? 'FINALIZED_LIST — tickable (tick / cross). Edit (pencil) returns to draft.'
                    : 'DRAFT — not tickable. Assignee column uses roster IDs.'}
                </p>
              </div>
              {isFinalized ? (
                <button
                  type="button"
                  className={btnGhost}
                  title="Edit (reopen draft)"
                  aria-label="Edit list"
                  onClick={() => void handleReopen()}
                  disabled={saving}
                >
                  <Pencil className="h-5 w-5 text-[#219EBC]" />
                </button>
              ) : null}
            </div>

            <div className="space-y-3 p-4">
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Task</th>
                      <th className="px-2 py-2">Assignee</th>
                      {isFinalized ? <th className="px-2 py-2 text-right">Actions</th> : <th className="w-8" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editableItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-2 py-6 text-center text-xs text-slate-500">
                          Add rows below, then Create draft.
                        </td>
                      </tr>
                    ) : (
                      editableItems.map((item, idx) => {
                        const disp = mergedItemsForDisplay.find((i) => i.id === item.id);
                        const st = disp?.status;
                        return (
                          <tr key={item.id} className={st === 'CANCELLED' ? 'opacity-50' : ''}>
                            <td className="px-2 py-2 align-top">
                              {isFinalized ? (
                                <span
                                  className={
                                    st === 'COMPLETED' ? 'text-slate-400 line-through' : 'font-medium text-slate-900'
                                  }
                                >
                                  {item.text}
                                </span>
                              ) : (
                                <input
                                  className={inputClass}
                                  value={item.text}
                                  disabled={isFinalized}
                                  onChange={(e) =>
                                    setEditableItems((prev) =>
                                      prev.map((row, i) => (i === idx ? { ...row, text: e.target.value } : row)),
                                    )
                                  }
                                />
                              )}
                            </td>
                            <td className="px-2 py-2 align-top">
                              {roster.length === 0 ? (
                                <p className="text-xs text-amber-800">{BDD.assigneeEmpty}</p>
                              ) : (
                                <select
                                  className={inputClass}
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
                            {isFinalized ? (
                              <td className="px-2 py-2 text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50"
                                    aria-label="Tick completed"
                                    onClick={() => tickCross(item.id, 'COMPLETED')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50"
                                    aria-label="Cross cancelled"
                                    onClick={() => tickCross(item.id, 'CANCELLED')}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            ) : (
                              <td className="px-2 py-2 text-right">
                                <button
                                  type="button"
                                  className={btnGhost}
                                  aria-label="Remove row"
                                  onClick={() => setEditableItems((prev) => prev.filter((row) => row.id !== item.id))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!isFinalized ? (
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() =>
                    setEditableItems((prev) => [...prev, { id: uid(), text: '', assignee_id: roster[0]?.member_id || '' }])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {!draft ? (
                  <button type="button" className={btnTeal} onClick={handleCreateDraft} disabled={saving || !canCreateDraft}>
                    <Save className="h-4 w-4" />
                    Create draft
                  </button>
                ) : !isFinalized ? (
                  <>
                    <button type="button" className={btnOutline} onClick={handlePatchDraft} disabled={saving}>
                      Save changes
                    </button>
                    <button type="button" className={btnTeal} onClick={() => setShareModalOpen(true)} disabled={saving}>
                      Finalize
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={btnOutline} onClick={handleExportMarkdown} disabled={saving}>
                      <Share2 className="h-4 w-4" />
                      Export &amp; Share
                    </button>
                    <button type="button" className={btnOutline} onClick={handleShareSnapshot} disabled={saving}>
                      Snapshot
                    </button>
                    <button type="button" className={btnOutline} onClick={handleExportDocx} disabled={saving}>
                      <Download className="h-4 w-4" />
                      Export DOCX
                    </button>
                  </>
                )}
              </div>

              <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Managed Tasks (BDD):</span> tasks with assignees sync to
                multi-user module after Finalize — surface TBD.
              </p>
            </div>
          </section>
        ) : null}

        {/* Share modal — BDD exact */}
        {shareModalOpen ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 px-3 pb-8 sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-title"
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            >
              <h3 id="share-title" className="text-center font-serif text-lg font-semibold text-slate-900">
                {BDD.shareTitle}
              </h3>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => void handleConfirmFinalize('EXTERNAL')}
                  disabled={saving}
                >
                  {BDD.shareExternal}
                </button>
                <button
                  type="button"
                  className={btnTeal}
                  onClick={() => void handleConfirmFinalize('ONLY_ME')}
                  disabled={saving}
                >
                  {BDD.shareOnlyMe}
                </button>
                <button type="button" className={btnGhost} onClick={() => setShareModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* QA triggers — exact BDD copy for edge paths (manual until STT wires auto) */}
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">QA / BDD edge paths</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={btnOutline + ' h-8 text-xs'} onClick={() => pushToast(BDD.noAudioToast)}>
              Toast: empty recording
            </button>
            <button type="button" className={btnOutline + ' h-8 text-xs'} onClick={() => setTranscriptionError(true)}>
              Screen: transcription error
            </button>
            <button type="button" className={btnOutline + ' h-8 text-xs'} onClick={() => setNoTasksView(true)}>
              Screen: no actionable tasks
            </button>
            <button
              type="button"
              className={btnOutline + ' h-8 text-xs'}
              disabled={!!draft}
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
            </button>
          </div>
        </section>
      </div>
    </P108Shell>
  );
}
