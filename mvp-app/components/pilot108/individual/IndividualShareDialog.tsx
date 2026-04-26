'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type IndividualShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  shareTitle: string;
  shareExternal: string;
  shareOnlyMe: string;
  onExternal: () => void;
  onOnlyMe: () => void;
};

export function IndividualShareDialog({
  open,
  onOpenChange,
  saving,
  shareTitle,
  shareExternal,
  shareOnlyMe,
  onExternal,
  onOnlyMe,
}: IndividualShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm" data-testid="p108-bdd-share-dialog">
        <DialogHeader>
          <DialogTitle
            className={cn(
              'text-center text-lg font-semibold text-foreground',
              '[font-family:var(--font-p108-newsreader),Newsreader,ui-serif,Georgia,serif]'
            )}
          >
            {shareTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Button type="button" variant="default" disabled={saving} onClick={onExternal}>
            {shareExternal}
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={onOnlyMe}>
            {shareOnlyMe}
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
