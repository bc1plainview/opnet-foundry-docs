import React from 'react';
import { Link } from 'react-router-dom';
import { SVGPreview } from './SVGPreview.js';

interface BlockMapCardProps {
    blockHeight: bigint;
    hashHex: string;
    txCount?: number;
    owner: string;
    timestamp?: bigint;
}

function truncateAddress(addr: string): string {
    if (addr.length <= 18) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function formatTimestamp(ts: bigint): string {
    const date = new Date(Number(ts) * 1000);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function BlockMapCard({ blockHeight, hashHex, txCount, owner, timestamp }: BlockMapCardProps): React.ReactElement {
    return (
        <Link
            to={`/block/${blockHeight.toString()}`}
            style={{ textDecoration: 'none' }}
        >
            <div
                className="glass-card"
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '16px',
                    transition: 'all 250ms ease',
                }}
            >
                <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: '8px' }}>
                    <SVGPreview
                        blockHeight={blockHeight}
                        hashHex={hashHex}
                        txCount={txCount}
                        size={280}
                        className="block-map-svg"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span
                        style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        Block #{blockHeight.toLocaleString()}
                    </span>

                    <span
                        className="code-text"
                        style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                    >
                        {truncateAddress(owner)}
                    </span>

                    {timestamp !== undefined && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {formatTimestamp(timestamp)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
