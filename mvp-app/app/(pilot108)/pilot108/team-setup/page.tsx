'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Plus, Users } from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import {
  P108Chip,
  P108GhostButton,
  P108MobileTopBar,
  P108PhoneFrame,
  P108PrimaryButton,
  p108Be,
  p108News,
} from '@/components/pilot108/P108Design';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  pilot108AddRosterMember,
  pilot108GetRoster,
  pilot108ListSystemUsers,
  pilot108UpsertRosterBulk,
  type Pilot108RosterMember,
  type Pilot108SystemUser,
} from '@/lib/api/pilot108Individual';
import { cn } from '@/lib/utils';

type TeamSetupStep = 'g1' | 'g2' | 'g3a' | 'g3b' | 'g4';

const roleOptions = ['Doctor', 'Nurse', 'Resident', 'Other'];

function stepFrom(value: string | null): TeamSetupStep {
  return value === 'g2' || value === 'g3a' || value === 'g3b' || value === 'g4' ? value : 'g1';
}

function parseNames(raw: string) {
  return raw
    .split(',')
    .map((name) => name.replace(/[^\p{L}\p{N}\s.'-]/gu, '').trim())
    .filter(Boolean);
}

function StepBadge({ step }: { step: string }) {
  return <P108Chip label={step} tone="info" />;
}

export default function Pilot108TeamSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = stepFrom(searchParams.get('step'));
  const [roster, setRoster] = useState<Pilot108RosterMember[]>([]);
  const [bulkText, setBulkText] = useState('John Doe, Mary Jane, Dr. Smith');
  const [manualName, setManualName] = useState('Dr. House');
  const [manualRole, setManualRole] = useState('Resident');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [systemUsers, setSystemUsers] = useState<Pilot108SystemUser[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const parsedNames = useMemo(() => parseNames(bulkText), [bulkText]);
  const duplicateNames = useMemo(() => {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const name of parsedNames) {
      const key = name.toLocaleLowerCase('vi-VN');
      if (seen.has(key)) dup.add(key);
      seen.add(key);
    }
    return dup;
  }, [parsedNames]);

  const loadRoster = useCallback(async () => {
    const res = await pilot108GetRoster();
    setRoster(res.members);
  }, []);

  useEffect(() => {
    void loadRoster().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Cannot load roster');
    });
  }, [loadRoster]);

  useEffect(() => {
    void pilot108ListSystemUsers()
      .then((users) => setSystemUsers(users))
      .catch(() => {
        // Keep onboarding flow available when user directory endpoint is unavailable.
      });
  }, []);

  const handleBulkPreview = async () => {
    if (!parsedNames.length || duplicateNames.size) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108UpsertRosterBulk(parsedNames.join(', '));
      setRoster(res.members);
      router.push('/pilot108/team-setup?step=g4');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot save roster');
    } finally {
      setSaving(false);
    }
  };

  const handleManualAdd = async () => {
    const name = manualName.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108AddRosterMember({ name, role: manualRole });
      setRoster(res.members);
      setManualName('');
      setManualRole('Doctor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot add member');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = systemUsers.filter((user) => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return true;
    return `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(q);
  });

  const handleAddSystemUser = async () => {
    if (!selectedUserId) return;
    const selected = systemUsers.find((user) => user.id === selectedUserId);
    if (!selected) return;
    const name = (selected.name || selected.email || '').trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108AddRosterMember({
        name,
        role: 'Member',
        email_or_id: selected.email || selected.id,
      });
      setRoster(res.members);
      setSelectedUserId('');
      setUserQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <P108Shell sessionTitle="Set Up Your Team" showSessionBadge={false} backHref="/pilot108/stt-upload">
      <P108PhoneFrame data-testid={`p108-${step}-screen`} className="min-h-[760px]">
        <P108MobileTopBar title="Team setup" subtitle="Pilot 108 onboarding" backHref="/pilot108/stt-upload" />

        {step === 'g1' ? (
          <main className="flex min-h-[646px] flex-col justify-between px-6 pb-10 pt-12">
            <section className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FB8A0A] text-white shadow-xl">
                <Users className="h-10 w-10" />
              </div>
              <h1 className={cn('mt-8 text-[40px] font-bold leading-[1.15] text-[#020617]', p108News)}>
                Welcome to Pilot 108
              </h1>
              <p className={cn('mt-4 text-base leading-7 text-[#475569]', p108Be)}>
                Add your team once so MedMate can show assignee options for every AI to-do item.
              </p>
            </section>
            <Link href="/pilot108/team-setup?step=g2" className="block">
              <P108PrimaryButton className="w-full">Get Started</P108PrimaryButton>
            </Link>
          </main>
        ) : null}

        {step === 'g2' ? (
          <main className="space-y-5 px-5 py-6">
            <div className="space-y-2">
              <StepBadge step="Step 1/3" />
              <h1 className={cn('text-[28px] font-semibold leading-tight text-[#020617]', p108News)}>Set Up Your Team</h1>
              <p className="text-sm leading-6 text-[#64748B]">Choose how you want to add team members.</p>
            </div>
            <Link href="/pilot108/team-setup?step=g3a" className="block">
              <Card className="border-[#FB8A0A]/50 bg-white shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <ClipboardList className="h-7 w-7 text-[#FB8A0A]" />
                  <div>
                    <p className="font-semibold text-[#020617]">Bulk Input</p>
                    <p className="text-sm text-[#64748B]">Paste comma-separated names.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/pilot108/team-setup?step=g3b" className="block">
              <Card className="border-[#E2E8F0] bg-white shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <Plus className="h-7 w-7 text-[#219EBC]" />
                  <div>
                    <p className="font-semibold text-[#020617]">Add One by One</p>
                    <p className="text-sm text-[#64748B]">Manual entry with roles.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </main>
        ) : null}

        {step === 'g3a' ? (
          <main className="space-y-5 px-5 py-6">
            <div className="space-y-2">
              <StepBadge step="Step 2/3" />
              <h1 className={cn('text-[28px] font-semibold text-[#020617]', p108News)}>Bulk Input</h1>
              <p className="text-sm leading-6 text-[#64748B]">Paste names separated by commas. Duplicates are highlighted before confirm.</p>
            </div>
            <Textarea
              className="min-h-[156px] rounded-lg border-[#E2E8F0] bg-white text-sm"
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder="John Doe, Mary Jane, Dr. Smith..."
            />
            <div className="space-y-2">
              {parsedNames.map((name) => {
                const duplicate = duplicateNames.has(name.toLocaleLowerCase('vi-VN'));
                return (
                  <div
                    key={name}
                    className={cn('flex items-center gap-3 rounded-lg border bg-white p-3', duplicate ? 'border-[#EF4444]' : 'border-[#E2E8F0]')}
                  >
                    {duplicate ? <AlertCircle className="h-5 w-5 text-[#EF4444]" /> : <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />}
                    <span className="text-sm font-medium">{name}</span>
                    {duplicate ? <span className="ml-auto text-xs font-medium text-[#EF4444]">Duplicate</span> : null}
                  </div>
                );
              })}
            </div>
            <P108PrimaryButton className="w-full" onClick={() => void handleBulkPreview()} disabled={saving || !parsedNames.length || duplicateNames.size > 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Preview Roster
            </P108PrimaryButton>
          </main>
        ) : null}

        {step === 'g3b' ? (
          <main className="space-y-5 px-5 py-6">
            <div className="space-y-2">
              <StepBadge step="Step 2/3" />
              <h1 className={cn('text-[28px] font-semibold text-[#020617]', p108News)}>Add Member</h1>
              <p className="text-sm leading-6 text-[#64748B]">Add members one at a time. The form clears after each valid entry.</p>
            </div>
            <Input className="h-12 rounded-lg border-[#E2E8F0] bg-white" value={manualName} onChange={(event) => setManualName(event.target.value)} aria-label="Name" />
            <select className="h-12 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm" aria-label="Role" value={manualRole} onChange={(event) => setManualRole(event.target.value)}>
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <P108PrimaryButton className="w-full" onClick={() => void handleManualAdd()} disabled={saving || !manualName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add to Roster
            </P108PrimaryButton>
            <div className="space-y-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Or pick from system users</p>
              <Input
                className="h-10 rounded-lg border-[#E2E8F0] bg-white"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                aria-label="Search system users"
                placeholder="Search by name or email"
              />
              <select
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm"
                aria-label="System user"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                <option value="">Select a system user</option>
                {filteredUsers.slice(0, 100).map((user) => (
                  <option key={user.id} value={user.id}>
                    {(user.name || 'Unnamed')} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
              <P108GhostButton className="w-full" onClick={() => void handleAddSystemUser()} disabled={saving || !selectedUserId}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Add Selected User
              </P108GhostButton>
            </div>
            <div className="space-y-2">
              {roster.map((member) => (
                <div key={member.member_id} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-xs text-[#64748B]">{member.role}</span>
                </div>
              ))}
            </div>
            <Link href="/pilot108/team-setup?step=g4" className="block">
              <P108GhostButton className="w-full">Preview Roster</P108GhostButton>
            </Link>
          </main>
        ) : null}

        {step === 'g4' ? (
          <main className="space-y-5 px-5 py-6">
            <div className="space-y-2">
              <StepBadge step="Step 3/3" />
              <h1 className={cn('text-[28px] font-semibold text-[#020617]', p108News)}>Roster Preview</h1>
              <p className="text-sm leading-6 text-[#64748B]">Confirm this roster. Assignee dropdowns will only show these names.</p>
            </div>
            <div className="space-y-2">
              {roster.length ? (
                roster.map((member) => (
                  <div key={member.member_id} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-4">
                    <div>
                      <span className="text-sm font-semibold text-[#020617]">{member.name}</span>
                      {member.role ? <p className="text-xs text-[#64748B]">{member.role}</p> : null}
                    </div>
                    <P108Chip label="Member" tone="info" />
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-white p-4 text-center text-sm text-[#64748B]">
                  No team members yet.
                </div>
              )}
            </div>
            <Link href="/pilot108/stt-upload" className="block">
              <P108PrimaryButton className="w-full" disabled={!roster.length}>Confirm &amp; Finish</P108PrimaryButton>
            </Link>
            <Link href="/pilot108/team-setup?step=g2" className="block">
              <P108GhostButton className="w-full">Edit Roster</P108GhostButton>
            </Link>
          </main>
        ) : null}

        {error ? (
          <div className="mx-5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm font-medium text-[#DC2626]">
            {error}
          </div>
        ) : null}
      </P108PhoneFrame>
    </P108Shell>
  );
}

