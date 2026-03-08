import { BinaryWriter, Address } from '@btc-vision/transaction';

/**
 * Build the 32-byte owner calldata for Ownable contracts.
 * Used by ALL contracts that extend Ownable (MotoChef, PillChef,
 * template contracts, factories, MotoSwap contracts).
 *
 * @param ownerAddress - The OPNet Address representing the owner
 * @returns 32-byte Uint8Array of calldata
 */
export function buildOwnerCalldata(ownerAddress: Address): Uint8Array {
    const writer = new BinaryWriter(32);
    writer.writeAddress(ownerAddress);
    return writer.getBuffer();
}

/**
 * Convert a 0x-prefixed hex public key to a byte array for source patching.
 * Used when building `new Address([...])` arrays for hardcoded contract addresses.
 *
 * @param hexPubKey - e.g. "0xabcdef..." or "abcdef..."
 * @returns number array suitable for `new Address([...])`
 */
export function hexToByteArray(hexPubKey: string): number[] {
    const hex = hexPubKey.startsWith('0x') ? hexPubKey.slice(2) : hexPubKey;
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return bytes;
}

/**
 * Format a byte array as an AssemblyScript Address initializer string.
 * E.g.: `new Address([171, 205, 239, ...])`
 */
export function formatAddressBytes(bytes: number[]): string {
    return `new Address([${bytes.join(', ')}])`;
}
