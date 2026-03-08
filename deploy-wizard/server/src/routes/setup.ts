import { Router } from 'express';
import {
  cloneRepo,
  installDeps,
  getRepoStatus,
} from '../lib/repo-manager.js';
import { SecurityError } from '../lib/path-security.js';

const router = Router();

interface CloneBody {
  baseDir: string;
  repo: string;
}

interface InstallBody {
  baseDir: string;
  repo: string;
}

/**
 * POST /api/setup/clone
 * Clones a single repository into baseDir.
 * Body: { baseDir: string, repo: RepoName }
 */
router.post('/clone', (req, res) => {
  const body = req.body as CloneBody;

  if (typeof body.baseDir !== 'string' || typeof body.repo !== 'string') {
    res.status(400).json({ error: 'body must have string fields: baseDir, repo' });
    return;
  }

  // Kick off async without awaiting — streaming happens via WebSocket
  cloneRepo(body.baseDir, body.repo).catch((err: unknown) => {
    // Logged via WebSocket during execution; nothing more to do here.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`clone error for ${body.repo}: ${message}`);
  });

  res.json({ status: 'started', repo: body.repo });
});

/**
 * POST /api/setup/install
 * Runs npm install in the given repo.
 * Body: { baseDir: string, repo: RepoName }
 */
router.post('/install', (req, res) => {
  const body = req.body as InstallBody;

  if (typeof body.baseDir !== 'string' || typeof body.repo !== 'string') {
    res.status(400).json({ error: 'body must have string fields: baseDir, repo' });
    return;
  }

  installDeps(body.baseDir, body.repo).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`install error for ${body.repo}: ${message}`);
  });

  res.json({ status: 'started', repo: body.repo });
});

/**
 * GET /api/setup/status?baseDir=...
 * Returns existence + build status for all supported repos.
 */
router.get('/status', (req, res) => {
  const baseDir = req.query['baseDir'];

  if (typeof baseDir !== 'string') {
    res.status(400).json({ error: 'query param "baseDir" is required' });
    return;
  }

  try {
    const result = getRepoStatus(baseDir);
    res.json(result);
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
