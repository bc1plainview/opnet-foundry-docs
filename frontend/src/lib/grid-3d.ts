import * as THREE from 'three';

// Weight range: 200 WU (coinbase/tiny) to 10,000 WU (large)
// Height: 200 WU → 0.3, 1000 WU → 1.0, 10000 WU → 3.0
const MIN_WEIGHT = 200;
const MAX_WEIGHT = 10_000;

// log1p(200) ≈ 5.298, log1p(10000) ≈ 9.210
const LOG_MIN = Math.log1p(MIN_WEIGHT);
const LOG_MAX = Math.log1p(MAX_WEIGHT);
const HEIGHT_MIN = 0.3;
const HEIGHT_MAX = 3.0;

export function weightToHeight(weight: number): number {
    const clamped = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
    const t = (Math.log1p(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return HEIGHT_MIN + t * (HEIGHT_MAX - HEIGHT_MIN);
}

// 3D fee-rate palette stops (fee rate in sat/vB → hex color)
// Ordered from cold to hot for linear interpolation
const FEE_STOPS: Array<{ rate: number; color: THREE.Color }> = [
    { rate: 1,   color: new THREE.Color('#1a1a4e') },
    { rate: 5,   color: new THREE.Color('#3d2b7a') },
    { rate: 20,  color: new THREE.Color('#cc7000') },
    { rate: 50,  color: new THREE.Color('#f7931a') },
    { rate: 100, color: new THREE.Color('#ffcc00') },
    { rate: 200, color: new THREE.Color('#fff5cc') },
];

// Log-scale fee rate to [0,1], then map to palette
export function feeRateToColor3D(feeRate: number): THREE.Color {
    const clamped = Math.max(1, Math.min(200, feeRate));
    const logRate = Math.log1p(clamped);
    const logMin = Math.log1p(1);
    const logMax = Math.log1p(200);
    const t = (logRate - logMin) / (logMax - logMin);

    // Find the two palette stops to interpolate between
    for (let i = 0; i < FEE_STOPS.length - 1; i++) {
        const lo = FEE_STOPS[i];
        const hi = FEE_STOPS[i + 1];
        if (lo === undefined || hi === undefined) continue;

        const loT = (Math.log1p(lo.rate) - logMin) / (logMax - logMin);
        const hiT = (Math.log1p(hi.rate) - logMin) / (logMax - logMin);

        if (t >= loT && t <= hiT) {
            const segT = hiT > loT ? (t - loT) / (hiT - loT) : 0;
            return lo.color.clone().lerp(hi.color, segT);
        }
    }

    // Clamp to last color
    const last = FEE_STOPS[FEE_STOPS.length - 1];
    return last !== undefined ? last.color.clone() : new THREE.Color('#fff5cc');
}

export interface TxWeightData {
    fee: number;
    weight: number;
    size: number;
}

export interface ColumnData {
    matrices: Float32Array;
    colors: Float32Array;
    count: number;
}

// Build per-instance transform matrices and colors for InstancedMesh.
// Layout: row-major, columns spaced 1.2 units apart on X and Z.
export function buildColumnData(
    txWeights: Array<TxWeightData | null>,
    txCount: number,
    gridDim: number,
): ColumnData {
    const count = Math.min(txCount, gridDim * gridDim);
    const matrices = new Float32Array(count * 16);
    const colors = new Float32Array(count * 3);

    const spacing = 1.2;
    // Center the grid around origin
    const offset = ((gridDim - 1) * spacing) / 2;

    const mat = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat = new THREE.Quaternion(); // identity rotation

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridDim);
        const col = i % gridDim;
        const txData = txWeights[i];

        const weight = txData?.weight ?? 1000; // fallback to 1000 WU
        const fee = txData?.fee ?? 0;
        const vsize = txData?.size ?? Math.ceil(weight / 4);
        const feeRate = vsize > 0 ? fee / vsize : 1;

        const height = weightToHeight(weight);

        pos.set(col * spacing - offset, height / 2, row * spacing - offset);
        scale.set(0.9, height, 0.9);
        mat.compose(pos, quat, scale);
        mat.toArray(matrices, i * 16);

        // Coinbase tx (index 0) = green
        let color: THREE.Color;
        if (i === 0) {
            color = new THREE.Color('#22c55e');
        } else {
            color = feeRateToColor3D(feeRate);
        }

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    return { matrices, colors, count };
}

// Camera position at 45° looking at block center, backed away based on grid size
export function defaultCameraPosition(gridDim: number): [number, number, number] {
    const extent = gridDim * 1.2;
    // Position at 45° elevation, offset on X and Z
    return [extent * 0.7, extent * 0.6, extent * 0.7];
}
