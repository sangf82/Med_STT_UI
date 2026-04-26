'use client';

import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    ListTodo,
    ChevronDown,
    Type,
    Highlighter,
    Heading1,
    Heading2,
    Heading3,
    Pilcrow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EditorToolbarProps {
    editor: Editor | null;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 60];

const TEXT_COLORS = [
    { label: 'Default', value: '' },
    { label: 'Black', value: '#000000' },
    { label: 'Red', value: '#E63946' },
    { label: 'Orange', value: '#FB8A0A' },
    { label: 'Yellow', value: '#EAB308' },
    { label: 'Green', value: '#16A34A' },
    { label: 'Blue', value: '#219EBC' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Pink', value: '#EC4899' },
];

const BG_COLORS = [
    { label: 'None', value: '' },
    { label: 'Red', value: '#E63946' },
    { label: 'Orange', value: '#FB8A0A' },
    { label: 'Yellow', value: '#EAB308' },
    { label: 'Green', value: '#16A34A' },
    { label: 'Blue', value: '#219EBC' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Gray', value: '#9CA3AF' },
];

type DropdownType = 'fontSize' | 'textColor' | 'bgColor' | 'heading' | null;

/* Portal-based dropdown that renders at document.body */
function PortalDropdown({ anchorRef, open, align = 'left', children }: {
    anchorRef: React.RefObject<HTMLElement | null>;
    open: boolean;
    align?: 'left' | 'center' | 'right';
    children: React.ReactNode;
}) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ top: -9999, left: -9999 });

    useEffect(() => {
        if (!open || !anchorRef.current) return;

        // Use rAF so the portal is mounted and we can measure it
        const frame = requestAnimationFrame(() => {
            const btn = anchorRef.current?.getBoundingClientRect();
            const dd = dropdownRef.current?.getBoundingClientRect();
            if (!btn || !dd) return;

            let top = btn.bottom + 4;
            let left: number;

            if (align === 'right') {
                left = btn.right - dd.width;
            } else if (align === 'center') {
                left = btn.left + btn.width / 2 - dd.width / 2;
            } else {
                left = btn.left;
            }

            // Clamp to viewport
            const pad = 8;
            if (left + dd.width > window.innerWidth - pad) left = window.innerWidth - dd.width - pad;
            if (left < pad) left = pad;
            if (top + dd.height > window.innerHeight - pad) top = btn.top - dd.height - 4;

            setStyle({ top, left });
        });

        return () => cancelAnimationFrame(frame);
    }, [open, anchorRef, align]);

    if (!open) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed bg-bg-card border border-border rounded-xl shadow-xl"
            style={{ ...style, zIndex: 9999 }}
        >
            {children}
        </div>,
        document.body
    );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
    const headingRef = useRef<HTMLButtonElement>(null);
    const fontSizeRef = useRef<HTMLButtonElement>(null);
    const textColorRef = useRef<HTMLButtonElement>(null);
    const bgColorRef = useRef<HTMLButtonElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!openDropdown) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Don't close if clicking inside a portal dropdown
            if (target.closest('[data-toolbar-dropdown]')) return;
            // Don't close if clicking a toolbar button
            if (target.closest('[data-toolbar-btn]')) return;
            setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [openDropdown]);

    if (!editor) return null;

    const toggle = (type: DropdownType) => setOpenDropdown(prev => prev === type ? null : type);

    const getCurrentFontSize = (): number => {
        const attrs = editor.getAttributes('textStyle');
        return attrs.fontSize ? parseInt(attrs.fontSize) : 16;
    };

    const setFontSize = (size: number) => {
        if (size === 16) {
            editor.chain().focus().unsetFontSize().run();
        } else {
            editor.chain().focus().setFontSize(`${size}px`).run();
        }
        setOpenDropdown(null);
    };

    const setTextColor = (color: string) => {
        if (color) {
            editor.chain().focus().setColor(color).run();
        } else {
            editor.chain().focus().unsetColor().run();
        }
        setOpenDropdown(null);
    };

    const setBgColor = (color: string) => {
        if (color) {
            editor.chain().focus().toggleHighlight({ color }).run();
        } else {
            editor.chain().focus().unsetHighlight().run();
        }
        setOpenDropdown(null);
    };

    const headingLabel = editor.isActive('heading', { level: 1 }) ? 'H1'
        : editor.isActive('heading', { level: 2 }) ? 'H2'
            : editor.isActive('heading', { level: 3 }) ? 'H3' : '¶';

    const currentColor = editor.getAttributes('textStyle')?.color || '';
    const currentBg = editor.getAttributes('highlight')?.color || '';

    return (
        <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-hide">
            {/* Heading */}
            <button
                ref={headingRef}
                data-toolbar-btn
                onClick={() => toggle('heading')}
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-md hover:bg-bg-input transition-colors text-text-primary text-sm font-semibold min-w-[36px] justify-center"
            >
                <span>{headingLabel}</span>
                <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
            <PortalDropdown anchorRef={headingRef} open={openDropdown === 'heading'}>
                <div data-toolbar-dropdown className="py-1 min-w-[120px]">
                    {[
                        { label: 'Normal', icon: <Pilcrow className="w-4 h-4" />, active: !editor.isActive('heading'), action: () => editor.chain().focus().setParagraph().run() },
                        { label: 'Heading 1', icon: <Heading1 className="w-4 h-4" />, active: editor.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
                        { label: 'Heading 2', icon: <Heading2 className="w-4 h-4" />, active: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
                        { label: 'Heading 3', icon: <Heading3 className="w-4 h-4" />, active: editor.isActive('heading', { level: 3 }), action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
                    ].map(item => (
                        <button
                            key={item.label}
                            onClick={() => { item.action(); setOpenDropdown(null); }}
                            className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-input transition-colors", item.active ? "text-accent-blue font-semibold" : "text-text-primary")}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>
            </PortalDropdown>

            <div className="w-[1px] h-5 bg-border mx-0.5" />

            {/* Font Size */}
            <button
                ref={fontSizeRef}
                data-toolbar-btn
                onClick={() => toggle('fontSize')}
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-md hover:bg-bg-input transition-colors text-text-primary text-sm font-medium min-w-[44px] justify-center"
            >
                <span>{getCurrentFontSize()}</span>
                <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
            <PortalDropdown anchorRef={fontSizeRef} open={openDropdown === 'fontSize'}>
                <div data-toolbar-dropdown className="py-1 w-[52px] max-h-[180px] overflow-y-auto">
                    {FONT_SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={cn("w-full px-3 py-1 text-center text-sm hover:bg-bg-input transition-colors", getCurrentFontSize() === size ? "text-accent-blue font-semibold" : "text-text-primary")}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </PortalDropdown>

            <div className="w-[1px] h-5 bg-border mx-0.5" />

            {/* Bold / Italic / Underline / Strikethrough */}
            <TBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="w-4 h-4" /></TBtn>
            <TBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="w-4 h-4" /></TBtn>
            <TBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="w-4 h-4" /></TBtn>
            <TBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="w-4 h-4" /></TBtn>

            <div className="w-[1px] h-5 bg-border mx-0.5" />

            {/* Text Color */}
            <button
                ref={textColorRef}
                data-toolbar-btn
                onClick={() => toggle('textColor')}
                className="p-1.5 rounded-md hover:bg-bg-input transition-colors text-text-secondary"
            >
                <div className="flex flex-col items-center gap-0.5">
                    <Type className="w-4 h-4" />
                    <div className="w-4 h-[3px] rounded-full" style={{ backgroundColor: currentColor || 'var(--text-primary)' }} />
                </div>
            </button>
            <PortalDropdown anchorRef={textColorRef} open={openDropdown === 'textColor'} align="center">
                <div data-toolbar-dropdown className="p-3">
                    <div className="grid grid-cols-5 gap-2">
                        {TEXT_COLORS.map(c => (
                            <button
                                key={c.value || 'default'}
                                onClick={() => setTextColor(c.value)}
                                className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", currentColor === c.value ? "border-accent-blue scale-110" : "border-transparent")}
                                style={{ backgroundColor: c.value || 'var(--text-primary)' }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>
            </PortalDropdown>

            {/* Background Color */}
            <button
                ref={bgColorRef}
                data-toolbar-btn
                onClick={() => toggle('bgColor')}
                className="p-1.5 rounded-md hover:bg-bg-input transition-colors text-text-secondary"
            >
                <div className="flex flex-col items-center gap-0.5">
                    <Highlighter className="w-4 h-4" />
                    <div className="w-4 h-[3px] rounded-full" style={{ backgroundColor: currentBg || 'var(--text-muted)' }} />
                </div>
            </button>
            <PortalDropdown anchorRef={bgColorRef} open={openDropdown === 'bgColor'} align="right">
                <div data-toolbar-dropdown className="p-3">
                    <div className="grid grid-cols-5 gap-2">
                        {BG_COLORS.map(c => (
                            <button
                                key={c.value || 'none'}
                                onClick={() => setBgColor(c.value)}
                                className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center", currentBg === c.value ? "border-accent-blue scale-110" : "border-transparent")}
                                style={{ backgroundColor: c.value || 'var(--bg-input)' }}
                                title={c.label}
                            >
                                {!c.value && <span className="text-[11px] font-medium text-text-muted leading-none">✕</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </PortalDropdown>

            <div className="w-[1px] h-5 bg-border mx-0.5" />

            {/* Lists */}
            <TBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="w-4 h-4" /></TBtn>
            <TBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List"><ListOrdered className="w-4 h-4" /></TBtn>
            <TBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checkbox List"><ListTodo className="w-4 h-4" /></TBtn>
        </div>
    );
}

function TBtn({ active, onClick, title, children }: {
    active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
    return (
        <button
            data-toolbar-btn
            onClick={onClick}
            className={cn("p-1.5 rounded-md transition-colors", active ? "bg-accent-blue/15 text-accent-blue" : "text-text-secondary hover:bg-bg-input hover:text-text-primary")}
            title={title}
        >{children}</button>
    );
}
