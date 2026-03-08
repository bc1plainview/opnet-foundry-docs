import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { broadcastLog, broadcastError, broadcastStatus } from '../ws/logs.js';
import {
  validateBaseDir,
  validateRepoName,
  extractBaseRepo,
  resolveRepoPath,
  type RepoName,
  ALLOWED_REPOS,
  SecurityError,
} from './path-security.js';

/** Git remote URLs for each supported repo. */
const REPO_URLS: Record<RepoName, string> = {
  'motochef-contract': 'https://github.com/btc-vision/motochef-contract',
  'motoswap-core': 'https://github.com/btc-vision/motoswap-core',
  'motoswap-router': 'https://github.com/btc-vision/motoswap-router',
  'pill-chef': 'https://github.com/btc-vision/motochef-contract',
  'pill-token': 'https://github.com/btc-vision/pill-token',
};

export interface RepoStatus {
  repo: RepoName;
  exists: boolean;
  hasNodeModules: boolean;
  hasBuild: boolean;
  lastBuildAt: string | null;
}

export interface RepoStatusResult {
  baseDir: string;
  repos: RepoStatus[];
}

/**
 * Runs a child process, streaming stdout/stderr to WebSocket clients.
 * Resolves with exit code 0 on success, rejects with error on non-zero exit.
 */
function runStreaming(
  cmd: string,
  args: readonly string[],
  cwd: string,
  source: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    broadcastStatus(source, `Starting: ${cmd} ${args.join(' ')}`);

    const child = spawn(cmd, args as string[], { cwd, shell: false });

    child.stdout.on('data', (chunk: Buffer) => {
      const lines = chunk.toString('utf8').split('\n');
      for (const line of lines) {
        if (line.trim()) broadcastLog(source, line);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const lines = chunk.toString('utf8').split('\n');
      for (const line of lines) {
        if (line.trim()) broadcastError(source, line);
      }
    });

    child.on('error', (err) => {
      broadcastError(source, `Process error: ${err.message}`);
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) {
        broadcastStatus(source, 'Done');
        resolve();
      } else {
        const msg = `Exited with code ${code ?? 'null'}`;
        broadcastError(source, msg);
        reject(new Error(msg));
      }
    });
  });
}

/**
 * Ensures the @noble/hashes override is present in a repo's package.json.
 * This prevents version conflicts in OPNet packages.
 */
function ensureNobleHashesOverride(repoDir: string): void {
  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const raw = fs.readFileSync(pkgPath, 'utf8');
  // Parse carefully — the file may be large
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return; // Leave malformed package.json alone
  }

  const overrides = (pkg['overrides'] ?? {}) as Record<string, string>;
  if (overrides['@noble/hashes'] === '2.0.1') return; // Already set

  overrides['@noble/hashes'] = '2.0.1';
  pkg['overrides'] = overrides;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  broadcastStatus(`repo-manager:${path.basename(repoDir)}`, 'Added @noble/hashes override to package.json');
}

/**
 * Clones a single repo into baseDir/repoName.
 * Uses `--recurse-submodules` to handle motochef-contract's libs/moto submodule.
 */
export async function cloneRepo(baseDir: string, repoName: string): Promise<void> {
  const safeBase = validateBaseDir(baseDir);
  const safe = validateRepoName(repoName);
  const repoDir = resolveRepoPath(safeBase, safe);
  const source = `clone:${safe}`;

  if (fs.existsSync(repoDir)) {
    broadcastStatus(source, `Directory already exists: ${repoDir}`);
    return;
  }

  const gitUrl = REPO_URLS[safe];
  await runStreaming(
    'git',
    ['clone', '--recurse-submodules', gitUrl, safe],
    safeBase,
    source,
  );
}

/**
 * Runs npm install in the repo directory.
 * Injects @noble/hashes override before installing.
 */
export async function installDeps(baseDir: string, repoName: string): Promise<void> {
  const safeBase = validateBaseDir(baseDir);
  const safe = validateRepoName(repoName);
  const repoDir = resolveRepoPath(safeBase, safe);
  const source = `install:${safe}`;

  if (!fs.existsSync(repoDir)) {
    throw new Error(`Repo directory does not exist: ${repoDir}`);
  }

  ensureNobleHashesOverride(repoDir);

  await runStreaming('npm', ['install', '--prefer-online'], repoDir, source);
}

/**
 * Runs npm run build in the repo directory and records a build timestamp.
 * Supports sub-paths like "motochef-contract/libs/moto" — validates the base
 * repo name and resolves the full build directory within it.
 */
export async function buildRepo(baseDir: string, repoPath: string): Promise<void> {
  const safeBase = validateBaseDir(baseDir);

  // Extract and validate the base repo name (e.g., "motochef-contract" from "motochef-contract/libs/moto")
  const baseRepo = extractBaseRepo(repoPath);

  // Resolve the full path (may be a sub-directory within the repo)
  const buildDir = path.resolve(safeBase, repoPath);

  // Security: ensure resolved path stays inside baseDir
  if (!buildDir.startsWith(safeBase + path.sep) && buildDir !== safeBase) {
    throw new SecurityError('Build path escapes baseDir');
  }

  const source = `build:${repoPath}`;

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory does not exist: ${buildDir}`);
  }

  await runStreaming('npm', ['run', 'build'], buildDir, source);

  // Record build timestamp on the base repo dir
  const repoDir = resolveRepoPath(safeBase, baseRepo);
  const stampPath = path.join(repoDir, '.last-build');
  fs.writeFileSync(stampPath, new Date().toISOString(), 'utf8');
}

/**
 * Returns the existence and build status of all supported repos in baseDir.
 */
export function getRepoStatus(baseDir: string): RepoStatusResult {
  const safeBase = validateBaseDir(baseDir);
  const repos: RepoStatus[] = ALLOWED_REPOS.map((repo) => {
    const repoDir = path.join(safeBase, repo);
    const exists = fs.existsSync(repoDir);
    const hasNodeModules = exists && fs.existsSync(path.join(repoDir, 'node_modules'));
    const hasBuild = exists && fs.existsSync(path.join(repoDir, 'build'));
    const stampPath = path.join(repoDir, '.last-build');
    const lastBuildAt = hasBuild && fs.existsSync(stampPath)
      ? fs.readFileSync(stampPath, 'utf8').trim()
      : null;

    return { repo, exists, hasNodeModules, hasBuild, lastBuildAt };
  });

  return { baseDir: safeBase, repos };
}
