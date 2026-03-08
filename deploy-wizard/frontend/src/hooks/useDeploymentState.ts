import { useState, useCallback, useEffect, useRef } from 'react';
import type { DeploymentState, NetworkName, StepResult, DeployedAddresses, Phase } from '../lib/types';

const STORAGE_KEY_PREFIX = 'opnet-deploy-wizard-v1';

function storageKey(network: NetworkName): string {
    return `${STORAGE_KEY_PREFIX}-${network}`;
}

function createInitialState(network: NetworkName): DeploymentState {
    return {
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        network,
        completedSteps: {},
        stepResults: {},
        deployedAddresses: {},
        phaseCompleted: { 1: false, 2: false },
    };
}

/**
 * Persistent deployment state with localStorage + server sync.
 * On load, detects existing state and offers to resume.
 */
export function useDeploymentState(
    network: NetworkName,
    saveToServer: (step: string, data: unknown) => Promise<void>,
): {
    state: DeploymentState;
    hasExistingState: boolean;
    isLoaded: boolean;
    resumeFromSaved: () => void;
    startFresh: () => void;
    markStepCompleted: (stepId: string, result: StepResult) => void;
    saveDeployedAddress: (key: keyof DeployedAddresses, address: string) => void;
    saveWalletAddress: (phase: Phase, address: string) => void;
    markPhaseCompleted: (phase: Phase) => void;
    resetState: () => void;
} {
    const [state, setState] = useState<DeploymentState>(() => createInitialState(network));
    const [hasExistingState, setHasExistingState] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [savedState, setSavedState] = useState<DeploymentState | null>(null);
    const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load from localStorage on mount
    useEffect((): void => {
        const key = storageKey(network);
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as DeploymentState;
                const hasSteps = Object.keys(parsed.completedSteps).length > 0;
                if (hasSteps) {
                    setSavedState(parsed);
                    setHasExistingState(true);
                } else {
                    setIsLoaded(true);
                }
            } catch {
                setIsLoaded(true);
            }
        } else {
            setIsLoaded(true);
        }
    }, [network]);

    const persistToStorage = useCallback(
        (newState: DeploymentState): void => {
            try {
                localStorage.setItem(storageKey(network), JSON.stringify(newState));
            } catch {
                // localStorage full or unavailable — non-fatal
            }
        },
        [network],
    );

    const debouncedServerSave = useCallback(
        (stepId: string, result: StepResult): void => {
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current);
            }
            saveDebounceRef.current = setTimeout((): void => {
                saveToServer(stepId, result).catch(() => {
                    // Non-fatal: server may be temporarily unavailable
                });
            }, 500);
        },
        [saveToServer],
    );

    const resumeFromSaved = useCallback((): void => {
        if (savedState) {
            setState(savedState);
        }
        setIsLoaded(true);
        setHasExistingState(false);
    }, [savedState]);

    const startFresh = useCallback((): void => {
        const fresh = createInitialState(network);
        setState(fresh);
        persistToStorage(fresh);
        setIsLoaded(true);
        setHasExistingState(false);
        setSavedState(null);
    }, [network, persistToStorage]);

    const markStepCompleted = useCallback(
        (stepId: string, result: StepResult): void => {
            setState((prev): DeploymentState => {
                const next: DeploymentState = {
                    ...prev,
                    updatedAt: new Date().toISOString(),
                    completedSteps: { ...prev.completedSteps, [stepId]: true },
                    stepResults: { ...prev.stepResults, [stepId]: result },
                };
                persistToStorage(next);
                return next;
            });
            debouncedServerSave(stepId, result);
        },
        [persistToStorage, debouncedServerSave],
    );

    const saveDeployedAddress = useCallback(
        (key: keyof DeployedAddresses, address: string): void => {
            setState((prev): DeploymentState => {
                const next: DeploymentState = {
                    ...prev,
                    updatedAt: new Date().toISOString(),
                    deployedAddresses: { ...prev.deployedAddresses, [key]: address },
                };
                persistToStorage(next);
                return next;
            });
        },
        [persistToStorage],
    );

    const saveWalletAddress = useCallback(
        (phase: Phase, address: string): void => {
            setState((prev): DeploymentState => {
                const next: DeploymentState = {
                    ...prev,
                    updatedAt: new Date().toISOString(),
                    ...(phase === 1 ? { pillWalletAddress: address } : { motoWalletAddress: address }),
                };
                persistToStorage(next);
                return next;
            });
        },
        [persistToStorage],
    );

    const markPhaseCompleted = useCallback(
        (phase: Phase): void => {
            setState((prev): DeploymentState => {
                const next: DeploymentState = {
                    ...prev,
                    updatedAt: new Date().toISOString(),
                    phaseCompleted: { ...prev.phaseCompleted, [phase]: true },
                };
                persistToStorage(next);
                return next;
            });
        },
        [persistToStorage],
    );

    const resetState = useCallback((): void => {
        const fresh = createInitialState(network);
        setState(fresh);
        persistToStorage(fresh);
        setSavedState(null);
        setHasExistingState(false);
    }, [network, persistToStorage]);

    return {
        state,
        hasExistingState,
        isLoaded,
        resumeFromSaved,
        startFresh,
        markStepCompleted,
        saveDeployedAddress,
        saveWalletAddress,
        markPhaseCompleted,
        resetState,
    };
}
