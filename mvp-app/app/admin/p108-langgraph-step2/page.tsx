'use client';

/**
 * Admin: build JSON body for P108 LangGraph step 2 (curl 2 contract).
 * @see medmate-bdd/pilot_108/P108-AI-LANGGRAPH-CURL.md — BDD-aligned fields: thread_id, actual_patients[].patient_code | patient_name | summary | latest
 */

import { useCallback, useMemo, useState } from 'react';
import { P108Shell } from '@/components/pilot108/P108Shell';
import { getP108LiveSessionId, setP108LiveSessionId } from '@/lib/p108LiveSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { P108TerminalLog } from '@/components/medmate/P108TerminalLog';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { PILOT108_INDIVIDUAL_BDD as BDD } from '@/lib/bdd/pilot108IndividualBdd';

type ActualPatientRow = {
  patient_code: string;
  patient_name: string;
  summary: string;
  latest: string;
};

const emptyRow = (): ActualPatientRow => ({
  patient_code: '',
  patient_name: '',
  summary: '',
  latest: '',
});

export default function AdminP108LangGraphStep2Page() {
  const [threadId, setThreadId] = useState('507f1f77bcf86cd799439011');
  const [rows, setRows] = useState<ActualPatientRow[]>([
    { patient_code: 'P001', patient_name: '', summary: '', latest: '' },
    { patient_code: 'P002', patient_name: '', summary: '', latest: '' },
  ]);
  const [copied, setCopied] = useState(false);
  const [liveSessionInput, setLiveSessionInput] = useState(() => getP108LiveSessionId());

  const payload = useMemo(() => {
    const actual_patients = rows
      .map((r) => ({
        patient_code: r.patient_code.trim(),
        patient_name: r.patient_name.trim(),
        summary: r.summary.trim(),
        latest: r.latest.trim(),
      }))
      .filter((r) => r.patient_code || r.patient_name || r.summary || r.latest);
    return { thread_id: threadId.trim(), actual_patients };
  }, [rows, threadId]);

  const jsonPretty = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonPretty);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [jsonPretty]);

  const updateRow = (i: number, patch: Partial<ActualPatientRow>) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  return (
    <P108Shell sessionTitle="Admin · P108 LangGraph step 2" showSessionBadge={false}>
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-8 pt-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2 payload (curl 2)</CardTitle>
            <CardDescription>
              Khớp BDD contract: mỗi BN có <code className="text-xs">patient_code</code> (từ response bước 1 hoặc mới),{' '}
              <code className="text-xs">patient_name</code>, <code className="text-xs">summary</code>,{' '}
              <code className="text-xs">latest</code>. <code className="text-xs">thread_id</code> giống bước 1 — không
              do AI sinh.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="p108-step2-live-session">
                live_session_id (nếu đang có phiên nghe live — Record tự bật live audio cùng lúc)
              </label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="p108-step2-live-session"
                  data-testid="p108-admin-step2-live-session-id"
                  value={liveSessionInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLiveSessionInput(v);
                    setP108LiveSessionId(v);
                  }}
                  className="min-w-[200px] flex-1 font-mono text-sm"
                  placeholder="live_20260101120000abc"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 text-xs"
                  onClick={() => {
                    setLiveSessionInput('');
                    setP108LiveSessionId(null);
                  }}
                >
                  Xóa phiên live
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="p108-step2-thread">
                thread_id
              </label>
              <Input
                id="p108-step2-thread"
                data-testid="p108-admin-step2-thread-id"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                className="font-mono text-sm"
                placeholder="507f1f77bcf86cd799439011"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">actual_patients</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  data-testid="p108-admin-step2-add-row"
                  onClick={() => setRows((r) => [...r, emptyRow()])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm BN (code mới nếu không có ở bước 1)
                </Button>
              </div>

              {rows.map((row, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
                  data-testid={`p108-admin-step2-row-${i}`}
                >
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="grid min-w-[120px] flex-1 gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">patient_code</span>
                      <Input
                        value={row.patient_code}
                        onChange={(e) => updateRow(i, { patient_code: e.target.value })}
                        className="font-mono text-xs"
                        placeholder="P001"
                      />
                    </div>
                    <div className="grid min-w-[140px] flex-[2] gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">patient_name</span>
                      <Input
                        value={row.patient_name}
                        onChange={(e) => updateRow(i, { patient_name: e.target.value })}
                        className="text-xs"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground"
                      aria-label="Xóa dòng"
                      onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">summary</span>
                    <Textarea
                      value={row.summary}
                      onChange={(e) => updateRow(i, { summary: e.target.value })}
                      rows={2}
                      className="text-xs"
                      placeholder="Tóm tắt bệnh nhân"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">latest</span>
                    <Textarea
                      value={row.latest}
                      onChange={(e) => updateRow(i, { latest: e.target.value })}
                      rows={2}
                      className="text-xs"
                      placeholder="Thông tin mới nhất"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Button type="button" size="sm" className="gap-1" onClick={() => void copyJson()} data-testid="p108-admin-step2-copy-json">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Đã copy' : 'Copy JSON body'}
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Bước xử lý BDD liên quan: {BDD.processingSteps[2]} → {BDD.processingSteps[3]}
              </span>
            </div>

            <div data-testid="p108-admin-step2-json">
              <P108TerminalLog value={jsonPretty} maxHeight={280} />
            </div>
          </CardContent>
        </Card>
      </div>
    </P108Shell>
  );
}
