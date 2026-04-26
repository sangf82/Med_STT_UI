import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Markdown } from 'tiptap-markdown';
import { FontSize } from '@/lib/tiptap-extensions/fontSize';
import { EditorToolbar } from './EditorToolbar';
import { useEffect, useState } from 'react';

type MarkdownEditorStorage = {
    markdown?: { getMarkdown: () => string };
};

function getMarkdownFromStorage(editor: Editor): string {
    const s = editor.storage as MarkdownEditorStorage;
    return s.markdown?.getMarkdown() ?? '';
}

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    coerceTaskListOnLoad?: boolean;
    markdownMode?: 'default' | 'clinical-ehr' | 'clinical-soap';
    showToolbar?: boolean;
    onEditorReady?: (editor: Editor | null) => void;
}

function normalizeClinicalMarkdown(content: string): string {
    if (!content || typeof content !== 'string') return content;

    const lines = content.split('\n');
    const normalized: string[] = [];
    let activeSoapSection = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.length === 0) {
            normalized.push('');
            continue;
        }

        const oneLinerMatch = line.match(/^#\s*One-liner\s*:\s*(.*)$/i);
        if (oneLinerMatch) {
            const oneLinerContent = oneLinerMatch[1]?.trim();
            normalized.push(oneLinerContent ? `**One-liner**: ${oneLinerContent}` : '**One-liner**:');
            activeSoapSection = false;
            continue;
        }

        const soapHeadingMatch = line.match(/^#\s*([SOAP])\s*\(([^)]+)\)\s*:?\s*$/i);
        if (soapHeadingMatch) {
            const letter = soapHeadingMatch[1].toUpperCase();
            const title = soapHeadingMatch[2].trim();
            normalized.push(`### ${letter} (${title})`);
            activeSoapSection = true;
            continue;
        }

        const inlineSectionHeadingMatch = line.match(/^#\s*([A-Za-z][^:]+)\s*:\s*(.+)$/);
        if (inlineSectionHeadingMatch) {
            normalized.push(`### ${inlineSectionHeadingMatch[1].trim()}`);
            normalized.push(inlineSectionHeadingMatch[2].trim());
            activeSoapSection = true;
            continue;
        }

        const sectionBodyMatch = line.match(/^##\s*(.+)$/);
        if (sectionBodyMatch) {
            normalized.push(sectionBodyMatch[1].trim());
            continue;
        }

        const genericHeadingMatch = line.match(/^#\s*(.+)$/);
        if (genericHeadingMatch) {
            normalized.push(`### ${genericHeadingMatch[1].replace(/:\s*$/, '').trim()}`);
            activeSoapSection = true;
            continue;
        }

        normalized.push(rawLine);
    }

    if (!activeSoapSection && !/^\s*#\s*One-liner\s*:/im.test(content) && !/^\s*#\s*[SOAP]\s*\(/im.test(content)) {
        return content;
    }

    return normalized.join('\n');
}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toInlineHtml(text: string): string {
    const escaped = escapeHtml(text);
    return escaped
        .replace(/&lt;mark&gt;(.*?)&lt;\/mark&gt;/g, '<mark>$1</mark>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function normalizeLegacyTodoLine(line: string): string {
    const match = line.match(/^\s*[-*•]?\s*\[([^\]]+)\]\s*(?:Công việc|Task)\s*:\s*(.*?)\s*(?:•|-)\s*(Mục đích|Purpose)\s*:\s*(.*?)\s*(?:•|-)\s*(?:Trạng thái|Status)\s*:\s*\[\s*([xX]?)\s*\]\s*$/i);
    if (!match) return line;

    const [, priority, taskText, purposeLabel, purposeText, checked] = match;
    const status = checked?.toLowerCase() === 'x' ? 'x' : ' ';
    return `- [${status}] **${priority.trim()}**: ${taskText.trim()} (*${purposeLabel}: ${purposeText.trim()}*)`;
}

function coerceTaskMarkdownToHtml(content: string): string {
    const sourceLines = content.split('\n').map((line) => normalizeLegacyTodoLine(line));
    const hasTaskLine = sourceLines.some((line) => /^\s*[-*]\s*\[\s*[xX ]\s*\]\s+/.test(line));
    if (!hasTaskLine) return content;

    const html: string[] = [];
    let inTaskList = false;

    for (const line of sourceLines) {
        const taskMatch = line.match(/^\s*[-*]\s*\[\s*([xX ]?)\s*\]\s+(.*)$/);
        if (taskMatch) {
            if (!inTaskList) {
                html.push('<ul data-type="taskList">');
                inTaskList = true;
            }
            const checked = taskMatch[1]?.toLowerCase() === 'x';
            const taskText = taskMatch[2]?.trim() ?? '';
            html.push(`<li data-type="taskItem" data-checked="${checked ? 'true' : 'false'}"><p>${toInlineHtml(taskText)}</p></li>`);
            continue;
        }

        if (inTaskList) {
            html.push('</ul>');
            inTaskList = false;
        }

        if (line.trim().length > 0) {
            html.push(`<p>${toInlineHtml(line)}</p>`);
        }
    }

    if (inTaskList) {
        html.push('</ul>');
    }

    return html.join('');
}

export function RichTextEditor({
    content,
    onChange,
    className,
    minHeight = "none",
    coerceTaskListOnLoad = false,
    markdownMode = 'default',
    showToolbar = true,
    onEditorReady,
}: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    const isClinicalMode = markdownMode === 'clinical-ehr' || markdownMode === 'clinical-soap';
    const editorClassName = `focus:outline-none w-full h-full text-text-primary leading-relaxed tiptap-editor${isClinicalMode ? ' clinical-markdown' : ''}${markdownMode === 'clinical-ehr' ? ' clinical-markdown-ehr' : ''}${markdownMode === 'clinical-soap' ? ' clinical-markdown-soap' : ''}`;
    const initialContent = coerceTaskListOnLoad
        ? coerceTaskMarkdownToHtml(content)
        : isClinicalMode
            ? normalizeClinicalMarkdown(content)
            : content;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Markdown,
            TaskList.configure({
                HTMLAttributes: {
                    class: 'not-prose pl-2',
                },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'flex items-start gap-2 my-1',
                },
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Underline,
            TextStyle,
            Color,
            FontSize,
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            onChange(getMarkdownFromStorage(editor));
        },
        onFocus: () => {
            // Focus happens, but we don't necessarily show toolbar/keyboard yet
        },
        onBlur: ({ event }) => {
            const relatedTarget = (event as FocusEvent).relatedTarget as HTMLElement | null;
            const toolbar = document.getElementById('editor-toolbar');
            if (toolbar && relatedTarget && toolbar.contains(relatedTarget)) {
                return;
            }
            setTimeout(() => {
                if (!editor?.isFocused) {
                    setIsKeyboardActive(false);
                }
            }, 200);
        },
        editorProps: {
            attributes: {
                class: editorClassName,
                style: `min-height: ${minHeight};`,
            },
            handleDOMEvents: {
                mousedown: (view, event) => {
                    const target = event.target as HTMLElement;
                    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                        event.stopPropagation();
                    }
                    return false;
                },
                touchstart: (view, event) => {
                    const target = event.target as HTMLElement;
                    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                        event.stopPropagation();
                    }
                    return false;
                },
                pointerdown: (view, event) => {
                    const target = event.target as HTMLElement;
                    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                        event.stopPropagation();
                    }
                    return false;
                },
                click: (view, event) => {
                    const target = event.target as HTMLElement;
                    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                        return true; // Mark as handled for TipTap to prevent internal focus logic
                    }

                    // Intentional focus logic:
                    if (view.hasFocus()) {
                        // If already focused (pointer is there), second click opens keyboard
                        setIsKeyboardActive(true);
                    } else {
                        // First click: focus it to show pointer, but keep keyboard inactive
                        setIsKeyboardActive(false);
                    }
                    return false;
                }
            }
        },
        immediatelyRender: false,
    });

    // Dynamically update inputmode based on intentional focus state
    useEffect(() => {
        if (editor) {
            editor.setOptions({
                editorProps: {
                    attributes: {
                        class: editorClassName,
                        style: `min-height: ${minHeight};`,
                        inputmode: isKeyboardActive ? 'text' : 'none',
                    }
                }
            });
        }
    }, [isKeyboardActive, editor, minHeight, editorClassName]);

    useEffect(() => {
        globalThis.queueMicrotask(() => {
            setMounted(true);
        });
    }, []);

    useEffect(() => {
        if (editor && content !== getMarkdownFromStorage(editor) && !editor.isFocused) {
            const nextContent = coerceTaskListOnLoad
                ? coerceTaskMarkdownToHtml(content)
                : isClinicalMode
                    ? normalizeClinicalMarkdown(content)
                    : content;
            editor.commands.setContent(nextContent);
        }
    }, [content, editor, coerceTaskListOnLoad, isClinicalMode]);

    useEffect(() => {
        onEditorReady?.(editor ?? null);
        return () => onEditorReady?.(null);
    }, [editor, onEditorReady]);

    if (!mounted) {
        return (
            <div className={`flex flex-col ${className}`} style={{ minHeight }}>
                <div className="p-4 flex-1" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col flex-1 ${className ?? ''}`}>
            {/* Toolbar at top — only when keyboard is intentionally activated */}
            {showToolbar && isKeyboardActive && (
                <div
                    id="editor-toolbar"
                    className="sticky top-0 z-50 bg-bg-card border-b border-border shadow-sm"
                >
                    <EditorToolbar editor={editor} />
                </div>
            )}

            {/* Editor content — z-0 ensures it's below the toolbar's z-50 so dropdowns aren't clipped */}
            <div
                className="flex-1 cursor-text px-4 py-4 relative z-0"
                onClick={(e) => {
                    // Only focus when clicking on the wrapper itself (the empty space),
                    // not when clicking on content nodes (e.g. checkbox)
                    if (e.target === e.currentTarget) {
                        editor?.commands.focus();
                    }
                }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
