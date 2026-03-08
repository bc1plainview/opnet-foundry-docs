import { useState, useCallback, useEffect, useRef } from 'react';
import { Address } from 'opnet';
import { NetworkSelector } from './components/NetworkSelector';
import { WalletPanel } from './components/WalletPanel';
import { DeploymentWizard } from './components/DeploymentWizard';
import { AdminDashboard } from './components/AdminDashboard';
import { useWalletConnectHook } from './hooks/useWalletConnect';
import { useDeploymentState } from './hooks/useDeploymentState';
import { useServerConnection } from './hooks/useServerConnection';
import { useTransactionFactory } from './hooks/useTransactionFactory';
import type { NetworkName, StepDefinition, WalletState } from './lib/types';
import { ABI_REGISTRY } from './lib/abis';
import type { CallResult, BuildResult, PatchResult } from './lib/types';

type Tab = 'deploy' | 'admin';

const DEFAULT_NETWORK: NetworkName = 'testnet';

export default function App(): JSX.Element {
    const [network, setNetwork] = useState<NetworkName>(DEFAULT_NETWORK);
    const [tab, setTab] = useState<Tab>('deploy');
    const [patchDiffs, setPatchDiffs] = useState<Record<string, string>>({});
    const [propagationCountdowns, setPropagationCountdowns] = useState<Record<string, number>>({});

    // Wallet 1 (PILL phase)
    const {
        wallet: pillWallet,
        connect: connectPill,
        disconnect: disconnectPill,
        setDeployerPhase: setPillPhase,
        isConnecting: isPillConnecting,
        error: pillError,
    } = useWalletConnectHook(network);

    // Wallet 2 (MOTO phase) — uses a separate walletconnect instance conceptually
    // In practice the same hook is used, with phase tracking
    const {
        wallet: motoWallet,
        connect: connectMoto,
        disconnect: disconnectMoto,
        setDeployerPhase: setMotoPhase,
        isConnecting: isMotoConnecting,
        error: motoError,
    } = useWalletConnectHook(network);

    const { saveState, fetchWasm, triggerBuild, sendPatch, approvePatch, logLines } =
        useServerConnection();

    const { deployContract, callContract } = useTransactionFactory(network);

    const {
        state: deploymentState,
        hasExistingState,
        isLoaded,
        resumeFromSaved,
        startFresh,
        markStepCompleted,
        saveDeployedAddress,
        saveWalletAddress,
    } = useDeploymentState(network, saveState);

    const countdownTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

    // Set phase labels on wallets when connected
    useEffect((): void => {
        if (pillWallet.isConnected) {
            setPillPhase(1);
            saveWalletAddress(1, pillWallet.walletAddress);
        }
    }, [pillWallet.isConnected, pillWallet.walletAddress, setPillPhase, saveWalletAddress]);

    useEffect((): void => {
        if (motoWallet.isConnected) {
            setMotoPhase(2);
            saveWalletAddress(2, motoWallet.walletAddress);
        }
    }, [motoWallet.isConnected, motoWallet.walletAddress, setMotoPhase, saveWalletAddress]);

    // Start propagation countdown for a step
    function startPropagationCountdown(stepId: string, seconds: number): void {
        setPropagationCountdowns((prev) => ({ ...prev, [stepId]: seconds }));

        if (countdownTimers.current[stepId]) {
            clearInterval(countdownTimers.current[stepId]);
        }

        countdownTimers.current[stepId] = setInterval((): void => {
            setPropagationCountdowns((prev) => {
                const current = prev[stepId] ?? 0;
                if (current <= 1) {
                    clearInterval(countdownTimers.current[stepId]);
                    return Object.fromEntries(
                        Object.entries(prev).filter(([k]) => k !== stepId),
                    );
                }
                return { ...prev, [stepId]: current - 1 };
            });
        }, 1000);
    }

    const handleExecuteStep = useCallback(
        async (step: StepDefinition, paramValues: string[]): Promise<void> => {
            const activeWallet: WalletState =
                step.phase === 2 && motoWallet.isConnected ? motoWallet : pillWallet;

            if (!activeWallet.isConnected) {
                throw new Error('Wallet not connected');
            }

            if (step.type === 'BUILD') {
                const buildRes = await triggerBuild(step.repo, step.repo);
                const result: BuildResult = {
                    success: buildRes.success,
                    logTail: '',
                    builtAt: new Date().toISOString(),
                };
                markStepCompleted(step.id, result);
                return;
            }

            if (step.type === 'DEPLOY') {
                if (!step.wasmFile) throw new Error(`No WASM file defined for step ${step.id}`);

                const wasmFile = await fetchWasm(step.repo, step.wasmFile);

                const ownerAddress =
                    step.ownerCalldata
                        ? Address.fromString(activeWallet.hashedMLDSAKey, activeWallet.publicKey)
                        : null;

                const deployResult = await deployContract({
                    wasmBytes: wasmFile.bytes,
                    ownerAddress,
                    refundTo: activeWallet.walletAddress,
                });

                if (step.savesAddressAs) {
                    saveDeployedAddress(
                        step.savesAddressAs as keyof typeof deploymentState.deployedAddresses,
                        deployResult.pubKey,
                    );
                }

                markStepCompleted(step.id, deployResult);

                // Start propagation countdown
                if (step.propagationWaitSeconds) {
                    startPropagationCountdown(step.id, step.propagationWaitSeconds);
                }

                return;
            }

            if (step.type === 'CALL') {
                if (!step.contractAddressKey) throw new Error(`No contract address key for step ${step.id}`);
                if (!step.abiName || !step.methodName) throw new Error(`No ABI or method for step ${step.id}`);

                const addrs = deploymentState.deployedAddresses as Record<string, string | undefined>;
                const contractAddress = addrs[step.contractAddressKey];
                if (!contractAddress) {
                    throw new Error(`Contract address not found for key: ${step.contractAddressKey}`);
                }

                const abi = ABI_REGISTRY[step.abiName];
                if (!abi) throw new Error(`ABI not found: ${step.abiName}`);

                const senderAddress = Address.fromString(
                    activeWallet.hashedMLDSAKey,
                    activeWallet.publicKey,
                );

                // Convert param values to correct types
                const args = (step.params ?? []).map((param, idx) => {
                    const val = paramValues[idx] ?? '';
                    // Array params
                    if (param.typeHint.includes('[]') || val === '[]') {
                        return [];
                    }
                    // BigInt params
                    if (
                        param.typeHint.includes('UINT') ||
                        typeof param.staticValue === 'bigint'
                    ) {
                        try {
                            return BigInt(val);
                        } catch {
                            return 0n;
                        }
                    }
                    // Address params — resolve via Address.fromString
                    if (param.typeHint.includes('ADDRESS') && val.startsWith('0x')) {
                        try {
                            return Address.fromString(val);
                        } catch {
                            return val;
                        }
                    }
                    return val;
                });

                const callResult: CallResult = await callContract({
                    contractAddress,
                    abi,
                    methodName: step.methodName,
                    args,
                    refundTo: activeWallet.walletAddress,
                    senderAddress,
                });

                markStepCompleted(step.id, callResult);
                return;
            }

            if (step.type === 'PATCH') {
                if (!step.patchTarget) throw new Error(`No patch target for step ${step.id}`);

                // Build the pubkeys object from deployment state
                const pubkeys: Record<string, string> = {};
                const addrs = deploymentState.deployedAddresses as Record<string, string | undefined>;

                if (step.patchTarget === 'motochef-factory') {
                    if (addrs['deployableOP20Template']) {
                        pubkeys['tokenTemplate'] = addrs['deployableOP20Template'];
                    }
                    if (addrs['templateMotoChef']) {
                        pubkeys['chefTemplate'] = addrs['templateMotoChef'];
                    }
                } else if (step.patchTarget === 'motoswap-factory') {
                    if (addrs['motoSwapPoolTemplate']) {
                        pubkeys['poolTemplate'] = addrs['motoSwapPoolTemplate'];
                    }
                } else if (step.patchTarget === 'motoswap-router') {
                    if (addrs['motoSwapFactory']) {
                        pubkeys['factory'] = addrs['motoSwapFactory'];
                    }
                }

                const patchResponse = await sendPatch(step.patchTarget, pubkeys);
                setPatchDiffs((prev) => ({ ...prev, [step.id]: patchResponse.diff }));

                // Don't mark as complete yet — user must approve the diff
                return;
            }
        },
        [
            pillWallet,
            motoWallet,
            triggerBuild,
            fetchWasm,
            deployContract,
            callContract,
            deploymentState.deployedAddresses,
            markStepCompleted,
            saveDeployedAddress,
        ],
    );

    const handleApprovePatch = useCallback(
        async (stepId: string): Promise<void> => {
            const step = (await import('./lib/steps')).getStepById(stepId);
            if (!step?.patchTarget) throw new Error(`No patch target for step ${stepId}`);

            await approvePatch(step.patchTarget);

            const result: PatchResult = {
                diff: patchDiffs[stepId] ?? '',
                approved: true,
                patchedAt: new Date().toISOString(),
            };
            markStepCompleted(stepId, result);
            setPatchDiffs((prev) =>
                Object.fromEntries(
                    Object.entries(prev).filter(([k]) => k !== stepId),
                ),
            );
        },
        [approvePatch, patchDiffs, markStepCompleted],
    );

    // Resume prompt
    if (!isLoaded) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div className="card" style={{ padding: '2rem', maxWidth: '480px', width: '100%' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="skeleton skeleton-block"
                                style={{ height: '2rem', opacity: 1 - i * 0.2 }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (hasExistingState) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                <div className="card-elevated fade-in" style={{ padding: '2rem', maxWidth: '480px', width: '100%' }}>
                    <h2 style={{ marginBottom: '0.75rem' }}>Resume Deployment?</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        An existing deployment session was found for {network}. Would you like to
                        resume from where you left off?
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary" onClick={resumeFromSaved}>
                            Resume
                        </button>
                        <button className="btn btn-secondary" onClick={startFresh}>
                            Start Fresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header
                style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(10,10,15,0.8)',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div
                    className="container"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.875rem 1.5rem',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Logo / title */}
                    <div>
                        <div
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: 'var(--accent)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            OPNet Deploy Wizard
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            MOTO · PILL · MotoSwap
                        </div>
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Network selector */}
                    <NetworkSelector
                        network={network}
                        onChange={(n): void => setNetwork(n)}
                        disabled={Object.keys(deploymentState.completedSteps).length > 0}
                    />

                    {/* Wallet panel */}
                    <WalletPanel
                        wallet={pillWallet.isConnected ? pillWallet : motoWallet}
                        onConnect={connectPill}
                        onDisconnect={pillWallet.isConnected ? disconnectPill : disconnectMoto}
                        isConnecting={isPillConnecting}
                        error={pillError ?? motoError}
                        network={network}
                    />
                </div>

                {/* Tab nav */}
                <div
                    className="container"
                    style={{
                        display: 'flex',
                        gap: '0',
                        paddingTop: 0,
                        paddingBottom: 0,
                        borderTop: '1px solid var(--border-subtle)',
                    }}
                >
                    {(['deploy', 'admin'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={(): void => setTab(t)}
                            style={{
                                padding: '0.625rem 1rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: '0.875rem',
                                fontWeight: tab === t ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'color 0.15s ease, border-color 0.15s ease',
                                textTransform: 'capitalize',
                            }}
                        >
                            {t === 'deploy' ? 'Deployment Wizard' : 'Admin Panel'}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main content */}
            <main className="container" style={{ flex: 1, padding: '2rem 1.5rem' }}>
                {tab === 'deploy' ? (
                    <DeploymentWizard
                        deploymentState={deploymentState}
                        network={network}
                        wallet={pillWallet}
                        logLines={logLines}
                        onExecuteStep={handleExecuteStep}
                        onApprovePatch={handleApprovePatch}
                        onConnectMotoWallet={connectMoto}
                        onDisconnectWallet={disconnectPill}
                        isMotoConnecting={isMotoConnecting}
                        motoWallet={motoWallet}
                        motoConnectError={motoError}
                        patchDiffs={patchDiffs}
                        propagationCountdowns={propagationCountdowns}
                    />
                ) : (
                    <AdminDashboard
                        deploymentState={deploymentState}
                        wallet={pillWallet.isConnected ? pillWallet : motoWallet}
                        network={network}
                    />
                )}
            </main>

            {/* Footer */}
            <footer
                style={{
                    borderTop: '1px solid var(--border-subtle)',
                    padding: '1rem 1.5rem',
                    textAlign: 'center',
                }}
            >
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    OPNet Deploy Wizard — Keys never leave your browser. Server handles filesystem only.
                </p>
            </footer>
        </div>
    );
}
