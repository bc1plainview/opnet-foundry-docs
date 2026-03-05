import { useState, useCallback } from 'react';
import type { BlockData } from '../types/index.js';

const MEMPOOL_API = 'https://mempool.opnet.org/testnet4/api';

interface MempoolBlock {
    id: string;
    height: number;
    tx_count: number;
    timestamp: number;
    difficulty: number;
    bits: number;
    nonce: number;
    size: number;
    weight: number;
    previousblockhash: string;
    mediantime: number;
    extras?: {
        coinbaseRaw?: string;
        medianFee?: number;
        feeRange?: number[];
        reward?: number;
        totalFees?: number;
    };
}

interface UseBlockDataReturn {
    blockData: BlockData | null;
    loading: boolean;
    error: string | null;
    fetchBlock: (height: bigint) => Promise<BlockData | null>;
    reset: () => void;
}

export function useBlockData(): UseBlockDataReturn {
    const [blockData, setBlockData] = useState<BlockData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBlock = useCallback(async (height: bigint): Promise<BlockData | null> => {
        setLoading(true);
        setError(null);
        setBlockData(null);

        try {
            // Step 1: Get block hash by height
            const hashResponse = await fetch(`${MEMPOOL_API}/block-height/${height.toString()}`);
            if (!hashResponse.ok) {
                throw new Error(`Block ${height.toString()} not found. It may not exist yet.`);
            }
            const blockHash = await hashResponse.text();

            // Step 2: Get full block data by hash
            const blockResponse = await fetch(`${MEMPOOL_API}/block/${blockHash.trim()}`);
            if (!blockResponse.ok) {
                throw new Error(`Failed to fetch block data for hash ${blockHash}`);
            }
            const block = await blockResponse.json() as MempoolBlock;

            const data: BlockData = {
                blockHeight: height,
                blockHash: blockHash.trim(),
                txCount: BigInt(block.tx_count),
                timestamp: BigInt(block.timestamp),
                difficulty: BigInt(Math.round(block.difficulty)),
            };

            setBlockData(data);
            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch block data';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback((): void => {
        setBlockData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { blockData, loading, error, fetchBlock, reset };
}
