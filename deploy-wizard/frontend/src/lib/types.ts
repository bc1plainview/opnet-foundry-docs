/** Shared TypeScript types for the OPNet Deploy Wizard frontend */

/** Step operation types */
export type StepType = 'BUILD' | 'DEPLOY' | 'PATCH' | 'CALL';

/** Deployment phases */
export type Phase = 1 | 2;

/** Step execution states */
export type StepStatus = 'pending' | 'active' | 'executing' | 'completed' | 'failed';

/** OPNet network selection */
export type NetworkName = 'testnet' | 'mainnet';

/** A parameter for a contract call step */
export interface CallParam {
    /** Display name for the parameter */
    name: string;
    /** Human-readable description */
    description: string;
    /** Type hint displayed in the UI */
    typeHint: string;
    /**
     * Static value if known at definition time.
     * If omitted, will be resolved from deployment state at runtime.
     */
    staticValue?: string | bigint | readonly bigint[] | readonly string[];
    /**
     * Key in DeploymentState.deployedAddresses to pull address from.
     * Used when the param depends on a previous step result.
     */
    fromDeployedAddress?: string;
    /**
     * If true, value comes from the connected wallet's address (P2TR bech32)
     */
    fromWalletAddress?: boolean;
    /**
     * If true, value comes from the connected wallet's OPNet public key (hashedMLDSAKey)
     */
    fromWalletPubKey?: boolean;
    /** Whether this value is editable in the UI */
    editable?: boolean;
}

/** A single deployment step definition */
export interface StepDefinition {
    /** Unique step ID (e.g., "pill-token-deploy") */
    id: string;
    /** Display step number */
    stepNumber: number;
    /** Which wallet phase this step belongs to */
    phase: Phase;
    /** Operation type */
    type: StepType;
    /** Short display name */
    name: string;
    /** Detailed description shown in the card */
    description: string;
    /** Which repository to build/deploy from */
    repo: string;
    /** WASM file to deploy (for DEPLOY steps), relative to repo build/ dir */
    wasmFile?: string;
    /**
     * Whether this deploy step requires owner calldata
     * (BinaryWriter(32).writeAddress(ownerAddress))
     */
    ownerCalldata?: boolean;
    /** ABI name key from abis.ts (for CALL steps) */
    abiName?: string;
    /** Contract method to call (for CALL steps) */
    methodName?: string;
    /**
     * Address key in deployedAddresses for the contract to call (for CALL steps).
     * E.g., "pillToken" -> deployedAddresses.pillToken
     */
    contractAddressKey?: string;
    /** Parameters for contract calls */
    params?: CallParam[];
    /** Step IDs that must be completed before this step is available */
    dependencies: string[];
    /** Which address in deployedAddresses this step populates (for DEPLOY steps) */
    savesAddressAs?: string;
    /** Estimated cost in satoshis (for DEPLOY steps) */
    estimatedCostSats?: bigint;
    /** Which source file to patch (for PATCH steps) */
    patchTarget?: string;
    /** The propagation wait in seconds needed before the next step (after DEPLOY) */
    propagationWaitSeconds?: number;
}

/** Result of a completed deploy step */
export interface DeployResult {
    /** Contract public key (0x hex) */
    pubKey: string;
    /** Funding TX hash */
    fundingTxHash: string;
    /** Deploy TX hash */
    deployTxHash: string;
    /** Timestamp (ISO string) */
    deployedAt: string;
    /** Network this was deployed on */
    network: NetworkName;
}

/** Result of a completed contract call step */
export interface CallResult {
    /** Transaction hash */
    txHash: string;
    /** Timestamp */
    calledAt: string;
    /** Network */
    network: NetworkName;
}

/** Result of a completed build step */
export interface BuildResult {
    /** Whether the build succeeded */
    success: boolean;
    /** Build log output (last N lines) */
    logTail: string;
    /** Timestamp */
    builtAt: string;
}

/** Result of a completed patch step */
export interface PatchResult {
    /** The diff shown to the user */
    diff: string;
    /** Whether the user approved and rebuilt */
    approved: boolean;
    /** Timestamp */
    patchedAt: string;
}

/** Union of all step results */
export type StepResult = DeployResult | CallResult | BuildResult | PatchResult;

/** Map of address key to hex pubkey for all deployed contracts */
export interface DeployedAddresses {
    pillToken?: string;
    pillChef?: string;
    motoToken?: string;
    motoChef?: string;
    deployableOP20Template?: string;
    motoChefDeployableOP20Template?: string;
    templateMotoChef?: string;
    motoChefFactory?: string;
    motoSwapPoolTemplate?: string;
    motoSwapFactory?: string;
    motoStakingPool?: string;
    motoSwapRouter?: string;
    op20Factory?: string;
}

