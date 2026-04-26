'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Trash2, UserRound } from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import {
  P108Chip,
  P108MobileTopBar,
  P108PhoneFrame,
  P108PrimaryButton,
  p108Be,
  p108News,
} from '@/components/pilot108/P108Design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  pilot108AddRosterMember,
  pilot108DeleteRosterMember,
  pilot108GetRoster,
  pilot108ListSystemUsers,
  type Pilot108RosterMember,
  type Pilot108SystemUser,
} from '@/lib/api/pilot108Individual';
import { cn } from '@/lib/utils';

export default function Pilot108TeamPage() {
  const [roster, setRoster] = useState<Pilot108RosterMember[]>([]);
  const [newMember, setNewMember] = useState({ name: '', role: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [systemUsers, setSystemUsers] = useState<Pilot108SystemUser[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadRoster = useCallback(async () => {
    const res = await pilot108GetRoster();
    setRoster(res.members);
  }, []);

  useEffect(() => {
    void loadRoster().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Cannot load roster'));
  }, [loadRoster]);

  useEffect(() => {
    void pilot108ListSystemUsers()
      .then((users) => setSystemUsers(users))
      .catch(() => {
        // Keep manual add usable even when user directory is unavailable.
      });
  }, []);

  const handleAddMember = async () => {
    const name = newMember.name.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      const res = await pilot108AddRosterMember({
        name,
        role: newMember.role.trim() || undefined,
      });
      setRoster(res.members);
      setNewMember({ name: '', role: '' });
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

  const handleDeleteMember = async (memberId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await pilot108DeleteRosterMember(memberId);
      setRoster(res.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot delete member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <P108Shell sessionTitle="Team Management" showSessionBadge={false} backHref="/pilot108/stt-upload">
      <P108PhoneFrame data-testid="p108-s1-team-screen" className="min-h-[760px]">
        <P108MobileTopBar title="Team Management" subtitle="Assignee roster" backHref="/pilot108/stt-upload" />
        <main className="space-y-5 px-5 py-6">
          <div className="space-y-2">
            <P108Chip label="TEAM" tone="info" />
            <h1 className={cn('text-[28px] font-semibold leading-tight text-[#020617]', p108News)}>Set assignee options</h1>
            <p className={cn('text-sm leading-6 text-[#64748B]', p108Be)}>
              MedMate never invents assignees. Draft rows can only pick members from this roster.
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm font-medium text-[#DC2626]">
              {error}
            </div>
          ) : null}

          <section className="space-y-3">
            {roster.length ? (
              roster.map((member) => (
                <div key={member.member_id} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#475569]">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#020617]">{member.name}</p>
                    <p className="text-xs text-[#64748B]">{member.role || 'Member'}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-[#EF4444]"
                    aria-label={`Delete ${member.name}`}
                    disabled={saving}
                    onClick={() => void handleDeleteMember(member.member_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-5 text-center text-sm text-[#64748B]">
                No team members found. Add one below or upload a roster in onboarding.
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#020617]">Add Member</p>
            <Input
              className="h-11 rounded-lg border-[#E2E8F0]"
              placeholder="Name"
              aria-label="Name"
              value={newMember.name}
              onChange={(event) => setNewMember((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              className="h-11 rounded-lg border-[#E2E8F0]"
              placeholder="Role"
              aria-label="Role"
              value={newMember.role}
              onChange={(event) => setNewMember((prev) => ({ ...prev, role: event.target.value }))}
            />
            <P108PrimaryButton className="w-full" disabled={saving || !newMember.name.trim()} onClick={() => void handleAddMember()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Member
            </P108PrimaryButton>
          </section>

          <section className="space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#020617]">Add from System Users</p>
            <Input
              className="h-11 rounded-lg border-[#E2E8F0]"
              placeholder="Search name or email"
              aria-label="Search system users"
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
            />
            <select
              className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm"
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
            <P108PrimaryButton className="w-full" disabled={saving || !selectedUserId} onClick={() => void handleAddSystemUser()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Selected User
            </P108PrimaryButton>
          </section>

          <Link href="/pilot108/individual?mockChecklist=1" className="block text-center text-sm font-medium text-[#FB8A0A] underline-offset-2 hover:underline">
            Back to draft list
          </Link>
        </main>
      </P108PhoneFrame>
    </P108Shell>
  );
}

