import { networks } from '@btc-vision/bitcoin';

export const NETWORK = networks.opnetTestnet;
export const RPC_URL = 'https://testnet.opnet.org';

export const CONTRACT_ADDRESS = 'opt1sqq54wflpjeftu54ku3qlr7y2u9ysfnm8pvuwmj7w';

export const MEMPOOL_BASE = 'https://mempool.opnet.org/testnet4';
export const OPSCAN_BASE = 'https://opscan.org';

export function mempoolTxUrl(txid: string): string {
    return `${MEMPOOL_BASE}/tx/${txid}`;
}

export function opscanAddressUrl(hexAddress: string): string {
    return `${OPSCAN_BASE}/accounts/${hexAddress}?network=op_testnet`;
}

export function mempoolBlockUrl(height: bigint): string {
    return `${MEMPOOL_BASE}/block/${height.toString()}`;
}
