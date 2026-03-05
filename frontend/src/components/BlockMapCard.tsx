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
    if (addr.length <= 16) return addr;
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
            style={{ textDecoration: 'none', display: 'block' }}
        >
            <div
                className="glass-card"
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '10px',
                    transition: 'all 250ms ease',
                }}
            >
                {/* Grid preview */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    overflow: 'hidden',
                    borderRadius: '6px',
                }}>
                    <SVGPreview
                        blockHeight={blockHeight}
                        hashHex={hashHex}
                        txCount={txCount}
                        className="block-map-svg"
                    />

                    {/* Tx count badge overlay */}
                    {txCount !== undefined && (
                        <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: 'rgba(5, 5, 16, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            color: 'var(--text-secondary)',
                            fontVariantNumeric: 'tabular-nums',
                            backdropFilter: 'blur(8px)',
                        }}>
                            {txCount.toLocaleString()} txns
                        </div>
                    )}
                </div>

                {/* Block info */}
                <div style={{ padding: '2px 4px 4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        #{blockHeight.toLocaleString()}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span
                            className="code-text"
                            style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {truncateAddress(owner)}
                        </span>

                        {timestamp !== undefined && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {formatTimestamp(timestamp)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
