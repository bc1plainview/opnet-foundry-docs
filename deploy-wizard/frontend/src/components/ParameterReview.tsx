import type { CallParam } from '../lib/types';

interface ParameterValue {
    param: CallParam;
    /** Resolved value (string form for display/editing) */
    value: string;
}

interface ParameterReviewProps {
    params: ParameterValue[];
    onChange: (index: number, value: string) => void;
    disabled?: boolean;
}

/**
 * Displays a table of pre-filled contract call parameters.
 * Editable fields show text inputs; read-only fields show monospace text.
 */
export function ParameterReview({
    params,
    onChange,
    disabled = false,
}: ParameterReviewProps): JSX.Element {
    if (params.length === 0) {
        return (
            <div
                style={{
                    padding: '0.75rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                }}
            >
                No parameters required.
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
            }}
        >
            {params.map(({ param, value }, idx) => (
                <div
                    key={param.name}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr',
                        gap: '0',
                        borderBottom: idx < params.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                >
                    {/* Name + type column */}
                    <div
                        style={{
                            padding: '0.625rem 0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRight: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.125rem',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            {param.name}
                        </span>
                        <span
                            style={{
                                fontSize: '0.6875rem',
                                color: 'var(--accent)',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            {param.typeHint}
                        </span>
                    </div>

                    {/* Value column */}
                    <div
                        style={{
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {param.description}
                        </div>

                        {param.editable && !disabled ? (
                            <input
                                className="input input-mono"
                                value={value}
                                onChange={(e): void => onChange(idx, e.target.value)}
                                placeholder={param.typeHint}
                                style={{ fontSize: '0.8125rem' }}
                            />
                        ) : (
                            <div
                                className="monospace"
                                style={{
                                    fontSize: '0.8125rem',
                                    color: value ? 'var(--text-primary)' : 'var(--text-muted)',
                                    wordBreak: 'break-all',
                                    padding: '0.25rem 0',
                                }}
                            >
                                {value || '(auto-filled from deployment state)'}
                            </div>
                        )}

                        {!param.editable && (
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic',
                                }}
                            >
                                Auto-filled from previous step
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
