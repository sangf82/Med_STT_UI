import Link from 'next/link';
import { P108Shell } from '@/components/pilot108/P108Shell';

const linkCard =
  'block rounded-lg border border-[#CBD5E1] bg-white p-4 transition hover:border-[#219EBC]/50 hover:shadow-sm';

export default function Pilot108HubPage() {
  return (
    <P108Shell sessionTitle="Pilot 108 hub" showSessionBadge={false}>
      <div className="mx-auto max-w-lg space-y-6">
        <p className="text-sm text-[#64748B] [font-family:var(--font-p108-be),sans-serif]">
          Chọn luồng Pilot 108. Stream STT + upload file chunk (retry) vẫn dùng backend /ai/stt/upload/* — mở mục
          &quot;STT stream / file&quot; bên dưới.
        </p>
        <ul className="space-y-3">
          <li>
            <Link href="/pilot108/individual" className={linkCard}>
              <span
                className="text-base font-semibold text-[#020617] [font-family:var(--font-p108-newsreader),Newsreader,serif]"
              >
                Pilot 108 · Individual
              </span>
              <span className="mt-1 block text-sm text-[#64748B] [font-family:var(--font-p108-be),sans-serif]">
                Roster, draft, finalize, kho thông tin
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/pilot108/individual?mockChecklist=1"
              className={linkCard}
            >
              <span className="text-base font-semibold text-[#020617] [font-family:var(--font-p108-newsreader),serif]">
                Mock checklist (pen e3zO7 · strip 04)
              </span>
              <span className="mt-1 block font-mono text-xs text-[#64748B]">/pilot108/individual?mockChecklist=1</span>
            </Link>
          </li>
          <li>
            <Link href="/pilot108/stt-upload" className={linkCard}>
              <span className="text-base font-semibold text-[#020617] [font-family:var(--font-p108-newsreader),serif]">
                STT stream / upload file → AI
              </span>
              <span className="mt-1 block font-mono text-xs text-[#64748B]">/pilot108/stt-upload</span>
              <span className="mt-1 block text-sm text-[#64748B] [font-family:var(--font-p108-be),sans-serif]">
                Ghi âm stream (chunk + stream/end) hoặc chọn file (init + chunk retry + complete), queue job như cũ.
              </span>
            </Link>
          </li>
          <li>
            <div className={linkCard + ' cursor-default'}>
              <span className="text-base font-semibold text-[#020617] [font-family:var(--font-p108-newsreader),serif]">
                Admin · live STT stream
              </span>
              <span className="mt-1 block text-sm text-[#64748B] [font-family:var(--font-p108-be),sans-serif]">
                URL dạng{' '}
                <code className="rounded bg-[#F1F5F9] px-1 py-0.5 text-xs text-[#0F172A]">/admin/stt-stream/&lt;live_session_id&gt;</code>
                — tách khỏi luồng upload chunk gửi AI.
              </span>
            </div>
          </li>
        </ul>
      </div>
    </P108Shell>
  );
}
