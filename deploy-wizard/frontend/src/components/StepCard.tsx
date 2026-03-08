import { useState, useEffect } from 'react';
import type {
    StepDefinition,
    StepResult,
    DeploymentState,
    NetworkName,
    CallParam,
} from '../lib/types';
import type { WalletState } from '../lib/types';
import { TerminalLog } from './TerminalLog';
import { DiffViewer } from './DiffViewer';
import { ParameterReview } from './ParameterReview';
import { getMempoolUrl, getOpscanUrl } from '../lib/explorer';
import type { LogLine } from '../lib/types';
import type { DeployResult, CallResult, BuildResult, PatchResult } from '../lib/types';

interface StepCardProps {
    step: StepDefinition;
    status: 'pending' | 'active' | 'executing' | 'completed' | 'failed';
    result: StepResult | undefined;
    wallet: WalletState;
    deploymentState: DeploymentState;
    network: NetworkName;
    logLines: LogLine[];
    canExecute: boolean;
    onExecute: (step: StepDefinition, paramValues: string[]) => Promise<void>;
    /** For PATCH steps: diff string from server */
    diffContent?: string;
    /** For PATCH steps: approve callback */
    onApprovePatch?: () => Promise<void>;
    /** Propagation countdown (seconds remaining) */
    propagationCountdown?: number;
}

function badgeTypeStyle(type: StepDefinition['type']): string {
    switch (type) {
        case 'BUILD': return 'badge badge-build';
        case 'DEPLOY': return 'badge badge-deploy';
        case 'CALL': return 'badge badge-call';
        case 'PATCH': return 'badge badge-patch';
    }
}

function resolveParamValue(
    param: CallParam,
    wallet: WalletState,
    deploymentState: DeploymentState,
): string {
    if (param.fromDeployedAddress) {
        const addresses = deploymentState.deployedAddresses as Record<string, string | undefined>;
        return addresses[param.fromDeployedAddress] ?? '';
    }
    if (param.fromWalletPubKey) {
        return wallet.hashedMLDSAKey;
    }
    if (param.fromWalletAddress) {
        return wallet.walletAddress;
    }
    if (param.staticValue !== undefined) {
        if (Array.isArray(param.staticValue)) {
            return '[]';
        }
        return String(param.staticValue);
    }
    return '';
}

