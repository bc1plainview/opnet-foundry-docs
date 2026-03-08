import type { NetworkName, ExplorerLinks } from './types';

/**
 * Get the Mempool explorer URL for a transaction.
 * Testnet: https://mempool.opnet.org/testnet4/tx/{TXID}
 * Mainnet: https://mempool.opnet.org/tx/{TXID}
 */
export function getMempoolUrl(txid: string, network: NetworkName): string {
    if (network === 'mainnet') {
        return `https://mempool.opnet.org/tx/${txid}`;
    }
    return `https://mempool.opnet.org/testnet4/tx/${txid}`;
}

/**
 * Get the OPScan URL for a contract or address.
 * Testnet: https://opscan.org/accounts/{HEX}?network=op_testnet
 * Mainnet: https://opscan.org/accounts/{HEX}?network=op_mainnet
 */
export function getOpscanUrl(hexAddress: string, network: NetworkName): string {
    const net = network === 'mainnet' ? 'op_mainnet' : 'op_testnet';
    const addr = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress;
    return `https://opscan.org/accounts/${addr}?network=${net}`;
}

/**
 * Build both explorer links for a transaction result.
 * For deploy results, provide the contractHexAddress for OPScan.
 */
export function buildExplorerLinks(
    txid: string,
    contractHexAddress: string,
    network: NetworkName,
): ExplorerLinks {
    return {
        mempool: getMempoolUrl(txid, network),
        opscan: getOpscanUrl(contractHexAddress, network),
    };
}
