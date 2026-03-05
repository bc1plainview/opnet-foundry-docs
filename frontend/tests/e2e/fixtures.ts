import { test as base, expect } from '@playwright/test';

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.addInitScript(() => {
            (window as Record<string, unknown>).__WALLET_MOCK__ = {
                isConnected: true,
                address: 'bc1ptestaddress000000000000000000000000000000000000',
                publicKey: '0x0203aabbccddeeff00112233445566778899aabbccddeeff00',
                hashedMLDSAKey: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
                mldsaPublicKey: '0xDEADBEEFCAFEBABEDEADBEEFCAFEBABEDEADBEEF',
                network: { bech32: 'opt', pubKeyHash: 0x00, scriptHash: 0x05 },
            };
        });
        await use(page);
    },
});

export { expect };
