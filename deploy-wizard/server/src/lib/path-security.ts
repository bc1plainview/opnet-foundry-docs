import path from 'path';

/** Whitelisted repo names — any repo param must be one of these. */
export const ALLOWED_REPOS = [
  'motochef-contract',
  'motoswap-core',
  'motoswap-router',
  'pill-chef',
] as const;

export type RepoName = (typeof ALLOWED_REPOS)[number];

/** Whitelisted patch targets. */
export const ALLOWED_PATCH_TARGETS = [
  'motochef-factory',
  'op20-factory',
  'motoswap-factory',
  'motoswap-router',
] as const;

export type PatchTarget = (typeof ALLOWED_PATCH_TARGETS)[number];

/**
 * Validates that a base directory path is safe:
 * - Must be absolute.
 * - Must not contain `..` components after normalization.
 * Returns the normalized path or throws.
 */
export function validateBaseDir(baseDir: string): string {
  if (!path.isAbsolute(baseDir)) {
    throw new SecurityError('baseDir must be an absolute path');
  }
  const normalized = path.normalize(baseDir);
  // Reject if normalization introduced a traversal indicator (shouldn't happen
  // with an absolute path, but be explicit).
  if (normalized.includes('..')) {
    throw new SecurityError('baseDir must not contain traversal components');
  }
  return normalized;
}

/**
 * Validates a repo name against the whitelist.
 */
export function validateRepoName(repo: string): RepoName {
  if (!(ALLOWED_REPOS as readonly string[]).includes(repo)) {
    throw new SecurityError(`Unknown repo: ${repo}`);
  }
  return repo as RepoName;
}

/**
 * Validates a patch target against the whitelist.
 */
export function validatePatchTarget(target: string): PatchTarget {
  if (!(ALLOWED_PATCH_TARGETS as readonly string[]).includes(target)) {
    throw new SecurityError(`Unknown patch target: ${target}`);
  }
  return target as PatchTarget;
}

/**
 * Resolves a repo path and ensures it stays within baseDir.
 * Returns the validated absolute path.
 */
export function resolveRepoPath(baseDir: string, repoName: RepoName): string {
  const safe = validateBaseDir(baseDir);
  const resolved = path.resolve(safe, repoName);
  if (!resolved.startsWith(safe + path.sep) && resolved !== safe) {
    throw new SecurityError('Resolved path escapes baseDir');
  }
  return resolved;
}

/**
 * Validates a WASM file path for the /api/wasm/:repo/* endpoint.
 * The final path must stay within repoDir/build/.
 */
export function resolveWasmPath(repoDir: string, relPath: string): string {
  const buildDir = path.resolve(repoDir, 'build');
  const resolved = path.resolve(buildDir, relPath);
  if (!resolved.startsWith(buildDir + path.sep) && resolved !== buildDir) {
    throw new SecurityError('WASM path escapes build directory');
  }
  if (!resolved.endsWith('.wasm')) {
    throw new SecurityError('WASM path must end in .wasm');
  }
  return resolved;
}

export class SecurityError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}
