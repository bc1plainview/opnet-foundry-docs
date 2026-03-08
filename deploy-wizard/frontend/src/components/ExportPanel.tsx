import { useState } from 'react';
import type { DeploymentState, NetworkName, DeploymentExport } from '../lib/types';
import { buildExplorerLinks } from '../lib/explorer';
import type { DeployResult, CallResult } from '../lib/types';

interface ExportPanelProps {
    state: DeploymentState;
    network: NetworkName;
}

function buildExportData(state: DeploymentState, network: NetworkName): DeploymentExport {
    const transactions: DeploymentExport['transactions'] = {};

    for (const [stepId, result] of Object.entries(state.stepResults)) {
        if ('deployTxHash' in result && 'pubKey' in result) {
            const deployResult = result as DeployResult;
            transactions[stepId] = {
                txHash: deployResult.deployTxHash,
                explorerLinks: buildExplorerLinks(
                    deployResult.deployTxHash,
                    deployResult.pubKey,
                    network,
                ),
            };
        } else if ('txHash' in result) {
            const callResult = result as CallResult;
            transactions[stepId] = {
                txHash: callResult.txHash,
                explorerLinks: {
                    mempool:
                        network === 'mainnet'
                            ? `https://mempool.opnet.org/tx/${callResult.txHash}`
                            : `https://mempool.opnet.org/testnet4/tx/${callResult.txHash}`,
                    opscan: '',
                },
            };
        }
    }

    return {
        exportedAt: new Date().toISOString(),
        network,
        deployedAddresses: state.deployedAddresses,
        transactions,
    };
}

function formatAsTable(data: DeploymentExport): string {
    const lines: string[] = [
        `OPNet Deployment Export — ${data.network.toUpperCase()}`,
        `Exported: ${new Date(data.exportedAt).toLocaleString()}`,
        '',
        'DEPLOYED CONTRACTS',
        '==================',
    ];

    for (const [key, address] of Object.entries(data.deployedAddresses)) {
        if (address) {
            lines.push(`${key.padEnd(35)} ${address}`);
        }
    }

    lines.push('', 'TRANSACTIONS', '============');

    for (const [stepId, tx] of Object.entries(data.transactions)) {
        if (tx.txHash) {
            lines.push(`${stepId.padEnd(35)} ${tx.txHash}`);
            if (tx.explorerLinks.mempool) {
                lines.push(`${''.padEnd(35)} ${tx.explorerLinks.mempool}`);
            }
        }
    }

    return lines.join('\n');
}

export function ExportPanel({ state, network }: ExportPanelProps): JSX.Element {
    const [copied, setCopied] = useState(false);
    const hasData = Object.values(state.deployedAddresses).some(Boolean);

    const exportData = buildExportData(state, network);
    const json = JSON.stringify(exportData, null, 2);

    function downloadJson(): void {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opnet-deployment-${network}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function copyTable(): Promise<void> {
        const table = formatAsTable(exportData);
        await navigator.clipboard.writeText(table);
        setCopied(true);
        setTimeout((): void => setCopied(false), 2000);
    }

    if (!hasData) {
        return (
            <div
                style={{
                    padding: '1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                }}
            >
                No deployed contracts yet. Complete deployment steps to export results.
            </div>
        );
    }

    return (
        <div
            className="card-elevated"
            style={{ padding: '1.5rem' }}
        >
            <h3 style={{ marginBottom: '1rem' }}>Export Deployment Results</h3>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                }}
            >
                {Object.entries(state.deployedAddresses)
                    .filter(([, addr]) => Boolean(addr))
                    .map(([key, address]) => (
                        <div
                            key={key}
                            style={{
                                padding: '0.625rem',
                                background: 'var(--bg-surface)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                {key}
                            </div>
                            <div
                                className="monospace"
                                style={{
                                    fontSize: '0.6875rem',
                                    color: 'var(--accent)',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {address ?? ''}
                            </div>
                        </div>
                    ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary btn-sm" onClick={downloadJson}>
                    Download JSON
                </button>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={(): void => { void copyTable(); }}
                >
                    {copied ? 'Copied!' : 'Copy as Table'}
                </button>
            </div>
        </div>
    );
}
