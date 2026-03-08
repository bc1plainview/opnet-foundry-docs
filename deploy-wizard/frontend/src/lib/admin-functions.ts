/**
 * Registry of all admin functions available in the Admin Panel.
 * Each entry defines which contract, which method, what inputs, and how to display
 * the current on-chain value.
 */

import type { AdminContractEntry } from './types';

export const ADMIN_CONTRACTS: AdminContractEntry[] = [
    // PILL Token
    {
        name: 'PILL Token (OrangePill)',
        ecosystem: 'PILL',
        addressKey: 'pillToken',
        stateAbiName: 'OP20AdminAbi',
        stateFields: [
            { method: 'name', label: 'Name', format: 'string' },
            { method: 'symbol', label: 'Symbol', format: 'string' },
            { method: 'totalSupply', label: 'Total Supply', format: 'bigint', decimals: 18 },
            { method: 'decimals', label: 'Decimals', format: 'bigint' },
            { method: 'admin', label: 'Admin Address', format: 'address' },
        ],
        adminFunctions: [
            {
                abiName: 'AdministeredOP20Abi',
                methodName: 'changeAdmin',
                displayName: 'Change Admin',
                description: 'Transfer admin (minting) rights to a new address. Use with caution.',
                inputs: [
                    {
                        name: 'to',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New admin address (contract or wallet pubkey)',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'admin',
                currentValueLabel: 'Current Admin',
            },
        ],
    },

    // PillChef
    {
        name: 'PillChef',
        ecosystem: 'PILL',
        addressKey: 'pillChef',
        stateAbiName: 'MotoChefAdminAbi',
        stateFields: [
            { method: 'motoPerBlock', label: 'PILL Per Block', format: 'bigint', decimals: 18 },
            { method: 'bonusEndBlock', label: 'Bonus End Block', format: 'bigint' },
            { method: 'bonusMultiplier', label: 'Bonus Multiplier', format: 'bigint' },
            { method: 'poolLength', label: 'Pool Count', format: 'bigint' },
            { method: 'totalAllocPoint', label: 'Total Alloc Points', format: 'bigint' },
            { method: 'owner', label: 'Owner', format: 'address' },
        ],
        adminFunctions: [
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setMotoPerBlock',
                displayName: 'Set PILL Per Block',
                description:
                    'Set the PILL emission rate per Bitcoin block. Enable approximately 1 week after PILL launch.',
                inputs: [
                    {
                        name: 'amount',
                        typeHint: 'UINT256 (18 decimals)',
                        description: 'New PILL tokens minted per block (scaled by 10^18)',
                        isBigInt: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'motoPerBlock',
                currentValueLabel: 'Current PILL/Block',
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setBonusEndBlock',
                displayName: 'Set Bonus End Block',
                description: 'Set the Bitcoin block number at which the bonus multiplier period ends.',
                inputs: [
                    {
                        name: 'block',
                        typeHint: 'UINT256 (block number)',
                        description: 'Bitcoin block number when bonus ends',
                        isBigInt: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'bonusEndBlock',
                currentValueLabel: 'Current Bonus End Block',
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setBonusMultiplier',
                displayName: 'Set Bonus Multiplier',
                description: 'Set the emission multiplier during the bonus period (1 = no multiplier).',
                inputs: [
                    {
                        name: 'mult',
                        typeHint: 'UINT256',
                        description: 'Bonus multiplier (1 = no bonus, 2 = 2x emission)',
                        isBigInt: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'bonusMultiplier',
                currentValueLabel: 'Current Multiplier',
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'addPool',
                displayName: 'Add Pool',
                description: 'Add a new LP token pool to receive PILL rewards.',
                inputs: [
                    {
                        name: 'allocPoint',
                        typeHint: 'UINT256',
                        description: 'Allocation points for this pool',
                        isBigInt: true,
                    },
                    {
                        name: 'tokenAddress',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'LP token contract address',
                        isAddress: true,
                    },
                    {
                        name: 'withUpdate',
                        typeHint: 'BOOL',
                        description: 'Update all pools before adding (true recommended)',
                    },
                ],
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setPool',
                displayName: 'Set Pool',
                description: 'Adjust the allocation points for an existing pool.',
                inputs: [
                    {
                        name: 'pid',
                        typeHint: 'UINT256 (pool index)',
                        description: 'Pool ID (0-indexed)',
                        isBigInt: true,
                    },
                    {
                        name: 'allocPoint',
                        typeHint: 'UINT256',
                        description: 'New allocation points for this pool',
                        isBigInt: true,
                    },
                    {
                        name: 'withUpdate',
                        typeHint: 'BOOL',
                        description: 'Update all pools before modifying (true recommended)',
                    },
                ],
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'transferOwnership',
                displayName: 'Transfer Ownership',
                description: 'Transfer contract ownership to a new address.',
                inputs: [
                    {
                        name: 'newOwner',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New owner address',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'owner',
                currentValueLabel: 'Current Owner',
            },
        ],
    },

    // MOTO Token
    {
        name: 'MOTO Token',
        ecosystem: 'MOTO',
        addressKey: 'motoToken',
        stateAbiName: 'OP20AdminAbi',
        stateFields: [
            { method: 'name', label: 'Name', format: 'string' },
            { method: 'symbol', label: 'Symbol', format: 'string' },
            { method: 'totalSupply', label: 'Total Supply', format: 'bigint', decimals: 18 },
            { method: 'decimals', label: 'Decimals', format: 'bigint' },
            { method: 'admin', label: 'Admin Address', format: 'address' },
        ],
        adminFunctions: [
            {
                abiName: 'AdministeredOP20Abi',
                methodName: 'changeAdmin',
                displayName: 'Change Admin',
                description: 'Transfer admin (minting) rights to a new address.',
                inputs: [
                    {
                        name: 'to',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New admin address',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'admin',
                currentValueLabel: 'Current Admin',
            },
        ],
    },

    // MotoChef
    {
        name: 'MotoChef',
        ecosystem: 'MOTO',
        addressKey: 'motoChef',
        stateAbiName: 'MotoChefAdminAbi',
        stateFields: [
            { method: 'motoPerBlock', label: 'MOTO Per Block', format: 'bigint', decimals: 18 },
            { method: 'bonusEndBlock', label: 'Bonus End Block', format: 'bigint' },
            { method: 'bonusMultiplier', label: 'Bonus Multiplier', format: 'bigint' },
            { method: 'poolLength', label: 'Pool Count', format: 'bigint' },
            { method: 'totalAllocPoint', label: 'Total Alloc Points', format: 'bigint' },
            { method: 'owner', label: 'Owner', format: 'address' },
        ],
        adminFunctions: [
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setMotoPerBlock',
                displayName: 'Set MOTO Per Block',
                description:
                    'Set the MOTO emission rate per Bitcoin block. Enable approximately 90 days after MOTO launch.',
                inputs: [
                    {
                        name: 'amount',
                        typeHint: 'UINT256 (18 decimals)',
                        description: 'New MOTO tokens minted per block (scaled by 10^18)',
                        isBigInt: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'motoPerBlock',
                currentValueLabel: 'Current MOTO/Block',
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setBonusEndBlock',
                displayName: 'Set Bonus End Block',
                description: 'Set the Bitcoin block number at which the bonus period ends.',
                inputs: [
                    {
                        name: 'block',
                        typeHint: 'UINT256 (block number)',
                        description: 'Bitcoin block number when bonus ends',
                        isBigInt: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'bonusEndBlock',
                currentValueLabel: 'Current Bonus End Block',
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setBonusMultiplier',
                displayName: 'Set Bonus Multiplier',
                description: 'Set the emission multiplier during bonus period.',
                inputs: [
                    {
                        name: 'mult',
                        typeHint: 'UINT256',
                        description: 'Bonus multiplier',
                        isBigInt: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'bonusMultiplier',
                currentValueLabel: 'Current Multiplier',
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'addPool',
                displayName: 'Add Pool',
                description: 'Add a new LP token pool to receive MOTO rewards.',
                inputs: [
                    {
                        name: 'allocPoint',
                        typeHint: 'UINT256',
                        description: 'Allocation points',
                        isBigInt: true,
                    },
                    {
                        name: 'tokenAddress',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'LP token contract address',
                        isAddress: true,
                    },
                    {
                        name: 'withUpdate',
                        typeHint: 'BOOL',
                        description: 'Update all pools first',
                    },
                ],
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'setPool',
                displayName: 'Set Pool',
                description: 'Adjust allocation points for an existing pool.',
                inputs: [
                    {
                        name: 'pid',
                        typeHint: 'UINT256',
                        description: 'Pool ID',
                        isBigInt: true,
                    },
                    {
                        name: 'allocPoint',
                        typeHint: 'UINT256',
                        description: 'New allocation points',
                        isBigInt: true,
                    },
                    {
                        name: 'withUpdate',
                        typeHint: 'BOOL',
                        description: 'Update all pools first',
                    },
                ],
            },
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'transferOwnership',
                displayName: 'Transfer Ownership',
                description: 'Transfer contract ownership to a new address.',
                inputs: [
                    {
                        name: 'newOwner',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New owner address',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'owner',
                currentValueLabel: 'Current Owner',
            },
        ],
    },

    // MotoChef Factory
    {
        name: 'MotoChef Factory',
        ecosystem: 'MOTO',
        addressKey: 'motoChefFactory',
        stateAbiName: 'MotoChefAdminAbi',
        stateFields: [{ method: 'owner', label: 'Owner', format: 'address' }],
        adminFunctions: [
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'transferOwnership',
                displayName: 'Transfer Ownership',
                description: 'Transfer factory ownership to a new address.',
                inputs: [
                    {
                        name: 'newOwner',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New owner address',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'owner',
                currentValueLabel: 'Current Owner',
            },
        ],
    },

    // MotoSwap Factory
    {
        name: 'MotoSwap Factory',
        ecosystem: 'MotoSwap',
        addressKey: 'motoSwapFactory',
        stateAbiName: 'MotoChefAdminAbi',
        stateFields: [{ method: 'owner', label: 'Owner', format: 'address' }],
        adminFunctions: [
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'transferOwnership',
                displayName: 'Transfer Ownership',
                description: 'Transfer MotoSwap factory ownership.',
                inputs: [
                    {
                        name: 'newOwner',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New owner address',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'owner',
                currentValueLabel: 'Current Owner',
            },
        ],
    },

    // OP20 Factory
    {
        name: 'OP20 Factory',
        ecosystem: 'MOTO',
        addressKey: 'op20Factory',
        stateAbiName: 'MotoChefAdminAbi',
        stateFields: [{ method: 'owner', label: 'Owner', format: 'address' }],
        adminFunctions: [
            {
                abiName: 'MotoChefAdminAbi',
                methodName: 'transferOwnership',
                displayName: 'Transfer Ownership',
                description: 'Transfer OP20 factory ownership.',
                inputs: [
                    {
                        name: 'newOwner',
                        typeHint: 'ADDRESS (0x hex)',
                        description: 'New owner address',
                        isAddress: true,
                        showCurrentValue: true,
                    },
                ],
                currentValueMethod: 'owner',
                currentValueLabel: 'Current Owner',
            },
        ],
    },
];

/** Get admin contracts for a specific ecosystem */
export function getContractsByEcosystem(
    ecosystem: 'PILL' | 'MOTO' | 'MotoSwap',
): AdminContractEntry[] {
    return ADMIN_CONTRACTS.filter((c) => c.ecosystem === ecosystem);
}
