import { useState } from 'react';
import type {
    DeploymentState,
    NetworkName,
    AdminFunctionDef,
    DeployedAddresses,
    WalletState,
} from '../lib/types';
import { ADMIN_CONTRACTS, getContractsByEcosystem } from '../lib/admin-functions';
import { ContractStatePanel } from './ContractStatePanel';
import { ABI_REGISTRY } from '../lib/abis';
import { getNetworkConfig } from '../lib/networks';
import { getContract, JSONRpcProvider } from 'opnet';
import { Address } from '@btc-vision/transaction';

type Ecosystem = 'PILL' | 'MOTO' | 'MotoSwap';

interface AdminDashboardProps {
    deploymentState: DeploymentState;
    wallet: WalletState;
    network: NetworkName;
}

/** Provider cache keyed by network name — avoids returning a wrong-network provider after network switch */
const adminProviders = new Map<string, JSONRpcProvider>();

function getAdminProvider(network: NetworkName): JSONRpcProvider {
    const config = getNetworkConfig(network);
    if (!adminProviders.has(network)) {
        adminProviders.set(network, new JSONRpcProvider({ url: config.rpcUrl, network: config.network }));
    }
    const cached = adminProviders.get(network);
    if (!cached) throw new Error(`Provider not found for network: ${network}`);
    return cached;
}

export function AdminDashboard({
    deploymentState,
    wallet,
    network,
}: AdminDashboardProps): JSX.Element {
    const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem>('PILL');

    const contracts = getContractsByEcosystem(selectedEcosystem);
    const addresses = deploymentState.deployedAddresses as DeployedAddresses & Record<string, string | undefined>;

    async function handleCallAdminFunction(
        funcDef: AdminFunctionDef,
        contractAddress: string,
        inputValues: string[],
    ): Promise<string> {
        if (!wallet.isConnected) throw new Error('Wallet not connected');

        const abi = ABI_REGISTRY[funcDef.abiName];
        if (!abi) throw new Error(`ABI not found: ${funcDef.abiName}`);

        const config = getNetworkConfig(network);
        const provider = getAdminProvider(network);
        const senderAddress = Address.fromString(wallet.hashedMLDSAKey, wallet.publicKey);

        const contract = getContract(contractAddress, abi, provider, config.network, senderAddress);

        const method = (contract as Record<string, unknown>)[funcDef.methodName];
        if (typeof method !== 'function') {
            throw new Error(`Method ${funcDef.methodName} not found on contract`);
        }

        // Convert input values to appropriate types
        const convertedInputs = inputValues.map((val, idx) => {
            const input = funcDef.inputs[idx];
            if (!input) return val;
            if (input.isBigInt) {
                return BigInt(val.trim());
            }
            if (input.typeHint === 'BOOL') {
                return val.trim() === 'true';
            }
            return val.trim();
        });

        // Simulate first
        const sim = await (method as (...args: unknown[]) => Promise<unknown>).apply(
            contract,
            convertedInputs,
        );

        if (sim && typeof sim === 'object' && 'error' in sim) {
            throw new Error(`Simulation failed: ${String((sim as { error: unknown }).error)}`);
        }

        // Send with null signers
        const receipt = await (sim as { sendTransaction: (opts: unknown) => Promise<unknown> }).sendTransaction({
            signer: null,
            mldsaSigner: null,
            refundTo: wallet.walletAddress,
            maximumAllowedSatToSpend: 120_000n,
            network: config.network,
        });

        const txHash =
            typeof receipt === 'string'
                ? receipt
                : (receipt as { txid?: string })?.txid ?? '';

        return txHash;
    }

    const ecosystems: Ecosystem[] = ['PILL', 'MOTO', 'MotoSwap'];
    const hasAnyAddress = ADMIN_CONTRACTS.some((c) => Boolean(addresses[c.addressKey]));

    if (!hasAnyAddress) {
        return (
            <div
                style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                }}
            >
                <p style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                    No deployed contracts found.
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                    Complete the deployment wizard first, or import a deployment state from JSON.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Ecosystem selector */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.25rem',
                    width: 'fit-content',
                }}
            >
                {ecosystems.map((eco) => (
                    <button
                        key={eco}
                        className={`btn btn-sm ${selectedEcosystem === eco ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={(): void => setSelectedEcosystem(eco)}
                    >
                        {eco}
                    </button>
                ))}
            </div>

            {/* Contracts in selected ecosystem */}
            {contracts.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No contracts defined for {selectedEcosystem}.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {contracts.map((contract) => {
                        const addr = addresses[contract.addressKey];
                        if (!addr) {
                            return (
                                <div
                                    key={contract.addressKey}
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.8125rem',
                                    }}
                                >
                                    <strong style={{ color: 'var(--text-secondary)' }}>
                                        {contract.name}
                                    </strong>{' '}
                                    — not yet deployed
                                </div>
                            );
                        }

                        return (
                            <ContractStatePanel
                                key={contract.addressKey}
                                contract={contract}
                                contractAddress={addr}
                                wallet={wallet}
                                network={network}
                                onCallAdminFunction={handleCallAdminFunction}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
