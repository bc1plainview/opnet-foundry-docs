import { useState, useCallback, useEffect } from 'react';
import { useWalletConnect as useWC, SupportedWallets } from '@btc-vision/walletconnect';
import { JSONRpcProvider } from 'opnet';
import type { Phase, WalletState } from '../lib/types';
import { getNetworkConfig } from '../lib/networks';
import type { NetworkName } from '../lib/types';

const DEFAULT_WALLET_STATE: WalletState = {
    isConnected: false,
    walletAddress: '',
    hashedMLDSAKey: '',
    publicKey: '',
    balanceSats: 0n,
    deployerPhase: null,
};

/**
 * Single-wallet connection hook wrapping @btc-vision/walletconnect.
 * One wallet connected at a time. Phase label is set externally based on
 * which deployment phase is active.
 */
export function useWalletConnectHook(network: NetworkName): {
    wallet: WalletState;
    connect: () => Promise<void>;
    disconnect: () => void;
    setDeployerPhase: (phase: Phase | null) => void;
    isConnecting: boolean;
    error: string | null;
} {
    const {
        isConnected,
        address: walletAddress,
        publicKey,
        hashedMLDSAKey,
        connectToWallet,
        disconnect: wcDisconnect,
    } = useWC();

    const [balanceSats, setBalanceSats] = useState<bigint>(0n);
    const [deployerPhase, setDeployerPhase] = useState<Phase | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch balance after connecting
    useEffect((): void => {
        if (!isConnected || !walletAddress) {
            setBalanceSats(0n);
            return;
        }

        const config = getNetworkConfig(network);
        const provider = new JSONRpcProvider({ url: config.rpcUrl, network: config.network });

        provider
            .getBalance(walletAddress)
            .then((balance: bigint) => {
                setBalanceSats(balance);
            })
            .catch(() => {
                setBalanceSats(0n);
            });
    }, [isConnected, walletAddress, network]);

    const connect = useCallback(async (): Promise<void> => {
        setError(null);
        setIsConnecting(true);
        try {
            await connectToWallet(SupportedWallets.OP_WALLET);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(msg);
        } finally {
            setIsConnecting(false);
        }
    }, [connectToWallet]);

    const disconnect = useCallback((): void => {
        wcDisconnect();
        setBalanceSats(0n);
        setDeployerPhase(null);
        setError(null);
    }, [wcDisconnect]);

    const wallet: WalletState = {
        isConnected: Boolean(isConnected),
        walletAddress: walletAddress ?? '',
        hashedMLDSAKey: hashedMLDSAKey ?? '',
        publicKey: publicKey ?? '',
        balanceSats,
        deployerPhase,
    };

    return { wallet, connect, disconnect, setDeployerPhase, isConnecting, error };
}
