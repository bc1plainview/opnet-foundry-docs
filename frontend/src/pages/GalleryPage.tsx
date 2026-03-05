import React, { useState, useCallback, useEffect } from 'react';
import { BlockMapCard } from '../components/BlockMapCard.js';
import { SkeletonCard } from '../components/SkeletonCard.js';
import { useGetBlockData } from '../hooks/useBlockMaps.js';
import type { MintedBlockData } from '../types/index.js';

// Reconstruct hash hex from stored hash16 bigint
// hash16 is the first 16 bytes of the block hash stored as a u256
function hash16ToHex(hash16: bigint): string {
    const hex = hash16.toString(16).padStart(32, '0');
    // Pad to 64 chars (32 bytes) — remaining bytes are zero
    return hex.padEnd(64, '0');
}

interface GalleryEntry {
    blockHeight: bigint;
    data: MintedBlockData;
}

// Known minted blocks + popular heights to probe
const PROBE_HEIGHTS: bigint[] = [
    111111n,
    500000n,
    630000n,
    700000n,
    750000n,
    800000n,
    840000n,
];

export function GalleryPage(): React.ReactElement {
    const { fetchMintedBlockData } = useGetBlockData();
    const [entries, setEntries] = useState<GalleryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchInput, setSearchInput] = useState('');
    const [searchHeight, setSearchHeight] = useState<bigint | null>(null);
    const [searchResult, setSearchResult] = useState<GalleryEntry | null>(null);
    const [searching, setSearching] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadGallery = async (): Promise<void> => {
            setLoading(true);
            const results: GalleryEntry[] = [];

            for (const height of PROBE_HEIGHTS) {
                if (cancelled) return;
                try {
                    const data = await fetchMintedBlockData(height);
                    if (data && data.owner && data.owner !== '0x' && data.hash16 !== 0n) {
                        results.push({ blockHeight: height, data });
                    }
                } catch {
                    // Block not minted — skip
                }
            }

            if (!cancelled) {
                setEntries(results);
                setLoading(false);
            }
        };

        void loadGallery();
        return (): void => { cancelled = true; };
    }, [fetchMintedBlockData]);

    const handleSearch = useCallback(async (): Promise<void> => {
        const str = searchInput.trim();
        if (!str || !/^\d+$/.test(str)) return;

        setSearching(true);
        setSearchResult(null);
        setNotFound(false);

        const height = BigInt(str);
        setSearchHeight(height);

        const data = await fetchMintedBlockData(height);
        if (data && data.hash16 !== 0n) {
            setSearchResult({ blockHeight: height, data });
        } else {
            setNotFound(true);
        }
        setSearching(false);
    }, [searchInput, fetchMintedBlockData]);

    return (
        <div className="page">
            <div className="container">
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                        }}
                    >
                        Gallery
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Minted BlockMaps on OPNet Testnet.
                    </p>
                </div>

                {/* Search by block height */}
                <div className="glass-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2
                        style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 'var(--spacing-md)',
                        }}
                    >
                        Search by Block Height
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="input-field"
                            placeholder="e.g. 500000"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !searching) void handleSearch();
                            }}
                            disabled={searching}
                            aria-label="Search block height"
                            style={{ maxWidth: '260px' }}
                        />
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => void handleSearch()}
                            disabled={searching || !searchInput.trim()}
                        >
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {notFound && searchHeight !== null && (
                        <p
                            style={{
                                marginTop: '12px',
                                color: 'var(--text-muted)',
                                fontSize: '13px',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            Block #{searchHeight.toLocaleString()} has not been minted yet.
                        </p>
                    )}

                    {searchResult && (
                        <div style={{ marginTop: 'var(--spacing-md)', maxWidth: '280px' }}>
                            <BlockMapCard
                                blockHeight={searchResult.blockHeight}
                                hashHex={hash16ToHex(searchResult.data.hash16)}
                                txCount={Number(searchResult.data.txCount)}
                                owner={searchResult.data.owner}
                                timestamp={searchResult.data.timestamp}
                            />
                        </div>
                    )}
                </div>

                {/* Gallery grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {loading ? (
                        <SkeletonCard count={6} />
                    ) : entries.length === 0 ? (
                        <div
                            style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                padding: 'var(--spacing-2xl)',
                                fontSize: '14px',
                            }}
                        >
                            No BlockMaps minted yet. Be the first.
                        </div>
                    ) : (
                        entries.map(({ blockHeight, data }) => (
                            <BlockMapCard
                                key={blockHeight.toString()}
                                blockHeight={blockHeight}
                                hashHex={hash16ToHex(data.hash16)}
                                txCount={Number(data.txCount)}
                                owner={data.owner}
                                timestamp={data.timestamp}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
