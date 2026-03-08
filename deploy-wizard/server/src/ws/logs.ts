import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

/** Wire protocol message sent to all connected clients. */
export interface WsMessage {
  type: 'log' | 'status' | 'error';
  source: string;
  data: string;
  timestamp: string;
}

let wss: WebSocketServer | null = null;

/**
 * Attaches a WebSocket server to an existing HTTP server.
 * Clients connect to ws://localhost:3847/ws.
 */
export function attachWebSocketServer(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = request.url ?? '';
    if (url === '/ws' || url === '/ws/logs') {
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    const welcome: WsMessage = {
      type: 'status',
      source: 'server',
      data: 'connected',
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(welcome));
  });

  return wss;
}

/**
 * Broadcasts a message to all currently connected WebSocket clients.
 */
export function broadcast(message: WsMessage): void {
  if (!wss) return;
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

/**
 * Convenience helper — broadcast a log line from a named source.
 */
export function broadcastLog(source: string, data: string): void {
  broadcast({ type: 'log', source, data, timestamp: new Date().toISOString() });
}

/**
 * Convenience helper — broadcast a status update.
 */
export function broadcastStatus(source: string, data: string): void {
  broadcast({ type: 'status', source, data, timestamp: new Date().toISOString() });
}

/**
 * Convenience helper — broadcast an error.
 */
export function broadcastError(source: string, data: string): void {
  broadcast({ type: 'error', source, data, timestamp: new Date().toISOString() });
}
