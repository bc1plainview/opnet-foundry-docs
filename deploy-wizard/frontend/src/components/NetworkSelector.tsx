import { useState } from 'react';
import type { NetworkName } from '../lib/types';

interface NetworkSelectorProps {
    network: NetworkName;
    onChange: (network: NetworkName) => void;
    disabled?: boolean;
}

export function NetworkSelector({ network, onChange, disabled = false }: NetworkSelectorProps): JSX.Element {
    const [showMainnetWarning, setShowMainnetWarning] = useState(false);

    function handleChange(next: NetworkName): void {
        if (next === 'mainnet') {
            setShowMainnetWarning(true);
        } else {
            onChange(next);
        }
    }

    function confirmMainnet(): void {
        setShowMainnetWarning(false);
        onChange('mainnet');
    }

    function cancelMainnet(): void {
        setShowMainnetWarning(false);
    }

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.25rem',
                }}
            >
                <button
                    className={`btn btn-sm ${network === 'testnet' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={(): void => handleChange('testnet')}
                    disabled={disabled}
                    aria-pressed={network === 'testnet'}
                >
                    Testnet
                </button>
                <button
                    className={`btn btn-sm ${network === 'mainnet' ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={(): void => handleChange('mainnet')}
                    disabled={disabled}
                    aria-pressed={network === 'mainnet'}
                    style={network === 'mainnet' ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
                >
                    Mainnet
                </button>
            </div>

            {network === 'mainnet' && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.625rem',
                        background: 'var(--danger-dim)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--danger)',
                        fontWeight: 600,
                    }}
                >
                    MAINNET — Real BTC at risk
                </div>
            )}

            {showMainnetWarning && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <div
                        className="card-elevated fade-in"
                        style={{
                            maxWidth: '480px',
                            width: '100%',
                            padding: '2rem',
                            borderColor: 'rgba(239,68,68,0.4)',
                        }}
                    >
                        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                            Switch to Mainnet?
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>
                            You are about to switch to Bitcoin Mainnet. All deployments will use
                            real BTC. Contract deployments typically cost 60,000–120,000 sats
                            each. The full ecosystem requires approximately 1,800,000 sats.
                        </p>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>
                            BTC transactions are irreversible. Verify all parameters before
                            confirming each step.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={cancelMainnet}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmMainnet}>
                                I understand — switch to Mainnet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
