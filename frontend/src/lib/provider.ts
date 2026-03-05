import { JSONRpcProvider } from 'opnet';
import { NETWORK, RPC_URL } from './constants.js';

let providerInstance: JSONRpcProvider | null = null;

/** Returns the shared OPNet provider singleton. Creates it on first call. */
export function getProvider(): JSONRpcProvider {
    if (!providerInstance) {
        providerInstance = new JSONRpcProvider({ url: RPC_URL, network: NETWORK });
    }
    return providerInstance;
}
