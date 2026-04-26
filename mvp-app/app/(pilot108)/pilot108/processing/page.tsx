import Link from 'next/link';
import { AlertCircle, CheckCircle2, CloudOff, ListPlus, Mic } from 'lucide-react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import {
  P108GhostButton,
  P108MobileTopBar,
  P108OfflineBanner,
  P108PhoneFrame,
  P108PrimaryButton,
  P108ProcessingSteps,
  p108Be,
  p108News,
} from '@/components/pilot108/P108Design';
import { PILOT108_INDIVIDUAL_BDD as BDD } from '@/lib/bdd/pilot108IndividualBdd';
import { cn } from '@/lib/utils';

type State = 'upload' | 'transcribing' | 'identifying' | 'formatting' | 'success' | 'error' | 'offline' | 'notasks' | 'silence';

function stateFrom(value: string | string[] | undefined): State {
  const state = Array.isArray(value) ? value[0] : value;
  if (
    state === 'transcribing' ||
    state === 'identifying' ||
    state === 'formatting' ||
    state === 'success' ||
    state === 'error' ||
    state === 'offline' ||
    state === 'notasks' ||
    state === 'silence'
  ) {
    return state;
  }
  return 'upload';
}

/** Indices match `PILOT108_INDIVIDUAL_BDD.processingSteps` (4 steps; success = all done). */
const stepIndex: Record<State, number> = {
  upload: 0,
  transcribing: 1,
  identifying: 1,
  formatting: 2,
  success: 4,
  error: 1,
  offline: 0,
  notasks: 4,
  silence: 0,
};

export default async function Pilot108ProcessingPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string | string[]; draftId?: string | string[] }>;
}) {
  const params = await searchParams;
  const state = stateFrom(params?.state);
  const draftIdParam = Array.isArray(params?.draftId) ? params?.draftId[0] : params?.draftId;
  const draftHref = draftIdParam ? `/pilot108/individual?draftId=${encodeURIComponent(draftIdParam)}` : '/pilot108/individual?mockChecklist=1';
  const activeIndex = stepIndex[state];
  const isEdge = state === 'error' || state === 'offline' || state === 'notasks' || state === 'silence';
  return (
    <P108Shell sessionTitle="AI Processing" showSessionBadge={false} backHref="/pilot108/stt-upload">
      {state === 'offline' ? <P108OfflineBanner>{BDD.waitingOffline}</P108OfflineBanner> : null}
      <P108PhoneFrame data-testid={`p108-h3-${state}-screen`} className="min-h-[760px]">
        <P108MobileTopBar title="AI Processing" subtitle="Pilot 108" backHref="/pilot108/stt-upload" />
        <main className="flex min-h-[646px] flex-col items-center justify-center px-8 py-10 text-center">
          {!isEdge ? (
            <>
              {state === 'success' ? (
                <CheckCircle2 className="h-12 w-12 text-[#10B981]" />
              ) : (
                <Mic className="h-12 w-12 text-[#FB8A0A]" />
              )}
              <h1 className={cn('mt-8 text-[24px] font-semibold leading-tight text-[#0F172A]', p108News)}>
                {state === 'success' ? 'Hoàn tất xử lý' : BDD.processingSteps[Math.min(activeIndex, 3)]}
              </h1>
              <div className="mt-10 w-full text-left">
                <P108ProcessingSteps steps={BDD.processingSteps} activeIndex={activeIndex} />
              </div>
              {state === 'success' ? (
                <Link href={draftHref} className="mt-10 block w-full">
                  <P108PrimaryButton className="w-full">Review Draft List</P108PrimaryButton>
                </Link>
              ) : null}
            </>
          ) : null}

          {state === 'error' ? (
            <>
              <AlertCircle className="h-12 w-12 text-[#EF4444]" />
              <h1 className={cn('mt-6 text-[24px] font-semibold text-[#0F172A]', p108News)}>Processing Failed</h1>
              <p className={cn('mt-3 text-sm leading-6 text-[#64748B]', p108Be)}>{BDD.transcriptionError}</p>
              <Link href="/pilot108/stt-upload" className="mt-8 block w-full">
                <P108PrimaryButton className="w-full">Retry Processing</P108PrimaryButton>
              </Link>
            </>
          ) : null}

          {state === 'offline' ? (
            <>
              <CloudOff className="h-12 w-12 text-[#FB8A0A]" />
              <h1 className={cn('mt-6 text-[24px] font-semibold text-[#0F172A]', p108News)}>Waiting for connection...</h1>
              <p className={cn('mt-3 text-sm leading-6 text-[#64748B]', p108Be)}>
                Your recording is saved safely on your device. Processing will begin automatically once you&apos;re back online.
              </p>
            </>
          ) : null}

          {state === 'notasks' ? (
            <>
              <ListPlus className="h-12 w-12 text-[#219EBC]" />
              <h1 className={cn('mt-6 text-[24px] font-semibold text-[#0F172A]', p108News)}>No Tasks Found</h1>
              <p className={cn('mt-3 rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#475569]', p108Be)}>
                The weather is nice today
              </p>
              <p className={cn('mt-3 text-sm leading-6 text-[#64748B]', p108Be)}>{BDD.noTasksPrompt}</p>
              <Link href="/pilot108/individual" className="mt-8 block w-full">
                <P108PrimaryButton className="w-full">Add Manually</P108PrimaryButton>
              </Link>
            </>
          ) : null}

          {state === 'silence' ? (
            <>
              <div className="rounded-lg bg-[#0F172A] px-8 py-4 text-sm font-medium text-white shadow-xl">{BDD.noAudioToast}</div>
              <Link href="/pilot108/stt-upload" className="mt-8 block w-full">
                <P108GhostButton className="w-full">Back to Quick Capture</P108GhostButton>
              </Link>
            </>
          ) : null}
        </main>
      </P108PhoneFrame>
    </P108Shell>
  );
}

