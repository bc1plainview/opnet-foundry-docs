import React from 'react';

interface SkeletonCardProps {
    count?: number;
}

function SingleSkeletonCard(): React.ReactElement {
    return (
        <div
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
            <div className="skeleton" style={{ width: '100%', paddingBottom: '100%', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '16px', width: '60%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '12px', width: '80%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '12px', width: '45%', borderRadius: '4px' }} />
        </div>
    );
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps): React.ReactElement {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <SingleSkeletonCard key={i} />
            ))}
        </>
    );
}

export function SkeletonMintForm(): React.ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '44px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '44px', width: '160px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
                <div className="skeleton" style={{ flex: 1, height: '80px', borderRadius: '8px' }} />
                <div className="skeleton" style={{ flex: 1, height: '80px', borderRadius: '8px' }} />
                <div className="skeleton" style={{ flex: 1, height: '80px', borderRadius: '8px' }} />
            </div>
        </div>
    );
}
