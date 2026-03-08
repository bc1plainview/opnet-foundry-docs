import { Router } from 'express';

const router = Router();
const startedAt = Date.now();
const VERSION = '1.0.0';

/**
 * GET /api/health
 * Returns server health status, uptime, and version.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    version: VERSION,
  });
});

export default router;
