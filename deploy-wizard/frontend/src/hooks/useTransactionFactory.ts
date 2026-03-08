import { useCallback } from 'react';
import { getContract, JSONRpcProvider } from 'opnet';
import { Address, TransactionFactory } from '@btc-vision/transaction';
import type { IDeploymentParameters } from '@btc-vision/transaction';
import type { BitcoinInterfaceAbi } from 'opnet';
import type { NetworkName, DeployResult, CallResult } from '../lib/types';
import { getNetworkConfig } from '../lib/networks';
import { buildOwnerCalldata } from '../lib/calldata';

/** UTXO shape — use any-compatible type since opnet types aren't installed yet */
// TODO: Replace with proper UTXO type from opnet once packages are installed
type UTXO = {
    txId: string;
    outputIndex: number;
    value: bigint;
    scriptPubKey: string;
};

export interface DeploymentParams {
    wasmBytes: Uint8Array;
    ownerAddress: Address | null;
    feeRate?: number;
    gasSatFee?: bigint;
    /** UTXOs to use (fetched from provider). If null, auto-fetched. */
    utxos?: UTXO[];
    /** Refund address (bech32) */
    refundTo: string;
}

export interface ContractCallParams {
    contractAddress: string;
    abi: BitcoinInterfaceAbi;
    methodName: string;
    /** Arguments to pass to the method */
    args: unknown[];
    refundTo: string;
    maximumAllowedSatToSpend?: bigint;
    feeRate?: number;
    /** Sender OPNet address */
    senderAddress: Address;
}

/** Singleton provider cache */
const providerCache = new Map<string, JSONRpcProvider>();

function getProvider(network: NetworkName): JSONRpcProvider {
    const config = getNetworkConfig(network);
    const key = config.name;
    if (!providerCache.has(key)) {
        providerCache.set(key, new JSONRpcProvider({ url: config.rpcUrl, network: config.network }));
    }
    const cached = providerCache.get(key);
    if (!cached) throw new Error(`Provider not found for network: ${key}`);
    return cached;
}

/** Contract instance cache keyed by address+network+sender */
const contractCache = new Map<string, ReturnType<typeof getContract>>();

function getCachedContract(
    address: string,
    abi: BitcoinInterfaceAbi,
    provider: JSONRpcProvider,
    network: NetworkName,
    sender: Address,
): ReturnType<typeof getContract> {
    const config = getNetworkConfig(network);
    const key = `${address}-${config.name}-${sender.toHex()}`;
    if (!contractCache.has(key)) {
        contractCache.set(
            key,
            getContract(address, abi, provider, config.network, sender),
        );
    }
    const cached = contractCache.get(key);
    if (!cached) throw new Error(`Contract not found in cache for key: ${key}`);
    // Update sender without recreating
    (cached as { setSender?: (s: Address) => void }).setSender?.(sender);
    return cached;
}

/**
 * Hook providing deploy + contract-call transaction building.
 *
 * For DEPLOY: uses TransactionFactory.signDeployment() with signer=null (OP_WALLET signs).
 * For CALL: getContract -> simulate -> sendTransaction with signer=null, mldsaSigner=null.
 */
