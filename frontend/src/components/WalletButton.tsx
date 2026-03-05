import React from 'react';
import { useWalletConnect, SupportedWallets } from '@btc-vision/walletconnect';

function truncateAddress(addr: string): string {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export function WalletButton(): React.ReactElement {
    const { address, walletAddress, connectToWallet, disconnect } = useWalletConnect();

    const isConnected = address !== null;

    const handleConnect = (): void => {
        connectToWallet(SupportedWallets.OP_WALLET);
    };

    const handleDisconnect = (): void => {
        disconnect();
    };

    if (isConnected && walletAddress) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    <span className="status-dot status-dot-green" />
                    {truncateAddress(walletAddress)}
                </span>
                <button
                    onClick={handleDisconnect}
                    className="btn btn-ghost btn-sm"
                    type="button"
                    aria-label="Disconnect wallet"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="btn btn-primary"
            type="button"
        >
            Connect Wallet
        </button>
    );
}
