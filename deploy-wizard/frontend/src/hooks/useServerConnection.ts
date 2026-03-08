import { useState, useEffect, useCallback, useRef } from 'react';
import type {
    ServerHealth,
    WasmFile,
    PatchRequest,
    PatchResponse,
    DeploymentState,
    LogLine,
} from '../lib/types';

const SERVER_BASE = '/api';
const WS_URL = '/ws/logs';

/** REST client + WebSocket connection to the companion server at localhost:3847 */
export function useServerConnection(): {
    isServerOnline: boolean;
    serverHealth: ServerHealth | null;
    logLines: LogLine[];
    clearLogs: () => void;
    checkHealth: () => Promise<boolean>;
    fetchWasm: (repo: string, file: string) => Promise<WasmFile>;
    triggerBuild: (repo: string, baseDir: string) => Promise<{ success: boolean; message: string }>;
    sendPatch: (target: string, pubkeys: Record<string, string>) => Promise<PatchResponse>;
    approvePatch: (target: string) => Promise<{ success: boolean }>;
    getState: () => Promise<DeploymentState | null>;
    saveState: (step: string, data: unknown) => Promise<void>;
    resetState: (network?: string) => Promise<void>;
} {
    const [isServerOnline, setIsServerOnline] = useState(false);
    const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
    const [logLines, setLogLines] = useState<LogLine[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const logCounterRef = useRef(0);

    // Connect WebSocket for log streaming
    useEffect((): (() => void) => {
        let ws: WebSocket;
        let reconnectTimer: ReturnType<typeof setTimeout>;

        function connect(): void {
            ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${WS_URL}`);
            wsRef.current = ws;

            ws.onmessage = (event: MessageEvent<string>): void => {
                let parsed: { stream?: string; text?: string };
                try {
                    parsed = JSON.parse(event.data) as { stream?: string; text?: string };
                } catch {
                    parsed = { stream: 'stdout', text: event.data };
                }

                const line: LogLine = {
                    id: ++logCounterRef.current,
                    timestamp: Date.now(),
                    text: parsed.text ?? '',
                    stream: parsed.stream === 'stderr' ? 'stderr' : 'stdout',
                };

                setLogLines((prev) => [...prev.slice(-2000), line]);
            };

            ws.onerror = (): void => {
                setIsServerOnline(false);
            };

            ws.onclose = (): void => {
                setIsServerOnline(false);
                reconnectTimer = setTimeout(connect, 3000);
            };

            ws.onopen = (): void => {
                setIsServerOnline(true);
            };
        }

        connect();

        return (): void => {
            clearTimeout(reconnectTimer);
            ws?.close();
        };
    }, []);

    const clearLogs = useCallback((): void => {
        setLogLines([]);
    }, []);

    const checkHealth = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch(`${SERVER_BASE}/health`);
            if (!res.ok) {
                setIsServerOnline(false);
                return false;
            }
            const data = (await res.json()) as ServerHealth;
            setServerHealth(data);
            setIsServerOnline(true);
            return data.ok;
        } catch {
            setIsServerOnline(false);
            setServerHealth(null);
            return false;
        }
    }, []);

    const fetchWasm = useCallback(async (repo: string, file: string): Promise<WasmFile> => {
        const encodedRepo = encodeURIComponent(repo);
        const encodedFile = encodeURIComponent(file);
        const res = await fetch(`${SERVER_BASE}/wasm/${encodedRepo}/${encodedFile}`);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch WASM ${file}: ${text}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        return {
            bytes: new Uint8Array(arrayBuffer),
            filename: file,
            sizeBytes: arrayBuffer.byteLength,
        };
    }, []);

    const triggerBuild = useCallback(
        async (repo: string, baseDir: string): Promise<{ success: boolean; message: string }> => {
            const encodedRepo = encodeURIComponent(repo);
            const res = await fetch(`${SERVER_BASE}/build/${encodedRepo}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseDir }),
            });
            const data = (await res.json()) as { success: boolean; message: string };
            return data;
        },
        [],
    );

    const sendPatch = useCallback(
        async (target: string, pubkeys: Record<string, string>): Promise<PatchResponse> => {
            const body: PatchRequest = { pubkeys };
            const encodedTarget = encodeURIComponent(target);
            const res = await fetch(`${SERVER_BASE}/patch/${encodedTarget}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Patch failed: ${text}`);
            }
            return (await res.json()) as PatchResponse;
        },
        [],
    );

    const approvePatch = useCallback(
        async (target: string): Promise<{ success: boolean }> => {
            const encodedTarget = encodeURIComponent(target);
            const res = await fetch(`${SERVER_BASE}/patch/${encodedTarget}/approve`, {
                method: 'POST',
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Patch approval failed: ${text}`);
            }
            return (await res.json()) as { success: boolean };
        },
        [],
    );

    const getState = useCallback(async (): Promise<DeploymentState | null> => {
        try {
            const res = await fetch(`${SERVER_BASE}/state`);
            if (res.status === 404) return null;
            if (!res.ok) return null;
            return (await res.json()) as DeploymentState;
        } catch {
            return null;
        }
    }, []);

    const saveState = useCallback(async (step: string, data: unknown): Promise<void> => {
        await fetch(`${SERVER_BASE}/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step, data }),
        });
    }, []);

    const resetState = useCallback(async (network?: string): Promise<void> => {
        await fetch(`${SERVER_BASE}/state`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirm: 'RESET', network }),
        });
    }, []);

    return {
        isServerOnline,
        serverHealth,
        logLines,
        clearLogs,
        checkHealth,
        fetchWasm,
        triggerBuild,
        sendPatch,
        approvePatch,
        getState,
        saveState,
        resetState,
    };
}
