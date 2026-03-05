import React from 'react';
import { mempoolTxUrl, opscanAddressUrl } from '../lib/constants.js';

interface ExplorerLinksProps {
    txid?: string;
    contractAddress?: string;
}

export function ExplorerLinks({ txid, contractAddress }: ExplorerLinksProps): React.ReactElement {
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {txid && (
                <a
                    href={mempoolTxUrl(txid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M1 11L11 1M11 1H4M11 1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Mempool
                </a>
            )}
            {contractAddress && (
                <a
                    href={opscanAddressUrl(contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M1 11L11 1M11 1H4M11 1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    OPScan
                </a>
            )}
        </div>
    );
}
