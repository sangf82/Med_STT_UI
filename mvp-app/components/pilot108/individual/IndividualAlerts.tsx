'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { P108Toast } from '@/components/medmate/P108Toast';

export type IndividualAlertsProps = {
  offline: boolean;
  waitingOffline: string;
  toast: string;
  error: string;
};

export function IndividualAlerts({ offline, waitingOffline, toast, error }: IndividualAlertsProps) {
  return (
    <>
      {offline ? (
        <Alert
          data-testid="p108-bdd-offline-alert"
          className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50"
        >
          <AlertTitle className="text-xs font-semibold">Mạng</AlertTitle>
          <AlertDescription className="text-xs">{waitingOffline}</AlertDescription>
        </Alert>
      ) : null}
      {toast ? (
        <div data-testid="p108-bdd-toast">
          <P108Toast tone="success" description={toast} />
        </div>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
