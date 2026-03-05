import React from 'react';

const PALETTE: readonly string[] = [
    '#f7931a', '#ffcc00', '#ff6b00', '#ffa940',
    '#e8821a', '#ffdd44', '#cc5500', '#ffb732',
    '#ff8c00', '#f5a623', '#e67300', '#ffc93c',
    '#d4760a', '#ffaa00', '#b35c00', '#ffe066',
];

function opacityStr(byteVal: number): string {
    const scaled = 40 + Math.floor(byteVal * 60 / 255);
    if (scaled >= 100) return '1';
    const tens = Math.floor(scaled / 10);
    const ones = scaled % 10;
    return `0.${tens}${ones}`;
}

function hashToBytes(hashHex: string): number[] {
    const hexStr = hashHex.startsWith('0x') ? hashHex.slice(2) : hashHex;
    const bytes: number[] = [];
    for (let i = 0; i < 32; i += 2) {
        bytes.push(parseInt(hexStr.substring(i, i + 2), 16));
    }
    return bytes;
}

interface SVGPreviewProps {
    blockHeight: bigint;
    hashHex: string;
    txCount?: number;
    size?: number;
    className?: string;
}

/**
 * Always renders a 16x16 grid preview matching the InteractiveGrid look.
 * Filled cells = min(txCount, 256), rest are dark placeholders.
 */
export function SVGPreview({ blockHeight, hashHex, txCount = 256, size = 280, className = '' }: SVGPreviewProps): React.ReactElement {
    const gridDim = 16;
    const viewBox = 280;
    const gap = 1;
    const totalGap = (gridDim - 1) * gap;
    const cellSize = Math.floor((viewBox - totalGap) / gridDim);
    const filledCells = Math.min(Math.max(txCount, 1), 256);
    const hashBytes = hashToBytes(hashHex);

    const cells: React.ReactElement[] = [];

    for (let row = 0; row < gridDim; row++) {
        for (let col = 0; col < gridDim; col++) {
            const cellIndex = row * gridDim + col;
            const x = col * (cellSize + gap);
            const y = row * (cellSize + gap);

            if (cellIndex < filledCells) {
                const hashIdx = cellIndex % 16;
                const byteVal = hashBytes[hashIdx] ?? 0;
                const colorByte = (byteVal + cellIndex) & 0xff;
                const color = PALETTE[colorByte & 0x0f] ?? PALETTE[0];
                const opacity = opacityStr(byteVal);
                cells.push(
                    <rect
                        key={cellIndex}
                        x={x}
                        y={y}
                        width={cellSize}
                        height={cellSize}
                        rx={0}
                        fill={color}
                        opacity={opacity}
                    />,
                );
            } else {
                cells.push(
                    <rect
                        key={cellIndex}
                        x={x}
                        y={y}
                        width={cellSize}
                        height={cellSize}
                        rx={0}
                        fill="#ffffff"
                        opacity="0.025"
                    />,
                );
            }
        }
    }

    return (
        <svg
            viewBox={`0 0 ${viewBox} ${viewBox}`}
            width={size}
            height={size}
            className={className}
            style={{ display: 'block', width: '100%', height: 'auto', imageRendering: 'pixelated' }}
            aria-label={`BlockMap #${blockHeight.toString()}`}
            role="img"
        >
            <rect width={viewBox} height={viewBox} fill="#050510" rx="0" />
            <g>{cells}</g>
        </svg>
    );
}
