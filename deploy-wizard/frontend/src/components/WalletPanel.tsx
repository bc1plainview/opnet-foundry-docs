import type { WalletState, NetworkName } from '../lib/types';

interface WalletPanelProps {
    wallet: WalletState;
    onConnect: () => Promise<void>;
    onDisconnect: () => void;
    isConnecting: boolean;
    error: string | null;
    network: NetworkName;
}

function formatBalance(sats: bigint): string {
    if (sats === 0n) return '0.00000000 BTC';
    const btc = Number(sats) / 1e8;
    return `${btc.toFixed(8)} BTC`;
}

function truncateAddress(address: string): string {
    if (address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
}

function phaseLabel(phase: 1 | 2 | null): string {
    if (phase === 1) return 'PILL Deployer';
    if (phase === 2) return 'MOTO Deployer';
    return '';
}

export function WalletPanel({
    wallet,
    onConnect,
    onDisconnect,
    isConnecting,
    error,
    network,
}: WalletPanelProps): JSX.Element {
    const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Testnet';

    if (!wallet.isConnected) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}
            >
                {error && (
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger)',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                        title={error}
                    >
                        {error}
                    </span>
                )}
                <button
                    className="btn btn-primary btn-sm"
                    onClick={(): void => { void onConnect(); }}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            </div>
        );
    }

    const phase = wallet.deployerPhase;
    const label = phaseLabel(phase);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.5rem 0.875rem',
            }}
        >
            {label && (
                <span
                    className="badge badge-deploy"
                    style={{ fontSize: '0.7rem' }}
                >
                    {label}
                </span>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span
                    className="monospace"
                    style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                    title={wallet.walletAddress}
                >
                    {truncateAddress(wallet.walletAddress)}
                </span>
                <span
                    className="monospace"
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {formatBalance(wallet.balanceSats)} · {networkLabel}
                </span>
            </div>

            <button
                className="btn btn-ghost btn-sm"
                onClick={onDisconnect}
                style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                title="Disconnect wallet"
            >
                Disconnect
            </button>
        </div>
    );
}
