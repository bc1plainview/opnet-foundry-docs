import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { test, expect } from './fixtures';

const __filename = fileURLToPath(import.meta.url);
const __dir = path.dirname(__filename);

// Navigate from frontend/tests/e2e -> frontend -> loop-onchain-bitmaps -> artifacts
const SCREENSHOT_DIR = path.resolve(
    __dir,
    '../../..',                                              // -> loop-onchain-bitmaps/
    '.claude/loop/sessions/onchain-bitmaps/artifacts/testing/screenshots'
);

function ensureScreenshotDir(): void {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
}

// Routes under test — note: /my is the actual route from App.tsx (task description says /my-blocks)
const ROUTES = [
    { path: '/', name: 'home' },
    { path: '/mint', name: 'mint' },
    { path: '/gallery', name: 'gallery' },
    { path: '/my', name: 'my-blocks' },
    { path: '/block/800000', name: 'block-detail' },
];

// ─── Page Load / Console Errors ─────────────────────────────────────────────

for (const route of ROUTES) {
    test(`[smoke] ${route.name} loads without console errors`, async ({ page }) => {
        ensureScreenshotDir();
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        const response = await page.goto(route.path);
        // Non-200s on the SPA shell are acceptable (Vite dev serves 200 for all routes)
        expect(response?.status()).toBeLessThan(500);

        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
            // networkidle may not settle when RPC calls are long-running; that's fine
        });

        // Screenshot of each page at desktop
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `${route.name}-desktop.png`),
            fullPage: true,
        });

        const realErrors = errors.filter(
            (e) =>
                !e.includes('favicon') &&
                !e.includes('DevTools') &&
                !e.includes('Failed to load resource') // external RPC timeouts ok in smoke
        );
        expect(realErrors, `Console errors on ${route.path}: ${JSON.stringify(realErrors)}`).toHaveLength(0);
    });
}

// ─── Dark Background ─────────────────────────────────────────────────────────

test('[smoke] body has dark background (luminance < 0.3)', async ({ page }) => {
    await page.goto('/');

    const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
    });

    const rgb = bgColor.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    expect(luminance, `Background luminance ${luminance} (color: ${bgColor}) should be < 0.3`).toBeLessThan(0.3);
});

// ─── No Emojis ───────────────────────────────────────────────────────────────

for (const route of ROUTES) {
    test(`[smoke] ${route.name} has no emojis in visible text`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');

        const hasEmoji = await page.evaluate(() => {
            // Extended emoji ranges
            const emojiPattern =
                /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}\u{1FAA0}-\u{1FAFF}]/u;
            return emojiPattern.test(document.body.innerText);
        });
        expect(hasEmoji, `Emoji found in visible text on ${route.path}`).toBe(false);
    });
}

// ─── No Spinners ─────────────────────────────────────────────────────────────

test('[smoke] no spinner elements exist (skeleton loaders used)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const spinnerSelectors = [
        '.spinner',
        '.loading-spinner',
        '[class*="spin"]:not([class*="skeleton"])',
        '.loader:not([class*="skeleton"])',
        '[data-testid*="spinner"]',
    ];

    for (const selector of spinnerSelectors) {
        const count = await page.locator(selector).count();
        expect(count, `Found spinner element matching "${selector}"`).toBe(0);
    }
});

// ─── Reduced Motion Media Query ───────────────────────────────────────────────

test('[smoke] CSS includes prefers-reduced-motion query', async ({ page }) => {
    await page.goto('/');
    // Wait for all stylesheets to be parsed — Vite loads CSS as separate modules
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    const hasReducedMotion = await page.evaluate(() => {
        const sheets = Array.from(document.styleSheets);
        for (const sheet of sheets) {
            try {
                const rules = Array.from(sheet.cssRules);
                for (const rule of rules) {
                    if (
                        rule instanceof CSSMediaRule &&
                        rule.conditionText.includes('prefers-reduced-motion')
                    ) {
                        return true;
                    }
                }
            } catch {
                // Cross-origin stylesheets are inaccessible; skip
            }
        }
        return false;
    });
    expect(hasReducedMotion, 'No @media (prefers-reduced-motion) rule found in stylesheets').toBe(true);
});

// ─── Explorer Link Patterns ───────────────────────────────────────────────────
// Strategy: fetch the Vite-served source modules directly via HTTP and scan for URL patterns.
// Vite dev server exposes source at /src/... so we can GET them without browser rendering.
// This verifies ExplorerLinks and constants.ts are wired with correct URLs regardless of
// whether a block is minted or not at test time.

test('[smoke] explorer link URL patterns exist in compiled JS bundle', async ({ request }) => {
    // Fetch the constants module — contains MEMPOOL_BASE and OPSCAN_BASE
    const constantsResponse = await request.get('http://localhost:5177/src/lib/constants.ts');
    expect(constantsResponse.status(), 'constants.ts module not served by Vite').toBe(200);
    const constantsText = await constantsResponse.text();

    // Fetch the ExplorerLinks component module
    const explorerResponse = await request.get('http://localhost:5177/src/components/ExplorerLinks.tsx');
    expect(explorerResponse.status(), 'ExplorerLinks.tsx module not served by Vite').toBe(200);
    const explorerText = await explorerResponse.text();

    const hasMempoolInConstants = constantsText.includes('mempool.opnet.org');
    const hasOpscanInConstants = constantsText.includes('opscan.org');

    // ExplorerLinks must import the URL functions
    const explorerImportsUrls =
        explorerText.includes('mempoolTxUrl') || explorerText.includes('opscanAddressUrl');

    expect(
        hasMempoolInConstants,
        'MEMPOOL_BASE URL not found in constants.ts. Should contain mempool.opnet.org.'
    ).toBe(true);

    expect(
        hasOpscanInConstants,
        'OPSCAN_BASE URL not found in constants.ts. Should contain opscan.org.'
    ).toBe(true);

    expect(
        explorerImportsUrls,
        'ExplorerLinks.tsx does not import mempoolTxUrl or opscanAddressUrl from constants.'
    ).toBe(true);
});
