import { useEffect, useRef, useState } from 'react';
import type { LogLine } from '../lib/types';

interface TerminalLogProps {
    lines: LogLine[];
    title?: string;
    maxHeight?: string;
    collapsed?: boolean;
    onToggle?: (collapsed: boolean) => void;
}

/** Strip basic ANSI escape codes for display */
function stripAnsi(text: string): string {
    return text.replace(/\x1B\[[0-9;]*m/g, '').replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
}

/**
 * Streaming log viewer with auto-scroll.
 * Dark background, monospace font, collapsible.
 */
export function TerminalLog({
    lines,
    title = 'Build Output',
    maxHeight = '320px',
    collapsed = false,
    onToggle,
}: TerminalLogProps): JSX.Element {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll to bottom when new lines arrive (if already at bottom)
    useEffect((): void => {
        if (isScrolledToBottom && bottomRef.current && !isCollapsed) {
            bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
    }, [lines, isScrolledToBottom, isCollapsed]);

    function handleScroll(): void {
        const container = containerRef.current;
        if (!container) return;
        const atBottom =
            container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
        setIsScrolledToBottom(atBottom);
    }

    function toggle(): void {
        const next = !isCollapsed;
        setIsCollapsed(next);
        onToggle?.(next);
    }

    return (
        <div
            style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <button
                onClick={toggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.875rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: 'none',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                }}
            >
                <span>{title}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                    {lines.length} lines · {isCollapsed ? 'expand' : 'collapse'}
                </span>
            </button>

            {/* Log content */}
            {!isCollapsed && (
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    style={{
                        background: '#080810',
                        maxHeight,
                        overflowY: 'auto',
                        padding: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        lineHeight: '1.6',
                    }}
                >
                    {lines.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>
                            Waiting for output...
                        </span>
                    ) : (
                        lines.map((line) => (
                            <div
                                key={line.id}
                                style={{
                                    color:
                                        line.stream === 'stderr'
                                            ? '#f87171'
                                            : 'rgba(255,255,255,0.75)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {stripAnsi(line.text)}
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
    );
}
