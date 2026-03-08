import type { AdminContractEntry, AdminFunctionDef, NetworkName, WalletState } from '../lib/types';
import { StateGrid } from './StateGrid';
import { AdminFunctionCard } from './AdminFunctionCard';
import { useContractState } from '../hooks/useContractState';
import { getOpscanUrl } from '../lib/explorer';
import { ABI_REGISTRY } from '../lib/abis';

interface ContractStatePanelProps {
    contract: AdminContractEntry;
    contractAddress: string;
    wallet: WalletState;
    network: NetworkName;
    onCallAdminFunction: (
        funcDef: AdminFunctionDef,
        contractAddress: string,
        inputValues: string[],
    ) => Promise<string>;
}

function truncate(str: string, maxLen = 20): string {
    if (str.length <= maxLen) return str;
    return `${str.slice(0, 10)}...${str.slice(-8)}`;
}

export function ContractStatePanel({
    contract,
    contractAddress,
    wallet,
    network,
    onCallAdminFunction,
}: ContractStatePanelProps): JSX.Element {
    const abi = ABI_REGISTRY[contract.stateAbiName];
    const { values, isLoading, error, refresh } = useContractState(
        contractAddress,
        abi ?? [],
        contract.stateFields,
        network,
    );

    const opscanUrl = getOpscanUrl(contractAddress, network);

    return (
        <div
            className="card-elevated"
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
            {/* Contract header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{contract.name}</h3>
                    <a
                        href={opscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="monospace"
                        style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}
                        title={contractAddress}
                    >
                        {truncate(contractAddress, 24)}
                    </a>
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={refresh}
                    disabled={isLoading}
                    title="Refresh state"
                >
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--danger-dim)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        color: 'var(--danger)',
                    }}
                >
                    {error}
                </div>
            )}

            {/* State grid */}
            {contract.stateFields.length > 0 && (
                <StateGrid
                    fields={contract.stateFields}
                    values={values}
                    isLoading={isLoading}
                />
            )}

            {/* Admin functions */}
            {contract.adminFunctions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div
                        style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            paddingTop: '0.25rem',
                            borderTop: '1px solid var(--border-subtle)',
                        }}
                    >
                        Admin Functions
                    </div>
                    {contract.adminFunctions.map((funcDef) => (
                        <AdminFunctionCard
                            key={funcDef.methodName}
                            funcDef={funcDef}
                            contractAddress={contractAddress}
                            wallet={wallet}
                            network={network}
                            currentValue={
                                funcDef.currentValueMethod
                                    ? values[funcDef.currentValueMethod]
                                    : undefined
                            }
                            onCall={(def, inputs): Promise<string> =>
                                onCallAdminFunction(def, contractAddress, inputs)
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
