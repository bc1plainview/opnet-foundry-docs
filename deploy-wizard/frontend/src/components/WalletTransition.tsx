import type { WalletState } from '../lib/types';

interface WalletTransitionProps {
    pillWallet: WalletState;
    motoWallet: WalletState;
    onConnectMoto: () => Promise<void>;
    onDisconnectPill: () => void;
    isConnecting: boolean;
    error: string | null;
}

/**
 * Full-screen transition screen shown between Phase 1 (PILL) and Phase 2 (MOTO).
 * Blocks progression until the MOTO wallet is connected.
 */
export function WalletTransition({
    pillWallet,
    motoWallet,
    onConnectMoto,
    onDisconnectPill,
    isConnecting,
    error,
}: WalletTransitionProps): JSX.Element {
    const pillDone = !pillWallet.isConnected;
    const motoDone = motoWallet.isConnected;

    return (
        <div
            className="fade-in"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-xl)',
                padding: '2.5rem',
                maxWidth: '560px',
                margin: '2rem auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                }}
            >
                <div
                    style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--warning)',
                        boxShadow: '0 0 8px var(--warning)',
                        flexShrink: 0,
                    }}
                />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Wallet Switch Required</h2>
            </div>

            <p style={{ marginBottom: '2rem' }}>
                Phase 1 (PILL ecosystem) is complete. You must now disconnect the PILL
                deployer wallet and connect the MOTO deployer wallet to continue.
            </p>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    marginBottom: '2rem',
                }}
            >
                {/* Step 1: Disconnect PILL wallet */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: pillDone ? 'var(--success-dim)' : 'var(--bg-elevated)',
                        border: `1px solid ${pillDone ? 'rgba(34,197,94,0.25)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    <div
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: pillDone ? 'var(--success)' : 'var(--bg-overlay)',
                            border: `2px solid ${pillDone ? 'var(--success)' : 'var(--border-muted)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--bg-base)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                        }}
                    >
                        {pillDone ? '1' : '1'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: pillDone ? 'var(--success)' : 'var(--text-primary)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {pillDone ? 'PILL wallet disconnected' : 'Disconnect PILL wallet'}
                        </div>
                        {!pillDone && pillWallet.isConnected && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                Connected: {pillWallet.walletAddress.slice(0, 16)}...
                            </div>
                        )}
                    </div>
                    {!pillDone && pillWallet.isConnected && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={onDisconnectPill}
                        >
                            Disconnect
                        </button>
                    )}
                </div>

                {/* Step 2: Connect MOTO wallet */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: motoDone ? 'var(--success-dim)' : 'var(--bg-elevated)',
                        border: `1px solid ${motoDone ? 'rgba(34,197,94,0.25)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        opacity: pillDone ? 1 : 0.5,
                    }}
                >
                    <div
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: motoDone ? 'var(--success)' : 'var(--bg-overlay)',
                            border: `2px solid ${motoDone ? 'var(--success)' : 'var(--border-muted)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: motoDone ? 'var(--bg-base)' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                        }}
                    >
                        2
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: motoDone ? 'var(--success)' : 'var(--text-primary)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {motoDone ? 'MOTO wallet connected' : 'Connect MOTO wallet'}
                        </div>
                        {motoDone && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {motoWallet.walletAddress.slice(0, 16)}...
                            </div>
                        )}
                        {!motoDone && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                Connect the wallet that will deploy the MOTO ecosystem.
                                This will be saved as the MOTO deployer for all Phase 2 steps.
                            </div>
                        )}
                    </div>
                    {pillDone && !motoDone && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={(): void => { void onConnectMoto(); }}
                            disabled={isConnecting}
                        >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: '0.75rem',
                        background: 'var(--danger-dim)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8125rem',
                        color: 'var(--danger)',
                    }}
                >
                    {error}
                </div>
            )}

            {!pillDone && (
                <p
                    style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        marginTop: '1rem',
                        textAlign: 'center',
                    }}
                >
                    Complete step 1 first — disconnect the PILL wallet before connecting the MOTO wallet.
                </p>
            )}
        </div>
    );
}
