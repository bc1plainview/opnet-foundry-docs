import { useState, useCallback, useEffect } from 'react';
import { getContract, JSONRpcProvider } from 'opnet';
import { Address } from '@btc-vision/transaction';
import type { BitcoinInterfaceAbi } from 'opnet';
import type { NetworkName, AdminStateField } from '../lib/types';
import { getNetworkConfig } from '../lib/networks';

/** On-chain state values keyed by method name */
export type ContractStateValues = Record<string, string | null>;

/** Provider cache keyed by network name — avoids returning a wrong-network provider after network switch */
const readProviders = new Map<string, JSONRpcProvider>();

function getReadProvider(network: NetworkName): JSONRpcProvider {
    const config = getNetworkConfig(network);
    if (!readProviders.has(network)) {
        readProviders.set(network, new JSONRpcProvider({ url: config.rpcUrl, network: config.network }));
    }
    const cached = readProviders.get(network);
    if (!cached) throw new Error(`Provider not found for network: ${network}`);
    return cached;
}

function formatStateValue(
    value: unknown,
    format: AdminStateField['format'],
    decimals?: number,
): string {
    if (value === null || value === undefined) return '--';

    if (format === 'bigint' && typeof value === 'bigint') {
        if (decimals) {
            const divisor = 10n ** BigInt(decimals);
            const whole = value / divisor;
            const fraction = value % divisor;
            const fracStr = fraction.toString().padStart(decimals, '0').slice(0, 6);
            return `${whole.toString()}.${fracStr}`;
        }
        return value.toString();
    }

    if (format === 'address') {
        const str = typeof value === 'string' ? value : String(value);
        if (str.length > 16) {
            return `${str.slice(0, 10)}...${str.slice(-8)}`;
        }
        return str;
    }

    if (format === 'boolean') {
        return Boolean(value) ? 'true' : 'false';
    }

    return String(value);
}

/**
 * Hook to fetch and cache on-chain state for a deployed contract.
 * Auto-refreshes every 30 seconds.
 */
export function useContractState(
    contractAddress: string | undefined,
    abi: BitcoinInterfaceAbi,
    stateFields: AdminStateField[],
    network: NetworkName,
): {
    values: ContractStateValues;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
} {
    const [values, setValues] = useState<ContractStateValues>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchState = useCallback(async (): Promise<void> => {
        if (!contractAddress) return;

        setIsLoading(true);
        setError(null);

        try {
            const provider = getReadProvider(network);
            const config = getNetworkConfig(network);

            // Use a dummy address for read-only calls — two params required: (hashedMLDSAKey, tweakedPubKey)
            const dummySender = Address.fromString(
                '0x0000000000000000000000000000000000000000000000000000000000000001',
                '0x0000000000000000000000000000000000000000000000000000000000000001',
            );

            const contract = getContract(
                contractAddress,
                abi,
                provider,
                config.network,
                dummySender,
            );

            const newValues: ContractStateValues = {};

            for (const field of stateFields) {
                try {
                    const method = (contract as Record<string, unknown>)[field.method];
                    if (typeof method !== 'function') {
                        newValues[field.method] = null;
                        continue;
                    }

                    const result = await (method as () => Promise<unknown>).call(contract);

                    if (result && typeof result === 'object' && 'error' in result) {
                        newValues[field.method] = null;
                    } else if (result && typeof result === 'object' && 'decoded' in result) {
                        const decoded = (result as { decoded: unknown }).decoded;
                        newValues[field.method] = formatStateValue(decoded, field.format, field.decimals);
                    } else {
                        newValues[field.method] = formatStateValue(result, field.format, field.decimals);
                    }
                } catch {
                    newValues[field.method] = null;
                }
            }

            setValues(newValues);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch contract state');
        } finally {
            setIsLoading(false);
        }
    }, [contractAddress, abi, stateFields, network]);

    // Initial fetch and auto-refresh every 30 seconds
    useEffect((): (() => void) => {
        void fetchState();
        const interval = setInterval((): void => {
            void fetchState();
        }, 30_000);
        return (): void => clearInterval(interval);
    }, [fetchState]);

    return { values, isLoading, error, refresh: (): void => { void fetchState(); } };
}
