import type { AdminStateField } from '../lib/types';
import type { ContractStateValues } from '../hooks/useContractState';

interface StateGridProps {
    fields: AdminStateField[];
    values: ContractStateValues;
    isLoading: boolean;
}

export function StateGrid({ fields, values, isLoading }: StateGridProps): JSX.Element {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.625rem',
            }}
        >
            {fields.map((field) => {
                const value = values[field.method];
                return (
                    <div
                        key={field.method}
                        style={{
                            padding: '0.625rem 0.75rem',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.25rem',
                                fontWeight: 500,
                            }}
                        >
                            {field.label}
                        </div>
                        {isLoading && value === undefined ? (
                            <div
                                className="skeleton skeleton-text"
                                style={{ width: '80%', height: '1rem' }}
                            />
                        ) : (
                            <div
                                className="monospace"
                                style={{
                                    fontSize: '0.875rem',
                                    color: value ? 'var(--text-primary)' : 'var(--text-muted)',
                                    fontVariantNumeric: 'tabular-nums',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {value ?? '--'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
