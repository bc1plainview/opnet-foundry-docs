import { networks } from '@btc-vision/bitcoin';
import type { Network } from '@btc-vision/bitcoin';
import type { NetworkName } from './types';

/** OPNet RPC endpoint for testnet */
export const TESTNET_RPC_URL = 'https://testnet.opnet.org';

/** OPNet RPC endpoint for mainnet */
export const MAINNET_RPC_URL = 'https://api.opnet.org';

/** Default fee rate for testnet (sats/vB) */
export const TESTNET_FEE_RATE = 25;

/** Default gas sat fee for contract calls */
export const GAS_SAT_FEE = 10_000n;

/** Maximum allowed sats to spend on contract calls */
export const MAXIMUM_ALLOWED_SAT = 120_000n;

export interface NetworkConfig {
    name: NetworkName;
    displayName: string;
    rpcUrl: string;
    /** @btc-vision/bitcoin network object */
    network: Network;
    /** Default fee rate (sats/vB). Use gasParameters() on mainnet. */
    defaultFeeRate: number;
    /** Bech32 address prefix */
    addressPrefix: string;
    /** Whether this is a production network */
    isMainnet: boolean;
}

/** Testnet network configuration */
export const TESTNET_CONFIG: NetworkConfig = {
    name: 'testnet',
    displayName: 'Testnet (Signet)',
    rpcUrl: TESTNET_RPC_URL,
    network: networks.opnetTestnet,
    defaultFeeRate: TESTNET_FEE_RATE,
    addressPrefix: 'opt',
    isMainnet: false,
};

/** Mainnet network configuration */
export const MAINNET_CONFIG: NetworkConfig = {
    name: 'mainnet',
    displayName: 'Mainnet (Bitcoin)',
    rpcUrl: MAINNET_RPC_URL,
    network: networks.bitcoin,
    defaultFeeRate: 0, // Use live gasParameters() on mainnet
    addressPrefix: 'bc',
    isMainnet: true,
};

/**
 * Get network configuration by name.
 */
export function getNetworkConfig(name: NetworkName): NetworkConfig {
    return name === 'mainnet' ? MAINNET_CONFIG : TESTNET_CONFIG;
}
