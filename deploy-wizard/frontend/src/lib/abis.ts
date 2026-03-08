/**
 * ABI definitions for OPNet Deploy Wizard contract interactions.
 * All ABIs use ABIDataTypes and BitcoinAbiTypes from opnet.
 */

import { ABIDataTypes, OP_NET_ABI } from 'opnet';
import type { BitcoinInterfaceAbi } from 'opnet';

// BitcoinAbiTypes values used in ABIs
const FUNCTION = 'Function' as const;

/**
 * AdministeredOP20 ABI — for changeAdmin() calls on MOTO and PILL tokens.
 * Used for Steps 5 and 11.
 */
export const AdministeredOP20Abi: BitcoinInterfaceAbi = [
    {
        name: 'admin',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.ADDRESS }],
        type: FUNCTION,
    },
    {
        name: 'changeAdmin',
        constant: false,
        inputs: [{ name: 'to', type: ABIDataTypes.ADDRESS }],
        outputs: [],
        type: FUNCTION,
    },
    ...OP_NET_ABI,
];

/**
 * TemplateMotoChef ABI — for MotoChef.initialize() with 16 params (MOTO).
 * Used for Step 12.
 */
export const TemplateMotoChefAbi: BitcoinInterfaceAbi = [
    {
        name: 'initialize',
        constant: false,
        inputs: [
            { name: 'tokenAddress', type: ABIDataTypes.ADDRESS },
            { name: 'devAddress', type: ABIDataTypes.ADDRESS },
            { name: 'tokenPerBlock', type: ABIDataTypes.UINT256 },
            { name: 'bonusEndBlock', type: ABIDataTypes.UINT256 },
            { name: 'bonusMultiplier', type: ABIDataTypes.UINT256 },
            { name: 'BTCAllocPoint', type: ABIDataTypes.UINT256 },
            { name: 'lpTokenAddress', type: ABIDataTypes.ADDRESS },
            { name: 'tokenAllocPoint', type: ABIDataTypes.UINT256 },
            { name: 'userBTCFeePercentage', type: ABIDataTypes.UINT256 },
            { name: 'userFeeRecipient', type: ABIDataTypes.STRING },
            { name: 'motoSwapFeeRecipient', type: ABIDataTypes.STRING },
            { name: 'opnetFeeRecipient', type: ABIDataTypes.STRING },
            { name: 'farmName', type: ABIDataTypes.STRING },
            { name: 'farmBanner', type: ABIDataTypes.STRING },
            { name: 'additionalPoolTokens', type: ABIDataTypes.ADDRESS_ARRAY },
            { name: 'additionalPoolAllocPoints', type: ABIDataTypes.UINT256_ARRAY },
        ],
        outputs: [],
        type: FUNCTION,
    },
    ...OP_NET_ABI,
];

/**
 * MotoChefStandalone ABI — for PillChef.initialize() with 9 params (PILL).
 * Used for Step 6.
 */
export const MotoChefStandaloneAbi: BitcoinInterfaceAbi = [
    {
        name: 'initialize',
        constant: false,
        inputs: [
            { name: 'tokenAddress', type: ABIDataTypes.ADDRESS },
            { name: 'premineAmount', type: ABIDataTypes.UINT256 },
            { name: 'devAddress', type: ABIDataTypes.ADDRESS },
            { name: 'tokenPerBlock', type: ABIDataTypes.UINT256 },
            { name: 'bonusEndBlock', type: ABIDataTypes.UINT256 },
            { name: 'bonusMultiplier', type: ABIDataTypes.UINT256 },
            { name: 'treasuryAddress', type: ABIDataTypes.STRING },
            { name: 'BTCAllocPoint', type: ABIDataTypes.UINT256 },
            { name: 'PILLAllocPoint', type: ABIDataTypes.UINT256 },
        ],
        outputs: [],
        type: FUNCTION,
    },
    ...OP_NET_ABI,
];

/**
 * MotoChefFactory ABI — for factory.initialize() (no params).
 * Used for Step 16.
 */
export const MotoChefFactoryAbi: BitcoinInterfaceAbi = [
    {
        name: 'initialize',
        constant: false,
        inputs: [],
        outputs: [],
        type: FUNCTION,
    },
    ...OP_NET_ABI,
];

/**
 * MotoChef admin ABI — for all admin management functions post-deployment.
 * Used by the Admin Panel (Steps 35-40).
 */
export const MotoChefAdminAbi: BitcoinInterfaceAbi = [
    {
        name: 'motoPerBlock',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'bonusEndBlock',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'bonusMultiplier',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'poolLength',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'totalAllocPoint',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'owner',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.ADDRESS }],
        type: FUNCTION,
    },
    {
        name: 'setMotoPerBlock',
        constant: false,
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [],
        type: FUNCTION,
    },
    {
        name: 'setBonusEndBlock',
        constant: false,
        inputs: [{ name: 'block', type: ABIDataTypes.UINT256 }],
        outputs: [],
        type: FUNCTION,
    },
    {
        name: 'setBonusMultiplier',
        constant: false,
        inputs: [{ name: 'mult', type: ABIDataTypes.UINT256 }],
        outputs: [],
        type: FUNCTION,
    },
    {
        name: 'addPool',
        constant: false,
        inputs: [
            { name: 'allocPoint', type: ABIDataTypes.UINT256 },
            { name: 'tokenAddress', type: ABIDataTypes.ADDRESS },
            { name: 'withUpdate', type: ABIDataTypes.BOOL },
        ],
        outputs: [],
        type: FUNCTION,
    },
    {
        name: 'setPool',
        constant: false,
        inputs: [
            { name: 'pid', type: ABIDataTypes.UINT256 },
            { name: 'allocPoint', type: ABIDataTypes.UINT256 },
            { name: 'withUpdate', type: ABIDataTypes.BOOL },
        ],
        outputs: [],
        type: FUNCTION,
    },
    {
        name: 'transferOwnership',
        constant: false,
        inputs: [{ name: 'newOwner', type: ABIDataTypes.ADDRESS }],
        outputs: [],
        type: FUNCTION,
    },
    ...OP_NET_ABI,
];

/**
 * OP-20 token ABI — for reading token metadata and balances.
 * Includes changeAdmin from AdministeredOP20.
 */
export const OP20AdminAbi: BitcoinInterfaceAbi = [
    {
        name: 'name',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.STRING }],
        type: FUNCTION,
    },
    {
        name: 'symbol',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.STRING }],
        type: FUNCTION,
    },
    {
        name: 'totalSupply',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'decimals',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT8 }],
        type: FUNCTION,
    },
    {
        name: 'balanceOf',
        constant: true,
        inputs: [{ name: 'addr', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.UINT256 }],
        type: FUNCTION,
    },
    {
        name: 'admin',
        constant: true,
        inputs: [],
        outputs: [{ name: 'returnVal1', type: ABIDataTypes.ADDRESS }],
        type: FUNCTION,
    },
    {
        name: 'changeAdmin',
        constant: false,
        inputs: [{ name: 'to', type: ABIDataTypes.ADDRESS }],
        outputs: [],
        type: FUNCTION,
    },
    ...OP_NET_ABI,
];

/** Registry of all ABI definitions by name */
export const ABI_REGISTRY: Record<string, BitcoinInterfaceAbi> = {
    AdministeredOP20Abi,
    TemplateMotoChefAbi,
    MotoChefStandaloneAbi,
    MotoChefFactoryAbi,
    MotoChefAdminAbi,
    OP20AdminAbi,
};
