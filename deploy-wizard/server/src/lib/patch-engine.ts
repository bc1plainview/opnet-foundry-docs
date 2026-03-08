import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import {
  validateBaseDir,
  validatePatchTarget,
  type PatchTarget,
  SecurityError,
} from './path-security.js';

/**
 * Converts a hex pubkey string (with or without 0x prefix) to the AssemblyScript
 * Address constructor literal: `new Address([171, 205, 239, ...])`
 */
export function hexToByteArray(hexPubkey: string): string {
  const hex = hexPubkey.startsWith('0x') ? hexPubkey.slice(2) : hexPubkey;

  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`Invalid pubkey hex: expected 64 hex chars, got "${hexPubkey}"`);
  }

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

  return `new Address([${bytes.join(', ')}])`;
}

/**
 * Patches a TypeScript source file, replacing the `new Address([...])` value
 * for a given constant/field name.
 *
 * Handles multi-line byte arrays:
 *   TOKEN_TEMPLATE_BYTECODE_ADDRESS: Address = new Address([
 *     1, 2, 3, ...
 *   ]);
 */
export function patchSource(
  filePath: string,
  constantName: string,
  newByteArray: string,
): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Source file not found: ${filePath}`);
  }

  const original = fs.readFileSync(filePath, 'utf8');

  // Regex: matches `constantName` (word boundary) followed by optional type
  // annotation, then = new Address([...]) which may span multiple lines.
  // Uses non-greedy match to capture the shortest possible byte array.
  const pattern = new RegExp(
    `(\\b${escapeRegex(constantName)}\\b[^=]+=\\s*)new\\s+Address\\(\\[[\\s\\S]*?\\]\\)`,
    'g',
  );

  let matchCount = 0;
  const patched = original.replace(pattern, (_match, prefix: string) => {
    matchCount++;
    return `${prefix}${newByteArray}`;
  });

  if (matchCount === 0) {
    throw new Error(
      `Could not find "${constantName}" with a new Address([...]) initializer in ${filePath}`,
    );
  }

  fs.writeFileSync(filePath, patched, 'utf8');
}

/**
 * Returns `git diff` output for the given file (uses execFileSync to avoid shell injection).
 * Returns an empty string if the file is not in a git repository or if git is not available.
 */
export function generateDiff(filePath: string): string {
  try {
    const dir = path.dirname(filePath);
    const output = execFileSync('git', ['diff', filePath], {
      cwd: dir,
      encoding: 'utf8',
    });
    return output;
  } catch {
    return '';
  }
}

/**
 * Describes how to patch a given target: which file and which constants to update.
 */
interface PatchSpec {
  /** Path relative to baseDir. */
  relativeFilePath: string;
  /** Map from pubkey role name to constant name in the file. */
  constants: Record<string, string>;
}

const PATCH_SPECS: Record<PatchTarget, PatchSpec> = {
  'motochef-factory': {
    relativeFilePath: 'motochef-contract/src/core/MotoChefFactory.ts',
    constants: {
      deployableOP20: 'TOKEN_TEMPLATE_BYTECODE_ADDRESS',
      templateMotoChef: 'MOTOCHEF_TEMPLATE_BYTECODE_ADDRESS',
    },
  },
  'op20-factory': {
    relativeFilePath: 'motochef-contract/src/core/OP20Factory.ts',
    constants: {
      deployableOP20: 'TOKEN_TEMPLATE_BYTECODE_ADDRESS',
    },
  },
  'motoswap-factory': {
    relativeFilePath: 'motoswap-core/core/factory/MotoswapFactory.ts',
    constants: {
      poolTemplate: 'poolBytecodeAddress',
    },
  },
  'motoswap-router': {
    relativeFilePath: 'motoswap-router/router/router-v1/MotoswapRouterV1.ts',
    constants: {
      factory: 'factory',
    },
  },
};

export interface PatchResult {
  target: PatchTarget;
  filePath: string;
  diff: string;
  constantsPatched: string[];
}

/**
 * Applies all patches for a given target, using the provided pubkey map.
 *
 * @param baseDir   Validated absolute path to the deploy workspace.
 * @param target    Which contract source to patch.
 * @param pubkeys   Map from role name (e.g. "deployableOP20") to hex pubkey.
 */
export function applyPatch(
  baseDir: string,
  targetRaw: string,
  pubkeys: Record<string, string>,
): PatchResult {
  const safeBase = validateBaseDir(baseDir);
  const target = validatePatchTarget(targetRaw);
  const spec = PATCH_SPECS[target];

  const filePath = path.resolve(safeBase, spec.relativeFilePath);

  // Ensure the resolved path stays inside baseDir
  if (!filePath.startsWith(safeBase + path.sep) && filePath !== safeBase) {
    throw new SecurityError('Patch file path escapes baseDir');
  }

  const constantsPatched: string[] = [];

  for (const [role, constantName] of Object.entries(spec.constants)) {
    const hexPubkey = pubkeys[role];
    if (!hexPubkey) {
      throw new Error(`Missing pubkey for role "${role}" in target "${target}"`);
    }
    if (typeof hexPubkey !== 'string') {
      throw new Error(`Pubkey for role "${role}" must be a string, got ${typeof hexPubkey}`);
    }
    const byteArray = hexToByteArray(hexPubkey);
    patchSource(filePath, constantName, byteArray);
    constantsPatched.push(constantName);
  }

  const diff = generateDiff(filePath);

  return { target, filePath, diff, constantsPatched };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