export function StepCard({
    step,
    status,
    result,
    wallet,
    deploymentState,
    network,
    logLines,
    canExecute,
    onExecute,
    diffContent,
    onApprovePatch,
    propagationCountdown,
}: StepCardProps): JSX.Element {
    const [isExpanded, setIsExpanded] = useState(status === 'active' || status === 'executing');
    const [paramValues, setParamValues] = useState<string[]>(() =>
        (step.params ?? []).map((p) => resolveParamValue(p, wallet, deploymentState)),
    );
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Expand active/executing steps automatically
    useEffect((): void => {
        if (status === 'active' || status === 'executing' || status === 'failed') {
            setIsExpanded(true);
        }
    }, [status]);

    // Re-resolve params when wallet or deployment state changes
    useEffect((): void => {
        setParamValues(
            (step.params ?? []).map((p) => resolveParamValue(p, wallet, deploymentState)),
        );
    }, [step.params, wallet, deploymentState]);

    async function handleExecute(): Promise<void> {
        setError(null);
        setIsExecuting(true);
        try {
            await onExecute(step, paramValues);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Step execution failed');
        } finally {
            setIsExecuting(false);
        }
    }

    const isCompleted = status === 'completed';
    const isFailed = status === 'failed';
    const isPending = status === 'pending';
    const isWaiting = propagationCountdown !== undefined && propagationCountdown > 0;

    const borderColor = isCompleted
        ? 'rgba(34,197,94,0.2)'
        : isFailed
        ? 'rgba(239,68,68,0.2)'
        : status === 'executing'
        ? 'rgba(245,158,11,0.2)'
        : status === 'active'
        ? 'var(--border-accent)'
        : 'var(--border-subtle)';

    return (
        <div
            className="card"
            style={{
                borderColor,
                marginBottom: '0.75rem',
                transition: 'border-color 0.2s ease',
            }}
        >
            {/* Header */}
            <button
                onClick={(): void => setIsExpanded((v) => !v)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                {/* Step number badge */}
                <div
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isCompleted
                            ? 'var(--success)'
                            : isFailed
                            ? 'var(--danger)'
                            : status === 'active' || status === 'executing'
                            ? 'var(--accent)'
                            : 'var(--bg-elevated)',
                        border: `2px solid ${isCompleted ? 'var(--success)' : isFailed ? 'var(--danger)' : isPending ? 'var(--border-muted)' : 'var(--accent)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: isCompleted || status === 'active' || status === 'executing' || isFailed ? 'var(--bg-base)' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                    }}
                >
                    {step.stepNumber}
                </div>

                {/* Name + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginBottom: '0.125rem',
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: '0.9375rem',
                                color: isCompleted ? 'var(--success)' : isFailed ? 'var(--danger)' : 'var(--text-primary)',
                            }}
                        >
                            {step.name}
                        </span>
                        <span className={badgeTypeStyle(step.type)}>{step.type}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {step.repo}
                        {step.estimatedCostSats && (
                            <span>
                                {' '}· ~{Number(step.estimatedCostSats).toLocaleString()} sats
                            </span>
                        )}
                    </div>
                </div>

                {/* Status badge */}
                <span
                    className={`badge badge-${status}`}
                    style={{ flexShrink: 0 }}
                >
                    {status}
                </span>

                {/* Expand/collapse indicator */}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▼'}
                </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div
                    className="fade-in"
                    style={{
                        padding: '0 1.25rem 1.25rem',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '1rem',
                    }}
                >
                    <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>{step.description}</p>

                    {/* BUILD: terminal log */}
                    {step.type === 'BUILD' && logLines.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <TerminalLog lines={logLines} title={`Build: ${step.repo}`} />
                        </div>
                    )}

                    {/* CALL: parameter review */}
                    {step.type === 'CALL' && step.params && step.params.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div
                                style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Parameters
                            </div>
                            <ParameterReview
                                params={step.params.map((p, i) => ({
                                    param: p,
                                    value: paramValues[i] ?? '',
                                }))}
                                onChange={(idx, val): void => {
                                    setParamValues((prev) => {
                                        const next = [...prev];
                                        next[idx] = val;
                                        return next;
                                    });
                                }}
                                disabled={isCompleted || isExecuting}
                            />
                        </div>
                    )}

                    {/* PATCH: diff viewer */}
                    {step.type === 'PATCH' && diffContent && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div
                                style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Source Changes (review before approving)
                            </div>
                            <DiffViewer diff={diffContent} title={`Patch: ${step.patchTarget ?? ''}`} />
                        </div>
                    )}

                    {/* Propagation countdown */}
                    {isWaiting && (
                        <div
                            style={{
                                padding: '0.75rem',
                                background: 'var(--warning-dim)',
                                border: '1px solid rgba(245,158,11,0.25)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem',
                                fontSize: '0.8125rem',
                                color: 'var(--warning)',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            Waiting for block propagation... {propagationCountdown}s remaining
                        </div>
                    )}

                    {/* Error display */}
                    {(error ?? isFailed) && (
                        <div
                            style={{
                                padding: '0.75rem',
                                background: 'var(--danger-dim)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem',
                                fontSize: '0.8125rem',
                                color: 'var(--danger)',
                            }}
                        >
                            {error ?? 'Step failed. Check logs and retry.'}
                        </div>
                    )}

                    {/* Completed result */}
                    {isCompleted && result && (
                        <ResultPanel result={result} network={network} />
                    )}

                    {/* Action buttons */}
                    {!isCompleted && (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {/* PATCH: approve button shown after diff is displayed */}
                            {step.type === 'PATCH' && diffContent && onApprovePatch && (
                                <button
                                    className="btn btn-primary"
                                    onClick={(): void => { void onApprovePatch(); }}
                                    disabled={isExecuting}
                                >
                                    {isExecuting ? 'Rebuilding...' : 'Approve & Rebuild'}
                                </button>
                            )}

                            {/* Non-patch steps: execute button */}
                            {step.type !== 'PATCH' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={(): void => { void handleExecute(); }}
                                    disabled={
                                        !canExecute ||
                                        isExecuting ||
                                        isWaiting ||
                                        !wallet.isConnected
                                    }
                                    title={
                                        !wallet.isConnected
                                            ? 'Connect wallet first'
                                            : !canExecute
                                            ? 'Complete prerequisite steps first'
                                            : isWaiting
                                            ? `Waiting for propagation (${propagationCountdown ?? 0}s)`
                                            : undefined
                                    }
                                >
                                    {isExecuting
                                        ? 'Executing...'
                                        : step.type === 'BUILD'
                                        ? 'Run Build'
                                        : step.type === 'DEPLOY'
                                        ? 'Deploy Contract'
                                        : 'Send Transaction'}
                                </button>
                            )}

                            {/* PATCH: initiate patch (before diff shown) */}
                            {step.type === 'PATCH' && !diffContent && canExecute && (
                                <button
                                    className="btn btn-primary"
                                    onClick={(): void => { void handleExecute(); }}
                                    disabled={isExecuting || !wallet.isConnected}
                                >
                                    {isExecuting ? 'Patching...' : 'Generate Patch'}
                                </button>
                            )}

                            {!wallet.isConnected && (
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                    Wallet required
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface ResultPanelProps {
    result: StepResult;
    network: NetworkName;
}

function ResultPanel({ result, network }: ResultPanelProps): JSX.Element {
    if ('deployTxHash' in result && 'pubKey' in result) {
        const deploy = result as DeployResult;
        return (
            <div
                style={{
                    padding: '1rem',
                    background: 'var(--success-dim)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--success)',
                        marginBottom: '0.75rem',
                    }}
                >
                    Contract Deployed
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contract Pubkey</div>
                        <div className="monospace" style={{ fontSize: '0.8125rem', wordBreak: 'break-all', color: 'var(--accent)' }}>
                            {deploy.pubKey}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deployment TX</div>
                        <div className="monospace" style={{ fontSize: '0.8125rem', wordBreak: 'break-all' }}>
                            {deploy.deployTxHash}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <a
                        href={getMempoolUrl(deploy.deployTxHash, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                    >
                        View on Mempool
                    </a>
                    <a
                        href={getOpscanUrl(deploy.pubKey, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                    >
                        View on OPScan
                    </a>
                </div>
            </div>
        );
    }

    if ('txHash' in result) {
        const call = result as CallResult;
        return (
            <div
                style={{
                    padding: '1rem',
                    background: 'var(--success-dim)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--success)',
                        marginBottom: '0.5rem',
                    }}
                >
                    Transaction Sent
                </div>
                <div className="monospace" style={{ fontSize: '0.8125rem', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                    {call.txHash}
                </div>
                <a
                    href={getMempoolUrl(call.txHash, network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                >
                    View on Mempool
                </a>
            </div>
        );
    }

    if ('success' in result && 'logTail' in result) {
        const build = result as BuildResult;
        return (
            <div
                style={{
                    padding: '0.75rem',
                    background: build.success ? 'var(--success-dim)' : 'var(--danger-dim)',
                    border: `1px solid ${build.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.8125rem',
                    color: build.success ? 'var(--success)' : 'var(--danger)',
                }}
            >
                Build {build.success ? 'succeeded' : 'failed'}
            </div>
        );
    }

    if ('diff' in result) {
        const patch = result as PatchResult;
        return (
            <div
                style={{
                    padding: '0.75rem',
                    background: patch.approved ? 'var(--success-dim)' : 'var(--warning-dim)',
                    border: `1px solid ${patch.approved ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.8125rem',
                    color: patch.approved ? 'var(--success)' : 'var(--warning)',
                }}
            >
                Patch {patch.approved ? 'approved and rebuilt' : 'generated — awaiting approval'}
            </div>
        );
    }

    return <></>;
}
