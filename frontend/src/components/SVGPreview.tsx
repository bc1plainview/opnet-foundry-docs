import React from 'react';
import { generateSVG } from '../lib/svg-generator.js';

interface SVGPreviewProps {
    blockHeight: bigint;
    hashHex: string;
    txCount?: number;
    size?: number;
    className?: string;
}

export function SVGPreview({ blockHeight, hashHex, txCount = 16, size = 320, className = '' }: SVGPreviewProps): React.ReactElement {
    const svgMarkup = generateSVG(blockHeight, hashHex, txCount);
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

    return (
        <img
            src={dataUri}
            alt={`BlockMap #${blockHeight.toString()}`}
            width={size}
            height={size}
            className={className}
            style={{
                display: 'block',
                borderRadius: '8px',
                imageRendering: 'pixelated',
            }}
        />
    );
}
