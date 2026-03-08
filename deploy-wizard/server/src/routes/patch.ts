import { Router } from 'express';
import { applyPatch } from '../lib/patch-engine.js';
import { buildRepo } from '../lib/repo-manager.js';
import {
  validateBaseDir,
  validatePatchTarget,
  SecurityError,
} from '../lib/path-security.js';

const router = Router();

interface PatchBody {
  baseDir: string;
  pubkeys: Record<string, string>;
}

interface ApproveBody {
  baseDir: string;
}

/**
 * Maps a patch target to the repo that must be rebuilt after patching.
 */
const PATCH_TARGET_TO_REPO: Record<string, string> = {
  'motochef-factory': 'motochef-contract',
  'op20-factory': 'motochef-contract',
  'motoswap-factory': 'motoswap-core',
  'motoswap-router': 'motoswap-router',
};

/**
 * POST /api/patch/:target
 * Patches source files for the given target with the provided pubkeys.
 * Returns a git diff of what changed.
 * Body: { baseDir: string, pubkeys: Record<string, string> }
 */
router.post('/:target', (req, res) => {
  const targetRaw = req.params['target'] ?? '';
  const body = req.body as PatchBody;

  if (typeof body.baseDir !== 'string') {
    res.status(400).json({ error: 'body must have string field: baseDir' });
    return;
  }

  if (!body.pubkeys || typeof body.pubkeys !== 'object') {
    res.status(400).json({ error: 'body must have object field: pubkeys' });
    return;
  }

  try {
    validatePatchTarget(targetRaw);
    const result = applyPatch(body.baseDir, targetRaw, body.pubkeys);
    res.json({
      status: 'patched',
      target: result.target,
      filePath: result.filePath,
      constantsPatched: result.constantsPatched,
      diff: result.diff,
    });
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
 * POST /api/patch/:target/approve
 * Triggers a rebuild of the affected repo after the user approves the diff.
 * Body: { baseDir: string }
 * Logs stream via WebSocket.
 */
router.post('/:target/approve', (req, res) => {
  const targetRaw = req.params['target'] ?? '';
  const body = req.body as ApproveBody;

  if (typeof body.baseDir !== 'string') {
    res.status(400).json({ error: 'body must have string field: baseDir' });
    return;
  }

  let safeBase: string;
  try {
    validatePatchTarget(targetRaw);
    safeBase = validateBaseDir(body.baseDir);
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  const repo = PATCH_TARGET_TO_REPO[targetRaw];
  if (!repo) {
    res.status(400).json({ error: `No rebuild target for patch: ${targetRaw}` });
    return;
  }

  buildRepo(safeBase, repo).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`rebuild error after patch approval for ${targetRaw}: ${message}`);
  });

  res.json({ status: 'build_started', target: targetRaw, repo });
});

export default router;
