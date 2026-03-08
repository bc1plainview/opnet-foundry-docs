/**
 * All 26 deployment steps for the MOTO/PILL/MotoSwap ecosystem.
 *
 * Phase 1 (Steps 1-6): PILL ecosystem — uses PILL wallet.
 * Phase 2 (Steps 7-26): MOTO + MotoSwap + OP20 — uses MOTO wallet.
 */

import type { StepDefinition } from './types';

export const DEPLOYMENT_STEPS: StepDefinition[] = [
    // -------------------------------------------------------------------------
    // PHASE 1: PILL Ecosystem (PILL wallet)
    // -------------------------------------------------------------------------

    {
        id: 'pill-token-build',
        stepNumber: 1,
        phase: 1,
        type: 'BUILD',
        name: 'Build PILL Token',
        description:
            'Compiles the pill-token AssemblyScript contract to WASM. This produces the OrangePill token contract binary.',
        repo: 'pill-token',
        dependencies: [],
    },

    {
        id: 'pill-token-deploy',
        stepNumber: 2,
        phase: 1,
        type: 'DEPLOY',
        name: 'Deploy PILL Token',
        description:
            'Deploys the PILL (OrangePill) token contract to OPNet. No calldata required — supply and name are hardcoded in the constructor.',
        repo: 'pill-token',
        wasmFile: 'moto.wasm',
        ownerCalldata: false,
        savesAddressAs: 'pillToken',
        estimatedCostSats: 80_000n,
        propagationWaitSeconds: 15,
        dependencies: ['pill-token-build'],
    },

    {
        id: 'pill-chef-build',
        stepNumber: 3,
        phase: 1,
        type: 'BUILD',
        name: 'Build PillChef',
        description:
            'Compiles the pill-chef AssemblyScript contract to WASM. PillChef manages PILL token emission and reward distribution.',
        repo: 'pill-chef',
        dependencies: [],
    },

    {
        id: 'pill-chef-deploy',
        stepNumber: 4,
        phase: 1,
        type: 'DEPLOY',
        name: 'Deploy PillChef',
        description:
            'Deploys the PillChef contract. Requires 32-byte owner calldata (your wallet address). PillChef will be granted admin rights over the PILL token to mint rewards.',
        repo: 'pill-chef',
        wasmFile: 'MotoChef.wasm',
        ownerCalldata: true,
        savesAddressAs: 'pillChef',
        estimatedCostSats: 100_000n,
        propagationWaitSeconds: 15,
        dependencies: ['pill-chef-build'],
    },

    {
        id: 'pill-change-admin',
        stepNumber: 5,
        phase: 1,
        type: 'CALL',
        name: 'Change PILL Admin to PillChef',
        description:
            'Calls changeAdmin() on the PILL token, transferring minting authority to PillChef. This MUST happen before PillChef.initialize() because initialize() calls adminMint().',
        contractAddressKey: 'pillToken',
        abiName: 'AdministeredOP20Abi',
        methodName: 'changeAdmin',
        params: [
            {
                name: 'to',
                description: 'New admin address — must be the PillChef contract pubkey',
                typeHint: 'ADDRESS (0x hex)',
                fromDeployedAddress: 'pillChef',
                editable: false,
            },
        ],
        dependencies: ['pill-chef-deploy', 'pill-token-deploy'],
    },

    {
        id: 'pill-chef-initialize',
        stepNumber: 6,
        phase: 1,
        type: 'CALL',
        name: 'Initialize PillChef',
        description:
            'Calls initialize() on PillChef with 9 parameters. Sets the PILL token address, 900B premine to deployer, dev address, zero emission (enabled later), and pool allocation points.',
        contractAddressKey: 'pillChef',
        abiName: 'MotoChefStandaloneAbi',
        methodName: 'initialize',
        params: [
            {
                name: 'tokenAddress',
                description: 'PILL token contract pubkey',
                typeHint: 'ADDRESS (0x hex)',
                fromDeployedAddress: 'pillToken',
                editable: false,
            },
            {
                name: 'premineAmount',
                description: '900 billion PILL (90% of 1 trillion supply, 18 decimals)',
                typeHint: 'UINT256',
                staticValue: 900_000_000_000n * 10n ** 18n,
                editable: false,
            },
            {
                name: 'devAddress',
                description: 'Developer wallet address (OPNet pubkey, receives premine)',
                typeHint: 'ADDRESS (0x hex)',
                fromWalletPubKey: true,
                editable: true,
            },
            {
                name: 'tokenPerBlock',
                description: 'PILL emission per block. Set to 0 now — enable later via setMotoPerBlock()',
                typeHint: 'UINT256',
                staticValue: 0n,
                editable: true,
            },
            {
                name: 'bonusEndBlock',
                description: 'Block at which bonus multiplier ends. 0 = no bonus period',
                typeHint: 'UINT256',
                staticValue: 0n,
                editable: true,
            },
            {
                name: 'bonusMultiplier',
                description: 'Multiplier during bonus period. 1 = no extra bonus',
                typeHint: 'UINT256',
                staticValue: 1n,
                editable: false,
            },
            {
                name: 'treasuryAddress',
                description: 'Treasury wallet P2TR bech32 address (receives treasury portion)',
                typeHint: 'STRING (bech32 address)',
                fromWalletAddress: true,
                editable: true,
            },
            {
                name: 'BTCAllocPoint',
                description: 'Allocation points for the BTC pool',
                typeHint: 'UINT256',
                staticValue: 100n,
                editable: true,
            },
            {
                name: 'PILLAllocPoint',
                description: 'Allocation points for the PILL pool',
                typeHint: 'UINT256',
                staticValue: 100n,
                editable: true,
            },
        ],
        dependencies: ['pill-change-admin'],
    },

    // -------------------------------------------------------------------------
    // PHASE 2: MOTO + MotoSwap + OP20 (MOTO wallet)
    // -------------------------------------------------------------------------

    {
        id: 'moto-token-build',
        stepNumber: 7,
        phase: 2,
        type: 'BUILD',
        name: 'Build MOTO Token',
        description:
            'Compiles the MOTO token AssemblyScript contract to WASM (motochef-contract/libs/moto/).',
        repo: 'motochef-contract/libs/moto',
        dependencies: [],
    },

    {
        id: 'motochef-build',
        stepNumber: 8,
        phase: 2,
        type: 'BUILD',
        name: 'Build MotoChef Contract Suite',
        description:
            'Compiles the full motochef-contract suite to WASM. This builds MotoChef, DeployableOP20, MotoChefDeployableOP20, TemplateMotoChef, MotoChefFactory, and OP20Factory.',
        repo: 'motochef-contract',
        dependencies: ['moto-token-build'],
    },

    {
        id: 'moto-token-deploy',
        stepNumber: 9,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MOTO Token',
        description:
            'Deploys the MOTO token contract to OPNet. No calldata required — supply and name are hardcoded in the constructor.',
        repo: 'motochef-contract/libs/moto',
        wasmFile: 'moto.wasm',
        ownerCalldata: false,
        savesAddressAs: 'motoToken',
        estimatedCostSats: 80_000n,
        propagationWaitSeconds: 15,
        dependencies: ['motochef-build'],
    },

    {
        id: 'motochef-deploy',
        stepNumber: 10,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MotoChef Standalone',
        description:
            'Deploys the standalone MotoChef contract. Requires 32-byte owner calldata. MotoChef manages MOTO emission and rewards.',
        repo: 'motochef-contract',
        wasmFile: 'MotoChef.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoChef',
        estimatedCostSats: 100_000n,
        propagationWaitSeconds: 15,
        dependencies: ['motochef-build'],
    },

    {
        id: 'moto-change-admin',
        stepNumber: 11,
        phase: 2,
        type: 'CALL',
        name: 'Change MOTO Admin to MotoChef',
        description:
            'Calls changeAdmin() on the MOTO token, transferring minting authority to MotoChef. Required before MotoChef.initialize() which calls adminMint().',
        contractAddressKey: 'motoToken',
        abiName: 'AdministeredOP20Abi',
        methodName: 'changeAdmin',
        params: [
            {
                name: 'to',
                description: 'New admin address — MotoChef contract pubkey',
                typeHint: 'ADDRESS (0x hex)',
                fromDeployedAddress: 'motoChef',
                editable: false,
            },
        ],
        dependencies: ['motochef-deploy', 'moto-token-deploy'],
    },

    {
        id: 'motochef-initialize',
        stepNumber: 12,
        phase: 2,
        type: 'CALL',
        name: 'Initialize MotoChef',
        description:
            'Calls initialize() on MotoChef with 16 parameters. Sets MOTO token, dev address, zero emission (enabled after 90 days), fee recipients, farm name, and pool configuration.',
        contractAddressKey: 'motoChef',
        abiName: 'TemplateMotoChefAbi',
        methodName: 'initialize',
        params: [
            {
                name: 'tokenAddress',
                description: 'MOTO token contract pubkey',
                typeHint: 'ADDRESS (0x hex)',
                fromDeployedAddress: 'motoToken',
                editable: false,
            },
            {
                name: 'devAddress',
                description: 'Developer wallet address (OPNet pubkey)',
                typeHint: 'ADDRESS (0x hex)',
                fromWalletPubKey: true,
                editable: true,
            },
            {
                name: 'tokenPerBlock',
                description: 'MOTO emission per block. Start at 0 — enable after 90 days.',
                typeHint: 'UINT256',
                staticValue: 0n,
                editable: true,
            },
            {
                name: 'bonusEndBlock',
                description: 'Block at which bonus period ends. 0 = disabled.',
                typeHint: 'UINT256',
                staticValue: 0n,
                editable: true,
            },
            {
                name: 'bonusMultiplier',
                description: 'Multiplier during bonus period. 1 = no multiplier.',
                typeHint: 'UINT256',
                staticValue: 1n,
                editable: false,
            },
            {
                name: 'BTCAllocPoint',
                description: 'Allocation points for BTC pool',
                typeHint: 'UINT256',
                staticValue: 100n,
                editable: true,
            },
            {
                name: 'lpTokenAddress',
                description: 'LP token address — same as MOTO token for standalone chef',
                typeHint: 'ADDRESS (0x hex)',
                fromDeployedAddress: 'motoToken',
                editable: false,
            },
            {
                name: 'tokenAllocPoint',
                description: 'Allocation points for the MOTO pool',
                typeHint: 'UINT256',
                staticValue: 100n,
                editable: true,
            },
            {
                name: 'userBTCFeePercentage',
                description: 'User BTC fee percentage (0 = no user fee)',
                typeHint: 'UINT256',
                staticValue: 0n,
                editable: true,
            },
            {
                name: 'userFeeRecipient',
                description: 'Recipient for user fees (P2TR bech32 string)',
                typeHint: 'STRING (bech32 address)',
                fromWalletAddress: true,
                editable: true,
            },
            {
                name: 'motoSwapFeeRecipient',
                description: 'Recipient for MotoSwap fees (P2TR bech32 string)',
                typeHint: 'STRING (bech32 address)',
                fromWalletAddress: true,
                editable: true,
            },
            {
                name: 'opnetFeeRecipient',
                description: 'Recipient for OPNet protocol fees (P2TR bech32 string)',
                typeHint: 'STRING (bech32 address)',
                fromWalletAddress: true,
                editable: true,
            },
            {
                name: 'farmName',
                description: 'Display name for this farm',
                typeHint: 'STRING',
                staticValue: 'MOTO Farm',
                editable: true,
            },
            {
                name: 'farmBanner',
                description: 'Farm banner URL or empty string',
                typeHint: 'STRING',
                staticValue: '',
                editable: true,
            },
            {
                name: 'additionalPoolTokens',
                description: 'Additional LP token addresses to add as pools (empty for standalone)',
                typeHint: 'ADDRESS[] (empty array)',
                staticValue: [] as readonly string[],
                editable: false,
            },
            {
                name: 'additionalPoolAllocPoints',
                description: 'Alloc points for additional pools (must match additionalPoolTokens length)',
                typeHint: 'UINT256[] (empty array)',
                staticValue: [] as readonly bigint[],
                editable: false,
            },
        ],
        dependencies: ['moto-change-admin'],
    },

    {
        id: 'deploy-deployable-op20',
        stepNumber: 13,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy DeployableOP20 Template',
        description:
            'Deploys the DeployableOP20 template contract — used by MotoChefFactory and OP20Factory to create new tokens. Requires owner calldata.',
        repo: 'motochef-contract',
        wasmFile: 'DeployableOP20.wasm',
        ownerCalldata: true,
        savesAddressAs: 'deployableOP20Template',
        estimatedCostSats: 80_000n,
        propagationWaitSeconds: 15,
        dependencies: ['motochef-initialize'],
    },

    {
        id: 'deploy-motochef-deployable-op20',
        stepNumber: 14,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MotoChefDeployableOP20 Template',
        description:
            'Deploys the MotoChefDeployableOP20 template — a specialized token template used by MotoChefFactory when creating farm tokens. Requires owner calldata.',
        repo: 'motochef-contract',
        wasmFile: 'MotoChefDeployableOP20.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoChefDeployableOP20Template',
        estimatedCostSats: 80_000n,
        propagationWaitSeconds: 15,
        dependencies: ['deploy-deployable-op20'],
    },

    {
        id: 'deploy-template-motochef',
        stepNumber: 15,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy TemplateMotoChef Template',
        description:
            'Deploys the TemplateMotoChef template — cloned by MotoChefFactory when creating new farms. Requires owner calldata.',
        repo: 'motochef-contract',
        wasmFile: 'TemplateMotoChef.wasm',
        ownerCalldata: true,
        savesAddressAs: 'templateMotoChef',
        estimatedCostSats: 80_000n,
        propagationWaitSeconds: 15,
        dependencies: ['deploy-motochef-deployable-op20'],
    },

    {
        id: 'patch-motochef-factory',
        stepNumber: 16,
        phase: 2,
        type: 'PATCH',
        name: 'Patch MotoChefFactory + Rebuild',
        description:
            'Patches MotoChefFactory.ts and OP20Factory.ts to embed the deployed template contract pubkeys as hardcoded byte arrays. The diff is shown for review before rebuild.',
        repo: 'motochef-contract',
        patchTarget: 'motochef-factory',
        dependencies: ['deploy-template-motochef'],
    },

    {
        id: 'motochef-factory-deploy',
        stepNumber: 17,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MotoChefFactory',
        description:
            'Deploys the patched MotoChefFactory contract. This factory creates new MotoChef farms on demand. Requires owner calldata.',
        repo: 'motochef-contract',
        wasmFile: 'MotoChefFactory.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoChefFactory',
        estimatedCostSats: 120_000n,
        propagationWaitSeconds: 15,
        dependencies: ['patch-motochef-factory'],
    },

    {
        id: 'motochef-factory-initialize',
        stepNumber: 18,
        phase: 2,
        type: 'CALL',
        name: 'Initialize MotoChefFactory',
        description:
            'Calls initialize() on MotoChefFactory with no parameters. Fee recipients are hardcoded in the contract.',
        contractAddressKey: 'motoChefFactory',
        abiName: 'MotoChefFactoryAbi',
        methodName: 'initialize',
        params: [],
        dependencies: ['motochef-factory-deploy'],
    },

    {
        id: 'motoswap-core-build',
        stepNumber: 19,
        phase: 2,
        type: 'BUILD',
        name: 'Build MotoSwap Core',
        description:
            'Compiles motoswap-core to WASM. Produces pool.wasm (AMM pool template), factory.wasm, and staking.wasm.',
        repo: 'motoswap-core',
        dependencies: [],
    },

    {
        id: 'motoswap-pool-deploy',
        stepNumber: 20,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MotoSwap Pool Template',
        description:
            'Deploys the MotoSwap Pool template contract. The MotoswapFactory hardcodes this address and clones it to create new liquidity pools.',
        repo: 'motoswap-core',
        wasmFile: 'pool.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoSwapPoolTemplate',
        estimatedCostSats: 120_000n,
        propagationWaitSeconds: 15,
        dependencies: ['motoswap-core-build'],
    },

    {
        id: 'patch-motoswap-factory',
        stepNumber: 21,
        phase: 2,
        type: 'PATCH',
        name: 'Patch MotoswapFactory + Rebuild',
        description:
            'Patches MotoswapFactory.ts to embed the Pool template pubkey as a hardcoded byte array. Shows diff for review, then rebuilds motoswap-core.',
        repo: 'motoswap-core',
        patchTarget: 'motoswap-factory',
        dependencies: ['motoswap-pool-deploy'],
    },

    {
        id: 'motoswap-factory-deploy',
        stepNumber: 22,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MotoSwap Factory',
        description:
            'Deploys the patched MotoswapFactory contract. This factory creates new liquidity pools for token pairs. Requires owner calldata.',
        repo: 'motoswap-core',
        wasmFile: 'factory.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoSwapFactory',
        estimatedCostSats: 120_000n,
        propagationWaitSeconds: 15,
        dependencies: ['patch-motoswap-factory'],
    },

    {
        id: 'moto-staking-deploy',
        stepNumber: 23,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy Moto Staking Pool',
        description:
            'Deploys the Moto Staking Pool contract for staking rewards. Requires owner calldata.',
        repo: 'motoswap-core',
        wasmFile: 'staking.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoStakingPool',
        estimatedCostSats: 120_000n,
        propagationWaitSeconds: 15,
        dependencies: ['motoswap-factory-deploy'],
    },

    {
        id: 'patch-motoswap-router',
        stepNumber: 24,
        phase: 2,
        type: 'PATCH',
        name: 'Patch MotoswapRouterV1 + Rebuild',
        description:
            'Patches MotoswapRouterV1.ts to embed the MotoswapFactory address as a hardcoded byte array. Shows diff for review, then rebuilds motoswap-router.',
        repo: 'motoswap-router',
        patchTarget: 'motoswap-router',
        dependencies: ['moto-staking-deploy'],
    },

    {
        id: 'motoswap-router-deploy',
        stepNumber: 25,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy MotoSwap Router V1',
        description:
            'Deploys the patched MotoSwap Router V1 contract. The router provides the user-facing swap interface for all MotoSwap liquidity pools.',
        repo: 'motoswap-router',
        wasmFile: 'router.wasm',
        ownerCalldata: true,
        savesAddressAs: 'motoSwapRouter',
        estimatedCostSats: 120_000n,
        propagationWaitSeconds: 15,
        dependencies: ['patch-motoswap-router'],
    },

    {
        id: 'op20-factory-deploy',
        stepNumber: 26,
        phase: 2,
        type: 'DEPLOY',
        name: 'Deploy OP20 Factory',
        description:
            'Deploys the OP20 Factory contract, which allows anyone to create new OP-20 tokens on OPNet. Requires owner calldata.',
        repo: 'motochef-contract',
        wasmFile: 'OP20Factory.wasm',
        ownerCalldata: true,
        savesAddressAs: 'op20Factory',
        estimatedCostSats: 120_000n,
        dependencies: ['motochef-factory-initialize'],
    },
];

/** Get all steps for a given phase */
export function getStepsByPhase(phase: 1 | 2): StepDefinition[] {
    return DEPLOYMENT_STEPS.filter((s) => s.phase === phase);
}

/** Get a step by its ID */
export function getStepById(id: string): StepDefinition | undefined {
    return DEPLOYMENT_STEPS.find((s) => s.id === id);
}

/** Get all steps that depend on a given step ID */
export function getDependents(stepId: string): StepDefinition[] {
    return DEPLOYMENT_STEPS.filter((s) => s.dependencies.includes(stepId));
}

/** Get the step that should run after completing a given step */
export function getNextStep(currentStepId: string): StepDefinition | undefined {
    const current = getStepById(currentStepId);
    if (!current) return undefined;
    return DEPLOYMENT_STEPS.find((s) => s.stepNumber === current.stepNumber + 1);
}
