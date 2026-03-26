'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { todoListMDMockEN, todoListMDMockVI } from '@/lib/mockData';
import { useReview } from '../layout';
import { RichTextEditor } from '@/components/RichTextEditor';
import { updateRecord } from '@/lib/api/sttMetrics';
import { Loader2 } from 'lucide-react';

type TodoItem = {
    priority: string;
    task: string;
    purposeLabel: 'Mục đích' | 'Purpose';
    purpose: string;
    checked: boolean;
};

function stripOuterStrong(text: string): string {
    const trimmed = text.trim();
    return trimmed.replace(/^\*\*(.*?)\*\*$/, '$1').trim();
}

/** Trong refined_text từ STT, " - Mục đích" và " - Trạng thái" (dấu " - " giữa dòng) có thể bị markdown parser hiểu nhầm thành list mới, dẫn đến cắt/loạn nội dung. Chuẩn hóa thành " • " để chỉ còn "- " ở đầu dòng là list. */
function normalizeTodoMarkdownForDisplay(raw: string): string {
    if (!raw || typeof raw !== 'string') return raw;
    const unescaped = raw
        .replace(/\\\[/g, '[')
        .replace(/\\\]/g, ']');

    const normalized = unescaped
        .replace(/ - Mục đích:/g, ' • Mục đích:')
        .replace(/ - Trạng thái:/g, ' • Trạng thái:')
        .replace(/ - Purpose:/g, ' • Purpose:')
        .replace(/ - Status:/g, ' • Status:');

    const lines = normalized.split('\n').map((line) => {
        if (!/(Trạng thái|Status)\s*:/i.test(line)) return line;

        const statusMatch = line.match(/(?:Trạng thái|Status)\s*:\s*\[\s*([xX]?)\s*\]/i);
        const statusMark = statusMatch?.[1]?.toLowerCase() === 'x' ? 'x' : ' ';

        const withoutStatus = line
            .replace(/\s*(?:•|-)\s*(?:Trạng thái|Status)\s*:\s*\[\s*[xX]?\s*\]\s*$/i, '')
            .trim();

        const headerMatch = withoutStatus.match(/^\s*[-*•]?\s*\[(?:\*\*)?([^\]\*]+?)(?:\*\*)?\]\s*(?:Công việc|Task)\s*:\s*(.*)$/i);
        if (!headerMatch) return line;

        const [, priority, rest] = headerMatch;
        return `- [${statusMark}] **${stripOuterStrong(priority)}**: ${rest.trim()}`;
    });

    return lines.join('\n');
}

function parseTodoItems(raw: string): TodoItem[] {
    const lines = raw
        .replace(/\\\[/g, '[')
        .replace(/\\\]/g, ']')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    const items: TodoItem[] = [];

    for (const line of lines) {
        const markdownMatch = line.match(/^[-*]\s*\[\s*([xX ]?)\s*\]\s*(?:\*\*([^*]+)\*\*\s*:\s*)?(.*?)\s*\(\*(Mục đích|Purpose)\s*:\s*(.*?)\*\)\s*$/i);
        if (markdownMatch) {
            const [, checked, priority, task, purposeLabel, purpose] = markdownMatch;
            items.push({
                priority: (priority || 'Routine').trim(),
                task: task.trim(),
                purposeLabel: (purposeLabel === 'Purpose' ? 'Purpose' : 'Mục đích'),
                purpose: purpose.trim(),
                checked: checked.toLowerCase() === 'x',
            });
            continue;
        }

        const legacyMatch = line.match(/^[-*•]?\s*\[(?:\*\*)?([^\]\*]+?)(?:\*\*)?\]\s*(?:Công việc|Task)\s*:\s*(.*?)\s*(?:•|-)\s*(Mục đích|Purpose)\s*:\s*(.*?)\s*(?:•|-)\s*(?:Trạng thái|Status)\s*:\s*\[\s*([xX]?)\s*\]\s*$/i);
        if (legacyMatch) {
            const [, priority, task, purposeLabel, purpose, checked] = legacyMatch;
            items.push({
                priority: stripOuterStrong(priority),
                task: stripOuterStrong(task),
                purposeLabel: (purposeLabel === 'Purpose' ? 'Purpose' : 'Mục đích'),
                purpose: stripOuterStrong(purpose),
                checked: checked.toLowerCase() === 'x',
            });
        }
    }

    return items;
}

