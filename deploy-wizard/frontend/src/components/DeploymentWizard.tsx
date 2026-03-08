import { useState } from 'react';
import type {
    DeploymentState,
    NetworkName,
    StepDefinition,
    StepStatus,
    WalletState,
} from '../lib/types';
import { DEPLOYMENT_STEPS } from '../lib/steps';
import { StepCard } from './StepCard';
import { WalletTransition } from './WalletTransition';
import { ExportPanel } from './ExportPanel';
import type { LogLine } from '../lib/types';
import type { StepResult } from '../lib/types';

interface DeploymentWizardProps {
    deploymentState: DeploymentState;
    network: NetworkName;
    wallet: WalletState;
    logLines: LogLine[];
    onExecuteStep: (step: StepDefinition, paramValues: string[]) => Promise<void>;
    onApprovePatch: (stepId: string) => Promise<void>;
    onConnectMotoWallet: () => Promise<void>;
    onDisconnectWallet: () => void;
    isMotoConnecting: boolean;
    motoWallet: WalletState;
    motoConnectError: string | null;
    patchDiffs: Record<string, string>;
    propagationCountdowns: Record<string, number>;
}

function getStepStatus(
    step: StepDefinition,
    deploymentState: DeploymentState,
    currentlyExecutingId: string | null,
): StepStatus {
    if (deploymentState.completedSteps[step.id]) return 'completed';
    if (currentlyExecutingId === step.id) return 'executing';

    const allDepsComplete = step.dependencies.every(
        (depId) => deploymentState.completedSteps[depId],
    );

    if (allDepsComplete) return 'active';
    return 'pending';
}

function canExecuteStep(step: StepDefinition, deploymentState: DeploymentState): boolean {
    if (deploymentState.completedSteps[step.id]) return false;
    return step.dependencies.every((depId) => deploymentState.completedSteps[depId]);
}

/** Count completed steps in a phase */
function phaseProgress(phase: 1 | 2, deploymentState: DeploymentState): [number, number] {
    const steps = DEPLOYMENT_STEPS.filter((s) => s.phase === phase);
    const completed = steps.filter((s) => deploymentState.completedSteps[s.id]).length;
    return [completed, steps.length];
}

