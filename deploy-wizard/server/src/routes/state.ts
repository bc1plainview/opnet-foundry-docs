import { Router } from 'express';
import {
  getState,
  updateState,
  resetState,
  type DeployedContract,
} from '../lib/state-manager.js';

const router = Router();

interface UpdateStateBody {
  network: string;
  stepId: string;
  data: {
    success: boolean;
    error?: string;
    outputs?: Record<string, string>;
    deployedContracts?: Record<string, DeployedContract>;
    baseDir?: string;
    currentStep?: number;
  };
}

/**
 * GET /api/state?network=testnet
 * Returns the current deployment state for a network.
 */
router.get('/', (req, res) => {
  const network = req.query['network'];

  if (typeof network !== 'string') {
    res.status(400).json({ error: 'query param "network" is required' });
    return;
  }

  try {
    const state = getState(network);
    if (!state) {
      res.status(404).json({ error: `No state found for network: ${network}` });
      return;
    }
    res.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/state
 * Updates the deployment state for a network step.
 * Body: { network: string, stepId: string, data: {...} }
 */
router.post('/', (req, res) => {
  const body = req.body as UpdateStateBody;

  if (typeof body.network !== 'string' || typeof body.stepId !== 'string') {
    res.status(400).json({ error: 'body must have string fields: network, stepId' });
    return;
  }

  if (!body.data || typeof body.data !== 'object') {
    res.status(400).json({ error: 'body must have object field: data' });
    return;
  }

  if (typeof body.data.success !== 'boolean') {
    res.status(400).json({ error: 'data.success must be a boolean' });
    return;
  }

  try {
    const state = updateState(body.network, body.stepId, body.data);
    res.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/state?network=testnet
 * Resets (deletes) the deployment state for a network.
 */
router.delete('/', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const network = (body['network'] ?? req.query['network']) as string | undefined;

  if (typeof network !== 'string') {
    res.status(400).json({ error: 'query param "network" is required' });
    return;
  }

  if (body['confirm'] !== 'RESET') {
    res.status(400).json({ error: 'Must send { confirm: "RESET" } in body to reset state' });
    return;
  }

  try {
    resetState(network);
    res.json({ status: 'reset', network });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

export default router;
