import { useState } from 'react';
import type { AdminFunctionDef, NetworkName, WalletState } from '../lib/types';
import { getMempoolUrl } from '../lib/explorer';

interface AdminFunctionCardProps {
    funcDef: AdminFunctionDef;
    contractAddress: string;
    wallet: WalletState;
    network: NetworkName;
    currentValue?: string | null;
    onCall: (funcDef: AdminFunctionDef, inputValues: string[]) => Promise<string>;
}

export function AdminFunctionCard({
    funcDef,
    wallet,
    network,
    currentValue,
    onCall,
}: AdminFunctionCardProps): JSX.Element {
    const [inputValues, setInputValues] = useState<string[]>(
        funcDef.inputs.map(() => ''),
    );
    const [isExecuting, setIsExecuting] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [simResult] = useState<string | null>(null);

    function handleInputChange(idx: number, value: string): void {
        setInputValues((prev) => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    }

    async function handleCall(): Promise<void> {
        setError(null);
        setTxHash(null);
        setIsExecuting(true);
        try {
            const hash = await onCall(funcDef, inputValues);
            setTxHash(hash);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Transaction failed');
        } finally {
            setIsExecuting(false);
        }
    }

    const canExecute = wallet.isConnected && inputValues.every((v, i) => {
        // Allow empty values only for optional-looking fields
        return v.trim().length > 0 || funcDef.inputs[i]?.name === 'withUpdate';
    });

    return (
        <div
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}
        >
            {/* Header */}
            <div>
                <div
                    style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        marginBottom: '0.25rem',
                        fontFamily: 'var(--font-mono)',
                    }}
                >
                    {funcDef.displayName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {funcDef.description}
                </div>
            </div>

            {/* Current value */}
            {funcDef.currentValueLabel && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {funcDef.currentValueLabel}
                    </span>
                    <span
                        className="monospace"
                        style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}
                    >
                        {currentValue ?? '--'}
                    </span>
                </div>
            )}

            {/* Inputs */}
            {funcDef.inputs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {funcDef.inputs.map((input, idx) => (
                        <div key={input.name}>
                            <label className="label" htmlFor={`admin-input-${funcDef.methodName}-${idx}`}>
                                {input.name}{' '}
                                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                    {input.typeHint}
                                </span>
                            </label>
                            {input.typeHint === 'BOOL' ? (
                                <select
                                    id={`admin-input-${funcDef.methodName}-${idx}`}
                                    className="input"
                                    value={inputValues[idx] ?? ''}
                                    onChange={(e): void => handleInputChange(idx, e.target.value)}
                                    disabled={isExecuting}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    <option value="">Select...</option>
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            ) : (
                                <input
                                    id={`admin-input-${funcDef.methodName}-${idx}`}
                                    className={`input ${input.isAddress || input.isBigInt ? 'input-mono' : ''}`}
                                    type="text"
                                    value={inputValues[idx] ?? ''}
                                    onChange={(e): void => handleInputChange(idx, e.target.value)}
                                    placeholder={
                                        input.showCurrentValue && currentValue
                                            ? currentValue
                                            : input.description
                                    }
                                    disabled={isExecuting}
                                />
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {input.description}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Simulation note */}
            {simResult && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--info-dim)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        color: 'var(--info)',
                    }}
                >
                    Simulation: {simResult}
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--danger-dim)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        color: 'var(--danger)',
                    }}
                >
                    {error}
                </div>
            )}

            {/* TX result */}
            {txHash && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--success-dim)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        color: 'var(--success)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                    }}
                >
                    <div className="monospace" style={{ wordBreak: 'break-all' }}>
                        {txHash}
                    </div>
                    <a
                        href={getMempoolUrl(txHash, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem' }}
                    >
                        View on Mempool
                    </a>
                </div>
            )}

            {/* Action button */}
            <button
                className="btn btn-primary btn-sm"
                onClick={(): void => { void handleCall(); }}
                disabled={!canExecute || isExecuting}
                title={!wallet.isConnected ? 'Connect wallet first' : undefined}
            >
                {isExecuting ? 'Sending...' : `Call ${funcDef.displayName}`}
            </button>
        </div>
    );
}
