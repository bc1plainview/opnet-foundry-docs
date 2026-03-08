/** Unified diff viewer — added lines green, removed lines red, context lines muted */

import type { CSSProperties } from 'react';

interface DiffViewerProps {
    diff: string;
    title?: string;
    maxHeight?: string;
}

function classifyLine(line: string): 'added' | 'removed' | 'header' | 'context' {
    if (line.startsWith('+') && !line.startsWith('+++')) return 'added';
    if (line.startsWith('-') && !line.startsWith('---')) return 'removed';
    if (line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff')) return 'header';
    return 'context';
}

function lineStyle(type: 'added' | 'removed' | 'header' | 'context'): CSSProperties {
    switch (type) {
        case 'added':
            return { background: 'rgba(34,197,94,0.08)', color: '#4ade80' };
        case 'removed':
            return { background: 'rgba(239,68,68,0.08)', color: '#f87171' };
        case 'header':
            return { color: 'rgba(147,197,253,0.8)', fontWeight: 600 };
        case 'context':
            return { color: 'rgba(255,255,255,0.5)' };
    }
}

export function DiffViewer({
    diff,
    title = 'Source Diff',
    maxHeight = '400px',
}: DiffViewerProps): JSX.Element {
    if (!diff) {
        return (
            <div
                style={{
                    padding: '1rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-mono)',
                }}
            >
                No diff available.
            </div>
        );
    }

    const lines = diff.split('\n');

    return (
        <div
            style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '0.5rem 0.875rem',
                    background: 'rgba(0,0,0,0.4)',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span>{title}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                    {lines.filter((l) => l.startsWith('+')).length} additions,{' '}
                    {lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length} deletions
                </span>
            </div>

            <div
                style={{
                    background: '#080810',
                    maxHeight,
                    overflowY: 'auto',
                    padding: '0.5rem 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    lineHeight: '1.6',
                }}
            >
                {lines.map((line, idx) => {
                    const type = classifyLine(line);
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '0 0.875rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                ...lineStyle(type),
                            }}
                        >
                            {line || '\u00A0'}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
