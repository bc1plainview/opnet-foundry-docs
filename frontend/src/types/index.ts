export interface BlockData {
    blockHeight: bigint;
    blockHash: string;
    txCount: bigint;
    timestamp: bigint;
    difficulty: bigint;
}

export interface MintedBlockData {
    hash16: bigint;
    txCount: bigint;
    timestamp: bigint;
    difficulty: bigint;
    owner: string;
}

export interface TxResult {
    txid: string;
    success: boolean;
}

export type MintStatus = 'idle' | 'fetching' | 'simulating' | 'pending' | 'success' | 'error';