export function DeploymentWizard({
    deploymentState,
    network,
    wallet,
    logLines,
    onExecuteStep,
    onApprovePatch,
    onConnectMotoWallet,
    onDisconnectWallet,
    isMotoConnecting,
    motoWallet,
    motoConnectError,
    patchDiffs,
    propagationCountdowns,
}: DeploymentWizardProps): JSX.Element {
    const [executingStepId, setExecutingStepId] = useState<string | null>(null);

    const phase1Complete = deploymentState.phaseCompleted[1];
    const phase2Steps = DEPLOYMENT_STEPS.filter((s) => s.phase === 2);
    const [phase1Done, phase1Total] = phaseProgress(1, deploymentState);
    const [phase2Done, phase2Total] = phaseProgress(2, deploymentState);

    async function handleExecuteStep(step: StepDefinition, paramValues: string[]): Promise<void> {
        setExecutingStepId(step.id);
        try {
            await onExecuteStep(step, paramValues);
        } finally {
            setExecutingStepId(null);
        }
    }

    function getStepResult(stepId: string): StepResult | undefined {
        return deploymentState.stepResults[stepId];
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Phase 1: PILL Ecosystem */}
            <section>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.25rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: phase1Complete ? 'var(--success)' : 'var(--accent)',
                                flexShrink: 0,
                            }}
                        />
                        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
                            Phase 1: PILL Ecosystem
                        </h2>
                        <span className={`badge ${phase1Complete ? 'badge-completed' : 'badge-active'}`}>
                            {phase1Done}/{phase1Total}
                        </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        PILL Deployer Wallet
                    </span>
                </div>

                {/* Phase 1 progress bar */}
                <div
                    style={{
                        height: '3px',
                        background: 'var(--bg-elevated)',
                        borderRadius: '2px',
                        marginBottom: '1.25rem',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${phase1Total > 0 ? (phase1Done / phase1Total) * 100 : 0}%`,
                            background: phase1Complete ? 'var(--success)' : 'var(--accent)',
                            borderRadius: '2px',
                            transition: 'width 0.4s ease',
                        }}
                    />
                </div>

                {DEPLOYMENT_STEPS.filter((s) => s.phase === 1).map((step) => (
                    <StepCard
                        key={step.id}
                        step={step}
                        status={getStepStatus(step, deploymentState, executingStepId)}
                        result={getStepResult(step.id)}
                        wallet={wallet}
                        deploymentState={deploymentState}
                        network={network}
                        logLines={executingStepId === step.id ? logLines : []}
                        canExecute={canExecuteStep(step, deploymentState)}
                        onExecute={handleExecuteStep}
                        diffContent={patchDiffs[step.id]}
                        onApprovePatch={
                            step.type === 'PATCH'
                                ? (): Promise<void> => onApprovePatch(step.id)
                                : undefined
                        }
                        propagationCountdown={propagationCountdowns[step.id]}
                    />
                ))}
            </section>

            {/* Wallet Transition */}
            {phase1Complete && (
                <WalletTransition
                    pillWallet={wallet}
                    motoWallet={motoWallet}
                    onConnectMoto={onConnectMotoWallet}
                    onDisconnectPill={onDisconnectWallet}
                    isConnecting={isMotoConnecting}
                    error={motoConnectError}
                />
            )}

            {/* Phase 2: MOTO + MotoSwap + OP20 */}
            {(phase1Complete || phase2Steps.some((s) => deploymentState.completedSteps[s.id])) && (
                <section>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1.25rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: deploymentState.phaseCompleted[2]
                                        ? 'var(--success)'
                                        : 'var(--info)',
                                    flexShrink: 0,
                                }}
                            />
                            <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
                                Phase 2: MOTO + MotoSwap + OP20
                            </h2>
                            <span
                                className={`badge ${deploymentState.phaseCompleted[2] ? 'badge-completed' : 'badge-active'}`}
                            >
                                {phase2Done}/{phase2Total}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            MOTO Deployer Wallet
                        </span>
                    </div>

                    {/* Phase 2 progress bar */}
                    <div
                        style={{
                            height: '3px',
                            background: 'var(--bg-elevated)',
                            borderRadius: '2px',
                            marginBottom: '1.25rem',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${phase2Total > 0 ? (phase2Done / phase2Total) * 100 : 0}%`,
                                background: deploymentState.phaseCompleted[2]
                                    ? 'var(--success)'
                                    : 'var(--info)',
                                borderRadius: '2px',
                                transition: 'width 0.4s ease',
                            }}
                        />
                    </div>

                    {phase2Steps.map((step) => (
                        <StepCard
                            key={step.id}
                            step={step}
                            status={getStepStatus(step, deploymentState, executingStepId)}
                            result={getStepResult(step.id)}
                            wallet={motoWallet.isConnected ? motoWallet : wallet}
                            deploymentState={deploymentState}
                            network={network}
                            logLines={executingStepId === step.id ? logLines : []}
                            canExecute={
                                canExecuteStep(step, deploymentState) && motoWallet.isConnected
                            }
                            onExecute={handleExecuteStep}
                            diffContent={patchDiffs[step.id]}
                            onApprovePatch={
                                step.type === 'PATCH'
                                    ? (): Promise<void> => onApprovePatch(step.id)
                                    : undefined
                            }
                            propagationCountdown={propagationCountdowns[step.id]}
                        />
                    ))}
                </section>
            )}

            {/* Export Panel */}
            {Object.values(deploymentState.deployedAddresses).some(Boolean) && (
                <ExportPanel state={deploymentState} network={network} />
            )}
        </div>
    );
}