function serializeTodoItems(items: TodoItem[]): string {
    return items
        .map((item) => `- [${item.checked ? 'x' : ' '}] **${item.priority}**: ${item.task} (*${item.purposeLabel}: ${item.purpose}*)`)
        .join('\n');
}

export default function TodoListPage() {
    const locale = useLocale();

    const { setSaveStatus, record } = useReview();

    const mockData = locale === 'vi' ? todoListMDMockVI : todoListMDMockEN;
    const rawContent = record?.content || record?.refined_text || record?.raw_text || mockData;
    const initialContent = useMemo(() => normalizeTodoMarkdownForDisplay(rawContent), [rawContent]);
    const [content, setContent] = useState(initialContent);
    const [items, setItems] = useState<TodoItem[]>(() => parseTodoItems(rawContent));
    const timeoutRef = useRef<NodeJS.Timeout>(null);
    const isTranscribing = record?.status === 'transcribing';

    useEffect(() => {
        if (record) {
            const raw = record.content || record.refined_text || record.raw_text || mockData;
            const normalized = normalizeTodoMarkdownForDisplay(raw);
            const syncTimer = setTimeout(() => {
                setContent(normalized);
                setItems(parseTodoItems(raw));
            }, 0);
            return () => clearTimeout(syncTimer);
        }
    }, [record, mockData]);

    const saveContent = (newContent: string) => {
        setSaveStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            if (record?.id) {
                try {
                    await updateRecord(record.id, { content: newContent });
                    setSaveStatus('saved');
                } catch (e) {
                    console.error("Save failed", e);
                    setSaveStatus('error');
                }
            } else {
                setSaveStatus('saved');
            }
        }, 1000);
    };

    const handleChange = (newContent: string) => {
        setContent(newContent);
        saveContent(newContent);
    };

    const handleToggle = (index: number) => {
        const nextItems = items.map((item, i) => i === index ? { ...item, checked: !item.checked } : item);
        const nextContent = serializeTodoItems(nextItems);
        setItems(nextItems);
        setContent(nextContent);
        saveContent(nextContent);
    };

    return (
        <div className="flex-1 flex flex-col fade-in">
            {isTranscribing ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-text-muted">
                    <Loader2 className="w-7 h-7 animate-spin mb-3 text-accent-blue" />
                    <p className="text-[15px] font-semibold text-text-primary">Đang chuyển giọng nói thành văn bản...</p>
                    <p className="text-[13px] mt-1">Vui lòng chờ trong giây lát.</p>
                </div>
            ) : items.length > 0 ? (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {items.map((item, index) => (
                        <label key={`${item.priority}-${index}`} className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleToggle(index)}
                                className="mt-1 h-4.5 w-4.5 rounded-sm border-[1.5px] border-border accent-accent-blue"
                            />
                            <div className="text-[16px] leading-8 text-text-primary">
                                <span className="font-bold">[{item.priority}] </span>
                                <span className={item.checked ? 'line-through opacity-70' : ''}>Công việc: <span className="font-bold">{item.task}</span></span>
                                <span className={item.checked ? 'line-through opacity-70' : ''}> • {item.purposeLabel}: <span className="font-bold">{item.purpose}</span></span>
                            </div>
                        </label>
                    ))}
                </div>
            ) : (
                <RichTextEditor
                    content={content}
                    onChange={handleChange}
                    coerceTaskListOnLoad
                />
            )}
        </div>
    );
}
