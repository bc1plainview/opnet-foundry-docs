import React, { useCallback } from 'react';

interface ViewToggleProps {
    value: '2d' | '3d';
    onChange: (value: '2d' | '3d') => void;
}

const BUTTON_BASE: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    padding: '6px 10px',
    border: '1px solid rgba(247,147,26,0.3)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'background 120ms steps(2), color 120ms steps(2), border-color 120ms steps(2)',
    outline: 'none',
    userSelect: 'none',
};

const BUTTON_ACTIVE: React.CSSProperties = {
    background: 'var(--accent)',
    color: '#020208',
    borderColor: 'var(--accent)',
};

const BUTTON_HOVER: React.CSSProperties = {
    borderColor: 'rgba(247,147,26,0.7)',
    color: 'var(--text-secondary)',
};

export function ViewToggle({ value, onChange }: ViewToggleProps): React.ReactElement {
    const handle2d = useCallback((): void => {
        onChange('2d');
    }, [onChange]);

    const handle3d = useCallback((): void => {
        onChange('3d');
    }, [onChange]);

    return (
        <div
            style={{
                display: 'inline-flex',
                border: '1px solid rgba(247,147,26,0.2)',
                background: 'rgba(2,2,8,0.6)',
                backdropFilter: 'blur(8px)',
            }}
            role="group"
            aria-label="View mode"
        >
            <Button
                label="2D"
                active={value === '2d'}
                onClick={handle2d}
                isFirst
            />
            <Button
                label="3D"
                active={value === '3d'}
                onClick={handle3d}
                isFirst={false}
            />
        </div>
    );
}

interface ButtonProps {
    label: string;
    active: boolean;
    onClick: () => void;
    isFirst: boolean;
}

function Button({ label, active, onClick, isFirst }: ButtonProps): React.ReactElement {
    const [hovered, setHovered] = React.useState(false);

    const style: React.CSSProperties = {
        ...BUTTON_BASE,
        ...(active ? BUTTON_ACTIVE : {}),
        ...(!active && hovered ? BUTTON_HOVER : {}),
        borderLeft: isFirst ? undefined : '1px solid rgba(247,147,26,0.2)',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
    };

    return (
        <button
            type="button"
            style={style}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-pressed={active}
            aria-label={`Switch to ${label} view`}
        >
            {label}
        </button>
    );
}
