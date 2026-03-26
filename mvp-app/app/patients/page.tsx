'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FolderPlus, Loader2, UserRound } from 'lucide-react';
import { createMyPatientFolder, getMyPatientFolders } from '@/lib/api/sttMetrics';

type FolderItem = {
  id?: string | null;
  name: string;
  record_count: number;
  is_virtual?: boolean;
};

const UNKNOWN_FOLDER_NAMES = new Set([
  'unknown patient',
  'unknown',
  'unassigned',
]);

const isUnknownFolder = (folder: FolderItem) => {
  if (!folder.is_virtual) return false;
  return UNKNOWN_FOLDER_NAMES.has(folder.name.trim().toLowerCase());
};

export default function PatientsPage() {
  const router = useRouter();
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPatientFolders();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const visibleItems = useMemo(
    () => items.filter((f) => (!f.is_virtual || f.record_count > 0) && !isUnknownFolder(f)),
    [items]
  );

  const handleAddPatient = async () => {
    const name = prompt('Nhập tên bệnh nhân mới:');
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createMyPatientFolder(trimmed);
      await loadFolders();
      router.push(`/patients/${encodeURIComponent(trimmed)}`);
    } catch {
      alert('Không thể tạo bệnh nhân lúc này. Vui lòng thử lại sau.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <Header
        title="Danh sách bệnh nhân"
        subtitle={`${visibleItems.length} bệnh nhân`}
        onBack={() => router.back()}
        rightNode={
          <button
            type="button"
            onClick={handleAddPatient}
            disabled={creating}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-bg-surface disabled:opacity-50"
            title="Thêm bệnh nhân"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderPlus className="w-5 h-5" />}
          </button>
        }
      />

      <div className="px-4 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Đang tải danh sách bệnh nhân...</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-divider bg-bg-surface p-8 text-center">
            <UserRound className="w-10 h-10 text-divider mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-text-primary">
              Thêm bệnh nhân mới để bắt đầu.
            </p>
            <button
              type="button"
              onClick={handleAddPatient}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white"
            >
              <FolderPlus className="w-4 h-4" />
              Thêm bệnh nhân mới
            </button>
          </div>
        ) : (
          <ul className="space-y-2 pt-2">
            {visibleItems.map((folder) => (
              <li key={folder.id || folder.name}>
                <Link
                  href={`/patients/${encodeURIComponent(folder.name)}`}
                  className="block rounded-xl border border-border bg-bg-surface px-4 py-3 hover:bg-bg-hover"
                >
                  <p className="text-[15px] font-semibold text-text-primary">{folder.name}</p>
                  <p className="text-[12px] text-text-muted mt-0.5">{folder.record_count} bản ghi</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

