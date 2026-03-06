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

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export function RichTextEditor({ content, onChange, className, minHeight = "300px" }: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

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
        content: content,
        onUpdate: ({ editor }) => {
            const markdown = (editor.storage as any).markdown?.getMarkdown() ?? '';
            onChange(markdown);
        },
        onFocus: () => setIsFocused(true),
        onBlur: ({ event }) => {
            const relatedTarget = (event as FocusEvent).relatedTarget as HTMLElement | null;
            const toolbar = document.getElementById('editor-toolbar');
            if (toolbar && relatedTarget && toolbar.contains(relatedTarget)) {
                return;
            }
            setTimeout(() => {
                if (!editor?.isFocused) {
                    setIsFocused(false);
                }
            }, 200);
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none w-full h-full text-text-primary leading-relaxed tiptap-editor',
                style: `min-height: ${minHeight};`,
            },
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (editor && content !== (editor.storage as any).markdown?.getMarkdown() && !editor.isFocused) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!mounted) {
        return (
            <div className={`flex flex-col ${className}`} style={{ minHeight }}>
                <div className="p-4 flex-1" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col flex-1 ${className ?? ''}`}>
            {/* Toolbar at top, below header — only when focused */}
            {isFocused && (
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
                onClick={() => editor?.commands.focus()}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
