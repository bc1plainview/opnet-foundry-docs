import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import {
  buildRepo,
  getRepoStatus,
} from '../lib/repo-manager.js';
import {
  validateBaseDir,
  validateRepoName,
  resolveRepoPath,
  resolveWasmPath,
  SecurityError,
} from '../lib/path-security.js';

const router = Router();

interface BuildBody {
  baseDir: string;
}

/**
 * POST /api/build/:repo
 * Triggers npm run build for the given repo.
 * Body: { baseDir: string }
 * Logs stream via WebSocket.
 */
router.post('/:repo', (req, res) => {
  const repoRaw = req.params['repo'] ?? '';
  const body = req.body as BuildBody;

  if (typeof body.baseDir !== 'string') {
    res.status(400).json({ error: 'body must have string field: baseDir' });
    return;
  }

  let safeBase: string;
  try {
    safeBase = validateBaseDir(body.baseDir);
    validateRepoName(repoRaw);
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  buildRepo(safeBase, repoRaw).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`build error for ${repoRaw}: ${message}`);
  });

  res.json({ status: 'started', repo: repoRaw });
});

/**
 * GET /api/build/:repo/status?baseDir=...
 * Returns the last build result for a repo.
 */
router.get('/:repo/status', (req, res) => {
  const repoRaw = req.params['repo'] ?? '';
  const baseDir = req.query['baseDir'];

  if (typeof baseDir !== 'string') {
    res.status(400).json({ error: 'query param "baseDir" is required' });
    return;
  }

  try {
    validateRepoName(repoRaw);
    const result = getRepoStatus(baseDir);
    const repoStatus = result.repos.find((r) => r.repo === repoRaw);
    if (!repoStatus) {
      res.status(404).json({ error: `Repo not found: ${repoRaw}` });
      return;
    }
    res.json(repoStatus);
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      res.status(400).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/wasm/:repo/*
 * Serves a .wasm binary from the repo's build/ directory.
 * Content-Type: application/wasm
 */
router.get('/:repo/wasm/*', (req, res) => {
  const repoRaw = req.params['repo'] ?? '';
  const baseDir = req.query['baseDir'];

  // The wildcard portion after /wasm/ (Express puts it in params[0])
  const wasmRel = (req.params as Record<string, string>)['0'] ?? '';

  if (typeof baseDir !== 'string') {
    res.status(400).json({ error: 'query param "baseDir" is required' });
    return;
  }

  try {
    const safeBase = validateBaseDir(baseDir);
    const safeRepo = validateRepoName(repoRaw);
    const repoDir = resolveRepoPath(safeBase, safeRepo);
    const wasmPath = resolveWasmPath(repoDir, wasmRel);

    if (!fs.existsSync(wasmPath)) {
      res.status(404).json({ error: `WASM file not found: ${path.basename(wasmPath)}` });
      return;
    }

    res.setHeader('Content-Type', 'application/wasm');
    res.sendFile(wasmPath);
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      res.status(400).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
