import express from 'express';
import cors from 'cors';
import http from 'http';
import { attachWebSocketServer } from './ws/logs.js';
import healthRouter from './routes/health.js';
import setupRouter from './routes/setup.js';
import buildRouter from './routes/build.js';
import patchRouter from './routes/patch.js';
import stateRouter from './routes/state.js';

const HOST = '127.0.0.1'; // localhost only — never 0.0.0.0
const PORT = 3847;

const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// CORS: only allow requests from the Vite dev server
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/setup', setupRouter);
app.use('/api/build', buildRouter);
app.use('/api/patch', patchRouter);
app.use('/api/state', stateRouter);

// 404 handler for unknown API routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Unhandled error:', message);
    res.status(500).json({ error: 'Something went wrong.' });
  },
);

// Create HTTP server and attach WebSocket
const httpServer = http.createServer(app);
attachWebSocketServer(httpServer);

httpServer.listen(PORT, HOST, () => {
  console.log(`Deploy Wizard server running at http://${HOST}:${PORT}`);
  console.log(`WebSocket available at ws://${HOST}:${PORT}/ws`);
});
