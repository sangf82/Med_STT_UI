/** pen rmCmK · Transcription Table/Base (aMqUJ) */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type P108TranscriptionTableProps = {
  headers: string[];
  rows: ReactNode[][];
  className?: string;
  emptyLabel?: string;
};

export function P108TranscriptionTable({ headers, rows, className, emptyLabel = 'Không có dữ liệu' }: P108TranscriptionTableProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-[#94A3B8] bg-[#F8FAFC]',
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-[#94A3B8] hover:bg-transparent">
            {headers.map((h) => (
              <TableHead key={h} className="text-xs font-semibold text-muted-foreground">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Math.max(1, headers.length)} className="h-24 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((cells, ri) => (
              <TableRow key={ri} className="border-[#E2E8F0] bg-white hover:bg-muted/30">
                {cells.map((cell, ci) => (
                  <TableCell key={ci} className="align-top text-sm">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