export function useTransactionFactory(network: NetworkName): {
    deployContract: (params: DeploymentParams) => Promise<DeployResult>;
    callContract: (params: ContractCallParams) => Promise<CallResult>;
    fetchUTXOs: (address: string) => Promise<UTXO[]>;
} {
    const config = getNetworkConfig(network);

    const fetchUTXOs = useCallback(
        async (address: string): Promise<UTXO[]> => {
            const provider = getProvider(network);
            const result = await provider.utxoManager.getUTXOs({
                address,
                optimize: false, // ALWAYS false — optimize:true filters UTXOs
            });
            return result as unknown as UTXO[];
        },
        [network],
    );

    const deployContract = useCallback(
        async (params: DeploymentParams): Promise<DeployResult> => {
            const provider = getProvider(network);
            const factory = new TransactionFactory();

            // Fetch UTXOs if not provided
            const utxos =
                params.utxos ??
                ((await provider.utxoManager.getUTXOs({
                    address: params.refundTo,
                    optimize: false,
                })) as unknown as UTXO[]);

            // Build owner calldata if required
            const calldata =
                params.ownerAddress ? buildOwnerCalldata(params.ownerAddress) : undefined;

            // Get live fee rate if not provided
            let feeRate = params.feeRate ?? config.defaultFeeRate;
            if (!feeRate || feeRate === 0) {
                try {
                    const gasParams = await provider.gasParameters();
                    feeRate = gasParams.bitcoin?.recommended?.medium ?? 25;
                } catch {
                    if (config.name === 'mainnet') {
                        throw new Error('Failed to fetch live fee rate. Cannot proceed on mainnet without current fee data.');
                    }
                    feeRate = 25; // testnet fallback is acceptable
                }
            }

            // Deploy with WithoutSigner params — OP_WALLET extension handles signing
            // signer and mldsaSigner are intentionally null: the OP_WALLET browser extension
            // handles all signing. Passing null satisfies the WithoutSigner variant of IDeploymentParameters.
            const deployParams = {
                signer: null,
                mldsaSigner: null,
                wasm: params.wasmBytes,
                network: config.network,
                utxos,
                calldata,
                feeRate,
                gasSatFee: params.gasSatFee ?? 10_000n,
                priorityFee: 0n,
                refundTo: params.refundTo,
                linkMLDSAPublicKeyToAddress: true,
                revealMLDSAPublicKey: true,
            };
            // signer/mldsaSigner null: OP_WALLET browser extension handles signing (WithoutSigner variant)
            const result = await factory.signDeployment(deployParams as IDeploymentParameters);

            // Broadcast both transactions
            const fundingTxHash = await provider.sendRawTransaction(
                result.fundingTransaction,
                false,
            );
            const deployTxHash = await provider.sendRawTransaction(
                result.deployTransaction,
                false,
            );

            const pubKey =
                typeof result.contractAddress === 'string'
                    ? result.contractAddress
                    : result.contractAddress?.toHex?.() ?? '';

            return {
                pubKey,
                fundingTxHash: typeof fundingTxHash === 'string' ? fundingTxHash : fundingTxHash?.txid ?? '',
                deployTxHash: typeof deployTxHash === 'string' ? deployTxHash : deployTxHash?.txid ?? '',
                deployedAt: new Date().toISOString(),
                network,
            };
        },
        [network, config],
    );

    const callContract = useCallback(
        async (params: ContractCallParams): Promise<CallResult> => {
            const provider = getProvider(network);

            const contract = getCachedContract(
                params.contractAddress,
                params.abi,
                provider,
                network,
                params.senderAddress,
            );

            // Get the method and simulate
            const method = (contract as Record<string, unknown>)[params.methodName];
            if (typeof method !== 'function') {
                throw new Error(`Method ${params.methodName} not found on contract`);
            }

            const sim = await (method as (...args: unknown[]) => Promise<unknown>).apply(
                contract,
                params.args,
            );

            // Check for simulation error
            if (sim && typeof sim === 'object' && 'error' in sim) {
                throw new Error(`Simulation failed: ${String((sim as { error: unknown }).error)}`);
            }

            // Get live fee rate
            let feeRate = params.feeRate ?? config.defaultFeeRate;
            if (!feeRate || feeRate === 0) {
                try {
                    const gasParams = await provider.gasParameters();
                    feeRate = gasParams.bitcoin?.recommended?.medium ?? 25;
                } catch {
                    if (config.name === 'mainnet') {
                        throw new Error('Failed to fetch live fee rate. Cannot proceed on mainnet without current fee data.');
                    }
                    feeRate = 25; // testnet fallback is acceptable
                }
            }

            // Send with null signers — wallet handles signing
            const receipt = await (sim as { sendTransaction: (opts: unknown) => Promise<unknown> }).sendTransaction({
                signer: null,
                mldsaSigner: null,
                refundTo: params.refundTo,
                maximumAllowedSatToSpend: params.maximumAllowedSatToSpend ?? 120_000n,
                feeRate,
                network: config.network,
            });

            const txHash =
                typeof receipt === 'string'
                    ? receipt
                    : (receipt as { txid?: string })?.txid ?? '';

            return {
                txHash,
                calledAt: new Date().toISOString(),
                network,
            };
        },
        [network, config],
    );

    return { deployContract, callContract, fetchUTXOs };
}
