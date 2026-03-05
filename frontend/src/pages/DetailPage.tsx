import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SVGPreview } from '../components/SVGPreview.js';
import { ExplorerLinks } from '../components/ExplorerLinks.js';
import { useGetBlockData } from '../hooks/useBlockMaps.js';
import { mempoolBlockUrl, CONTRACT_ADDRESS } from '../lib/constants.js';
import type { MintedBlockData } from '../types/index.js';

function hash16ToHex(hash16: bigint): string {
    const hex = hash16.toString(16).padStart(32, '0');
    return hex.padEnd(64, '0');
}

function formatTimestamp(ts: bigint): string {
    const date = new Date(Number(ts) * 1000);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

function formatDifficulty(d: bigint): string {
    const num = Number(d);
    if (num >= 1e12) return `${(num / 1e12).toFixed(4)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(4)}G`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(4)}M`;
    return num.toLocaleString();
}

interface CopyButtonProps {
    value: string;
}

function CopyButton({ value }: CopyButtonProps): React.ReactElement {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async (): Promise<void> => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }, [value]);

    return (
        <button
            type="button"
            className="copy-btn"
            onClick={() => void handleCopy()}
            aria-label="Copy to clipboard"
        >
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

export function DetailPage(): React.ReactElement {
    const { height } = useParams<{ height: string }>();
    const { mintedBlockData, loadingMintedData, fetchMintedBlockData } = useGetBlockData();
    const [error, setError] = useState<string | null>(null);

    let blockHeight: bigint = 0n;
    try {
        blockHeight = height && /^\d+$/.test(height) ? BigInt(height) : 0n;
    } catch {
        blockHeight = 0n;
    }

    useEffect(() => {
        if (!height) {
            setError('Invalid block height');
            return;
        }
        void fetchMintedBlockData(BigInt(height)).then((data) => {
            if (!data || data.hash16 === 0n) {
                setError(`Block #${height} has not been minted.`);
            }
        });
    }, [height, fetchMintedBlockData]);

    const data: MintedBlockData | null = mintedBlockData;

    if (loadingMintedData) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2xl)', flexWrap: 'wrap' }}>
                        <div className="skeleton" style={{ width: '320px', height: '320px', borderRadius: '12px', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
                            <div className="skeleton" style={{ height: '32px', width: '70%', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ height: '200px', borderRadius: '8px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <Link to="/gallery" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--spacing-lg)', display: 'inline-flex' }}>
                        Back to Gallery
                    </Link>
                    <div className="alert alert-info">
                        {error ?? 'Block not found.'}
                    </div>
                </div>
            </div>
        );
    }

    const hashHex = hash16ToHex(data.hash16);

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Back link */}
                <Link
                    to="/gallery"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        marginBottom: 'var(--spacing-xl)',
                        textDecoration: 'none',
                        transition: 'color 200ms ease',
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M11 6H1M1 6L6 1M1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Gallery
                </Link>

                <div style={{ display: 'flex', gap: 'var(--spacing-2xl)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* SVG with glow border */}
                    <div
                        style={{
                            flexShrink: 0,
                            borderRadius: '12px',
                            padding: '3px',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-b), var(--accent-c))',
                            boxShadow: '0 0 40px var(--accent-20), 0 0 80px rgba(0, 255, 204, 0.1)',
                        }}
                    >
                        <SVGPreview
                            blockHeight={blockHeight}
                            hashHex={hashHex}
                            txCount={Number(data.txCount)}
                            size={320}
                        />
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <div>
                            <h1
                                style={{
                                    fontSize: '28px',
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    marginBottom: '4px',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                Block #{blockHeight.toLocaleString()}
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                On-chain BlockMap NFT
                            </p>
                        </div>

                        {/* Block data table */}
                        <div className="glass-card" style={{ padding: '16px' }}>
                            <table className="meta-table">
                                <tbody>
                                    <tr>
                                        <td>Hash (first 16B)</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="code-text" style={{ fontSize: '11px' }}>
                                                    {hashHex.slice(0, 32)}...
                                                </span>
                                                <CopyButton value={hashHex} />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Transactions</td>
                                        <td data-numeric style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {data.txCount.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Timestamp</td>
                                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {formatTimestamp(data.timestamp)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Difficulty</td>
                                        <td data-numeric style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {formatDifficulty(data.difficulty)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Owner</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="code-text" style={{ fontSize: '11px' }}>
                                                    {data.owner}
                                                </span>
                                                <CopyButton value={data.owner} />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Explorer links */}
                        <div>
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '8px',
                                }}
                            >
                                Block on Mempool
                            </div>
                            <a
                                href={mempoolBlockUrl(blockHeight)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="explorer-link"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M1 11L11 1M11 1H4M11 1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                View on Mempool.opnet.org
                            </a>
                        </div>

                        {/* OPScan link for contract */}
                        <div>
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '8px',
                                }}
                            >
                                Contract on OPScan
                            </div>
                            <ExplorerLinks txid="" contractAddress={CONTRACT_ADDRESS} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
