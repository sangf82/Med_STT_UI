import { useEditor, EditorContent } from '@tiptap/react';
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
import { normalizeSoapPlanMarkdownForDisplay } from '@/lib/utils';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    coerceTaskListOnLoad?: boolean;
}

function normalizeLegacyTodoLine(line: string): string {
    const match = line.match(/^\s*[-*•]?\s*\[([^\]]+)\]\s*(?:Công việc|Task)\s*:\s*(.*?)\s*(?:•|-)\s*(Mục đích|Purpose)\s*:\s*(.*?)\s*(?:•|-)\s*(?:Trạng thái|Status)\s*:\s*\[\s*([xX]?)\s*\]\s*$/i);
    if (!match) return line;

    const [, priority, taskText, purposeLabel, purposeText, checked] = match;
    const status = checked?.toLowerCase() === 'x' ? 'x' : ' ';
    return `- [${status}] **${priority.trim()}**: ${taskText.trim()} (*${purposeLabel}: ${purposeText.trim()}*)`;
}

function coerceTaskMarkdownToHtml(content: string): string {
    const normalizedContent = normalizeSoapPlanMarkdownForDisplay(content);
    const sourceLines = normalizedContent.split('\n').map((line) => normalizeLegacyTodoLine(line));
    const hasTaskLine = sourceLines.some((line) => /^\s*[-*]\s*\[\s*[xX ]\s*\]\s+/.test(line));
    if (!hasTaskLine) return normalizedContent;

    return sourceLines.join('\n');
}

export function RichTextEditor({ content, onChange, className, minHeight = "none", coerceTaskListOnLoad = false }: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

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
        content: coerceTaskListOnLoad ? coerceTaskMarkdownToHtml(content) : content,
        onUpdate: ({ editor }) => {
            const markdown = (editor.storage as any).markdown?.getMarkdown() ?? '';
            onChange(markdown);
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
                class: 'focus:outline-none w-full h-full text-text-primary leading-relaxed tiptap-editor',
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
                        class: 'focus:outline-none w-full h-full text-text-primary leading-relaxed tiptap-editor',
                        style: `min-height: ${minHeight};`,
                        inputmode: isKeyboardActive ? 'text' : 'none',
                    }
                }
            });
        }
    }, [isKeyboardActive, editor, minHeight]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (editor && content !== (editor.storage as any).markdown?.getMarkdown() && !editor.isFocused) {
            const nextContent = coerceTaskListOnLoad ? coerceTaskMarkdownToHtml(content) : content;
            editor.commands.setContent(nextContent);
        }
    }, [content, editor, coerceTaskListOnLoad]);

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
            {isKeyboardActive && (
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
