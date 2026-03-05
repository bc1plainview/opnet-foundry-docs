import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWalletConnect, SupportedWallets } from '@btc-vision/walletconnect';
import { BlockMapCard } from '../components/BlockMapCard.js';
import { SkeletonCard } from '../components/SkeletonCard.js';
import { useGetBlockData } from '../hooks/useBlockMaps.js';
import type { MintedBlockData } from '../types/index.js';

function hash16ToHex(hash16: bigint): string {
    const hex = hash16.toString(16).padStart(32, '0');
    return hex.padEnd(64, '0');
}

// Sample set of block heights to check against the connected wallet owner
// In a full implementation this would use event indexing
const KNOWN_HEIGHTS: bigint[] = [
    500000n, 630000n, 700000n, 750000n, 800000n, 840000n,
    550000n, 600000n, 650000n, 680000n, 720000n, 780000n,
];

interface OwnedEntry {
    blockHeight: bigint;
    data: MintedBlockData;
}

export function MyBlockMapsPage(): React.ReactElement {
    const { address, walletAddress, hashedMLDSAKey, connectToWallet } = useWalletConnect();
    const isConnected = address !== null;
    const { fetchMintedBlockData } = useGetBlockData();
    const [ownedBlocks, setOwnedBlocks] = useState<OwnedEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const ownerKey: string = hashedMLDSAKey ?? '';

    const loadOwnedBlocks = useCallback(async (): Promise<void> => {
        if (!ownerKey) return;
        setLoading(true);
        setOwnedBlocks([]);

        const results: OwnedEntry[] = [];
        for (const height of KNOWN_HEIGHTS) {
            try {
                const data = await fetchMintedBlockData(height);
                if (data && data.hash16 !== 0n && data.owner) {
                    const ownerNorm = data.owner.toLowerCase();
                    const keyNorm = ownerKey.toLowerCase();
                    if (ownerNorm === keyNorm) {
                        results.push({ blockHeight: height, data });
                    }
                }
            } catch {
                // Not minted or not owned
            }
        }
        setOwnedBlocks(results);
        setLoading(false);
    }, [ownerKey, fetchMintedBlockData]);

    useEffect(() => {
        if (isConnected && ownerKey) {
            void loadOwnedBlocks();
        }
    }, [isConnected, ownerKey, loadOwnedBlocks]);

    const handleConnect = useCallback((): void => {
        connectToWallet(SupportedWallets.OP_WALLET);
    }, [connectToWallet]);

    if (!isConnected || !walletAddress) {
        return (
            <div className="page">
                <div
                    className="container"
                    style={{ maxWidth: '600px', textAlign: 'center', paddingTop: 'var(--spacing-2xl)' }}
                >
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '12px',
                        }}
                    >
                        My BlockMaps
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                        Connect your wallet to see your BlockMaps.
                    </p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleConnect}
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1
                            style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '4px',
                            }}
                        >
                            My BlockMaps
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                            {walletAddress}
                        </p>
                    </div>
                    <Link to="/" className="btn btn-primary btn-sm">
                        Mint New Block
                    </Link>
                </div>

                {loading ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '16px',
                        }}
                    >
                        <SkeletonCard count={4} />
                    </div>
                ) : ownedBlocks.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            padding: 'var(--spacing-2xl)',
                            fontSize: '14px',
                        }}
                    >
                        <p style={{ marginBottom: '16px' }}>You have not minted any BlockMaps yet.</p>
                        <Link to="/" className="btn btn-primary">
                            Mint Your First Block
                        </Link>
                    </div>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 'var(--spacing-lg)', fontVariantNumeric: 'tabular-nums' }}>
                            {ownedBlocks.length} BlockMap{ownedBlocks.length !== 1 ? 's' : ''} found
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '16px',
                            }}
                        >
                            {ownedBlocks.map(({ blockHeight, data }) => (
                                <BlockMapCard
                                    key={blockHeight.toString()}
                                    blockHeight={blockHeight}
                                    hashHex={hash16ToHex(data.hash16)}
                                    txCount={Number(data.txCount)}
                                    owner={data.owner}
                                    timestamp={data.timestamp}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
