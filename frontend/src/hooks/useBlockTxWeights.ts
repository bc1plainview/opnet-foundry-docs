import { useState, useCallback, useRef } from 'react';
import type { TxWeightData } from '../lib/grid-3d.js';

const MEMPOOL_API = 'https://mempool.space/api';
// Fetch this many txids per batch to avoid hammering the API
const BATCH_SIZE = 25;

interface FeeRateRange {
    min: number;
    max: number;
}

interface UseBlockTxWeightsReturn {
    txWeights: Array<TxWeightData | null>;
    progress: number;
    loading: boolean;
    feeRateRange: FeeRateRange;
    fetchWeights: (blockHash: string, txCount: number) => void;
}

interface MempoolTx {
    weight: number;
    fee: number;
    size: number;
}

export function useBlockTxWeights(): UseBlockTxWeightsReturn {
    const [txWeights, setTxWeights] = useState<Array<TxWeightData | null>>([]);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [feeRateRange, setFeeRateRange] = useState<FeeRateRange>({ min: 1, max: 1 });
    // Track the current fetch session to cancel stale fetches when block changes
    const sessionRef = useRef(0);

    const fetchWeights = useCallback((blockHash: string, txCount: number): void => {
        if (!blockHash || txCount === 0) return;

        const session = ++sessionRef.current;

        setLoading(true);
        setProgress(0);
        setTxWeights(new Array<TxWeightData | null>(txCount).fill(null));
        setFeeRateRange({ min: 1, max: 1 });

        let fetchedMin = Infinity;
        let fetchedMax = 0;
        let fetched = 0;

        // mempool.space supports paginated tx fetching via /block/:hash/txs/:start_index
        // It returns 25 txs per page
        const fetchBatch = async (startIndex: number): Promise<void> => {
            if (session !== sessionRef.current) return;

            try {
                const url = `${MEMPOOL_API}/block/${blockHash}/txs/${startIndex}`;
                const response = await fetch(url);
                if (!response.ok || session !== sessionRef.current) return;

                const txs = await response.json() as MempoolTx[];
                if (session !== sessionRef.current) return;

                setTxWeights((prev) => {
                    const next = [...prev];
                    for (let i = 0; i < txs.length; i++) {
                        const tx = txs[i];
                        if (tx === undefined) continue;
                        const idx = startIndex + i;
                        if (idx < txCount) {
                            next[idx] = { fee: tx.fee, weight: tx.weight, size: tx.size };
                            const vsize = tx.size > 0 ? tx.size : Math.ceil(tx.weight / 4);
                            const feeRate = vsize > 0 ? tx.fee / vsize : 1;
                            if (feeRate < fetchedMin) fetchedMin = feeRate;
                            if (feeRate > fetchedMax) fetchedMax = feeRate;
                        }
                    }
                    return next;
                });

                fetched += txs.length;
                const pct = Math.min(100, Math.round((fetched / txCount) * 100));
                setProgress(pct);

                if (fetchedMin !== Infinity) {
                    setFeeRateRange({ min: fetchedMin, max: Math.max(fetchedMax, 1) });
                }

                // Continue fetching if there are more pages
                const nextStart = startIndex + BATCH_SIZE;
                if (nextStart < txCount && txs.length === BATCH_SIZE) {
                    await fetchBatch(nextStart);
                } else {
                    if (session === sessionRef.current) {
                        setLoading(false);
                        setProgress(100);
                    }
                }
            } catch {
                if (session === sessionRef.current) {
                    setLoading(false);
                }
            }
        };

        void fetchBatch(0);
    }, []);

    return { txWeights, progress, loading, feeRateRange, fetchWeights };
}