/** Full deployment state persisted to localStorage and server */
export interface DeploymentState {
    /** ISO timestamp of when deployment started */
    startedAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
    /** Which network this is for */
    network: NetworkName;
    /** Map of step ID -> completion status */
    completedSteps: Record<string, boolean>;
    /** Map of step ID -> step result */
    stepResults: Record<string, StepResult>;
    /** All deployed contract addresses (populated as steps complete) */
    deployedAddresses: DeployedAddresses;
    /** The PILL wallet bech32 address (saved after connecting) */
    pillWalletAddress?: string;
    /** The MOTO wallet bech32 address (saved after connecting) */
    motoWalletAddress?: string;
    /** Which phase has been completed */
    phaseCompleted: Record<Phase, boolean>;
}

/** Wallet state exposed by the hook */
export interface WalletState {
    isConnected: boolean;
    /** Bech32 address (bc1p... or opt1...) */
    walletAddress: string;
    /** OPNet hashed ML-DSA key (0x hex, 32 bytes) */
    hashedMLDSAKey: string;
    /** Bitcoin tweaked public key (0x hex, 33 bytes) */
    publicKey: string;
    /** Balance in satoshis */
    balanceSats: bigint;
    /** Which deployment phase this wallet is for */
    deployerPhase: Phase | null;
}

/** Log line from WebSocket build streaming */
export interface LogLine {
    id: number;
    timestamp: number;
    text: string;
    /** ANSI-parsed stream (stdout or stderr) */
    stream: 'stdout' | 'stderr';
}

/** Server health check response */
export interface ServerHealth {
    ok: boolean;
    version: string;
    reposDir: string;
    stateFile: string;
}

/** Response from WASM fetch */
export interface WasmFile {
    bytes: Uint8Array;
    filename: string;
    sizeBytes: number;
}

/** Patch request body */
export interface PatchRequest {
    pubkeys: Record<string, string>;
}

/** Patch response from server */
export interface PatchResponse {
    diff: string;
    patchedFile: string;
}

/** Admin function input definition */
export interface AdminFunctionInput {
    name: string;
    typeHint: string;
    description: string;
    /** Key in DeployedAddresses to pre-fill from */
    fromDeployedAddress?: string;
    /** Whether to show current on-chain value as placeholder */
    showCurrentValue?: boolean;
    /** Whether the field accepts bigint (shows numeric hint) */
    isBigInt?: boolean;
    /** Whether the field accepts an Address */
    isAddress?: boolean;
}

/** One admin function definition */
export interface AdminFunctionDef {
    /** ABI name key from abis.ts */
    abiName: string;
    /** Method name on the contract */
    methodName: string;
    /** Display name */
    displayName: string;
    /** Description of what this does */
    description: string;
    /** Input fields */
    inputs: AdminFunctionInput[];
    /**
     * Optional: read-only method to call to display current value.
     * E.g., "motoPerBlock" fetches the current emission rate.
     */
    currentValueMethod?: string;
    /** Display label for the current value */
    currentValueLabel?: string;
}

/** Contract admin panel entry */
export interface AdminContractEntry {
    /** Display name */
    name: string;
    /** Which ecosystem this belongs to */
    ecosystem: 'PILL' | 'MOTO' | 'MotoSwap';
    /** Key in DeployedAddresses */
    addressKey: keyof DeployedAddresses;
    /** ABI name key for state reads */
    stateAbiName: string;
    /** Admin functions available for this contract */
    adminFunctions: AdminFunctionDef[];
    /** Read-only state fields to display */
    stateFields: AdminStateField[];
}

/** A read-only state field to display in StateGrid */
export interface AdminStateField {
    /** Method name to call */
    method: string;
    /** Display label */
    label: string;
    /** Value formatting hint */
    format?: 'bigint' | 'address' | 'string' | 'boolean';
    /** Decimals for bigint display */
    decimals?: number;
}

/** Explorer URLs for a transaction */
export interface ExplorerLinks {
    mempool: string;
    opscan: string;
}

/** Deployment export format */
export interface DeploymentExport {
    exportedAt: string;
    network: NetworkName;
    deployedAddresses: DeployedAddresses;
    transactions: Record<string, { txHash: string; explorerLinks: ExplorerLinks }>;
}
