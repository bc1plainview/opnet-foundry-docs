---
title: Troubleshooting
description: Common issues and solutions for OPNet Foundry.
---

# Troubleshooting

## Build Errors

### "Cannot find module @btc-vision/btc-runtime/runtime"

The runtime package is not installed. Add it as a dependency:

```bash
pnpm add @btc-vision/btc-runtime@rc
```

OPNet packages use `@rc` tags. Make sure you include the tag.

### "Cannot find module as-bignum/assembly"

The BigNum library is missing:

```bash
pnpm add as-bignum
```

### asc compilation errors about unknown decorators

If you see errors about `@method`, `@returns`, or `@emit` not being recognized, check that your `asconfig.json` includes the OPNet transform:

```json
{
  "options": {
    "transform": ["@btc-vision/opnet-transform"]
  }
}
```

And install the transform:

```bash
pnpm add -D @btc-vision/opnet-transform@rc
```

### "assemblyscript" conflicts with "@btc-vision/assemblyscript"

OPNet uses a fork of AssemblyScript. Remove the standard package first:

```bash
npm uninstall assemblyscript
pnpm add -D @btc-vision/assemblyscript@rc
```

### Noble hashes version conflict

If you see peer dependency errors related to `@noble/hashes`, add an override to your `package.json`:

```json
{
  "overrides": {
    "@noble/hashes": "2.0.1"
  }
}
```

Then run `pnpm install` again.

## Test Errors

### "No test files found"

op-forge looks for test files matching these patterns:
- `test/**/*.test.ts`
- `test/**/*.spec.ts`

Make sure your test files:
1. Are in the `test/` directory (or whatever `test` is set to in opnet.toml)
2. End with `.test.ts` or `.spec.ts`

### Tests hang or never complete

Ensure you call `Blockchain.dispose()` in your `afterEach` hook:

```typescript
vm.afterEach(() => {
    Blockchain.dispose();
});
```

Without disposal, the VM may hold resources and prevent the process from exiting.

### Assert.expect is not a function

Make sure you import from the correct package:

```typescript
import { opnet, OPNetUnit, Assert, Blockchain } from '@btc-vision/unit-test-framework';
```

## Deployment Errors

### "Simulation failed"

Simulation failures usually indicate a contract error. Common causes:

1. **Out of gas** -- The constructor exceeds 20M gas. Move logic from constructor to `onDeployment`.
2. **Missing dependencies** -- The contract imports a module that isn't available at runtime.
3. **Invalid WASM** -- The build produced invalid WebAssembly. Try `op-forge clean && op-forge build`.

### "Insufficient funds"

The deploying wallet does not have enough BTC to cover the transaction fee. Fund the wallet with testnet BTC from a faucet.

For testnet: request funds from the OPNet testnet faucet or mine blocks if running a local node.

### "Network error" or RPC connection refused

Check your RPC endpoints in `opnet.toml`:

```toml
[profile.default.rpc_endpoints]
testnet = "https://testnet.opnet.org"
mainnet = "https://api.opnet.org"
```

Verify the endpoint is reachable:

```bash
curl https://testnet.opnet.org
```

If using a custom node, ensure it's running and accepting connections.

### Private key format errors

The `--private-key` flag expects WIF (Wallet Import Format):
- Mainnet keys start with `5`, `K`, or `L`
- Testnet keys start with `c`

Do not use raw hex private keys. Convert hex to WIF first.

## Configuration

### "Config file not found" warnings

This is normal if you haven't created an `opnet.toml` file. op-forge uses built-in defaults. Create one to customize:

```bash
op-forge init .
```

Or create `opnet.toml` manually in your project root.

### Environment variables not taking effect

Environment variable names are case-sensitive and must be prefixed with `OPNET_`:

```bash
# Correct
OPNET_VERBOSITY=3 op-forge build

# Wrong -- no prefix
VERBOSITY=3 op-forge build
```

## General

### "op-forge: command not found"

The CLI is not in your PATH. If installed locally in a project:

```bash
npx op-forge --help
```

Or add a script to your `package.json`:

```json
{
  "scripts": {
    "build": "op-forge build",
    "test": "op-forge test"
  }
}
```

### How do I reset everything?

```bash
op-forge clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
op-forge build
```
