import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root data directory — next to the compiled dist output. */
const DATA_DIR = path.resolve(__dirname, '../../data');

export type NetworkId = 'testnet' | 'mainnet';

export interface StepResult {
  completedAt: string;
  success: boolean;
  error: string | null;
  outputs: Record<string, string>;
}

export interface DeployedContract {
  pubkey: string;
  txHash: string;
}

export interface DeploymentState {
  network: NetworkId;
  startedAt: string;
  lastUpdatedAt: string;
  currentStep: number;
  baseDir: string;
  steps: Record<string, StepResult>;
  deployedContracts: Record<string, DeployedContract>;
}

function stateFilePath(network: NetworkId): string {
  return path.join(DATA_DIR, `state-${network}.json`);
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function validateNetwork(network: string): NetworkId {
  if (network !== 'testnet' && network !== 'mainnet') {
    throw new Error(`Invalid network: "${network}". Must be "testnet" or "mainnet".`);
  }
  return network;
}

/**
 * Reads the current deployment state for a network.
 * Returns null if no state file exists yet.
 */
export function getState(network: string): DeploymentState | null {
  const net = validateNetwork(network);
  const filePath = stateFilePath(net);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as DeploymentState;
}

/**
 * Updates the deployment state for a network.
 *
 * @param network   Network identifier.
 * @param stepId    Step key to update (e.g. "step-03-deploy-moto").
 * @param data      Partial data to merge into the step record and top-level state.
 */
export function updateState(
  network: string,
  stepId: string,
  data: {
    success: boolean;
    error?: string;
    outputs?: Record<string, string>;
    deployedContracts?: Record<string, DeployedContract>;
    baseDir?: string;
    currentStep?: number;
  },
): DeploymentState {
  const net = validateNetwork(network);
  ensureDataDir();

  const existing = getState(net);
  const now = new Date().toISOString();

  const state: DeploymentState = existing ?? {
    network: net,
    startedAt: now,
    lastUpdatedAt: now,
    currentStep: 0,
    baseDir: data.baseDir ?? '',
    steps: {},
    deployedContracts: {},
  };

  state.lastUpdatedAt = now;

  if (data.baseDir !== undefined) state.baseDir = data.baseDir;
  if (data.currentStep !== undefined) state.currentStep = data.currentStep;

  state.steps[stepId] = {
    completedAt: now,
    success: data.success,
    error: data.error ?? null,
    outputs: data.outputs ?? {},
  };

  if (data.deployedContracts) {
    for (const [name, contract] of Object.entries(data.deployedContracts)) {
      state.deployedContracts[name] = contract;
    }
  }

  const filePath = stateFilePath(net);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');

  return state;
}

/**
 * Deletes the state file for a network, effectively resetting deployment progress.
 */
export function resetState(network: string): void {
  const net = validateNetwork(network);
  const filePath = stateFilePath(net);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
