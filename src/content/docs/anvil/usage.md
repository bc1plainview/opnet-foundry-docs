---
title: op-anvil Usage Guide
description: Detailed usage patterns for the op-anvil local development node.
---

:::note
op-anvil is currently in preview. Command availability may change.
:::

This guide covers common workflows with op-anvil, from basic development to advanced forking and state management.

## Starting the Node

Start a local OPNet node with default settings:

```bash
op-anvil
```

This launches a JSON-RPC server at `http://127.0.0.1:8545` with 10 pre-funded accounts and instant block mining. The startup banner prints all account addresses and their private keys.

To run on a different port:

```bash
op-anvil --port 9545
```

To suppress the startup banner (useful in scripts and CI):

```bash
op-anvil --silent
```

## Forking from Testnet or Mainnet

Forking creates a local copy of remote chain state. Transactions execute locally against real contract data without affecting the actual network.

### Fork from testnet (latest block)

```bash
op-anvil --fork-url https://testnet.opnet.org
```

### Fork from a specific block

Pin to a block number for deterministic behavior across runs:

```bash
op-anvil \
  --fork-url https://testnet.opnet.org \
  --fork-block-number 150000
```

### Fork from mainnet

```bash
op-anvil --fork-url https://api.opnet.org
```

### What happens during forking

1. op-anvil connects to the remote RPC endpoint
2. State is fetched lazily -- only when your transactions touch a particular contract or account
3. Fetched state is cached locally for fast subsequent access
4. New transactions are applied on top of the forked state
5. The remote chain is never modified

### Disable fork caching

For debugging cache-related issues:

```bash
op-anvil \
  --fork-url https://testnet.opnet.org \
  --no-storage-caching
```

## Managing State

### Snapshots

Take a snapshot of the current chain state. Returns a snapshot ID you can use to restore later.

Using the JSON-RPC method:

```bash
# Take a snapshot
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_snapshot","params":[],"id":1}'

# Response: {"jsonrpc":"2.0","id":1,"result":"0x1"}
```

### Rollbacks

Revert to a previous snapshot. All transactions and state changes after the snapshot are discarded.

```bash
# Revert to snapshot 0x1
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_revert","params":["0x1"],"id":1}'
```

### Snapshot/rollback pattern for tests

This pattern is useful for running isolated test scenarios:

```typescript
// Take snapshot before test
const snapshotId = await provider.send('anvil_snapshot', []);

// Run test transactions...
await contract.increment();
await contract.increment();

// Rollback to clean state
await provider.send('anvil_revert', [snapshotId]);

// State is back to pre-test condition
```

### Persisting state to disk

Save chain state when the node shuts down:

```bash
op-anvil --dump-state ./anvil-state.json
```

Load state from a previous session:

```bash
op-anvil --state ./anvil-state.json
```

## Using with op-forge test

op-forge test uses `@btc-vision/unit-test-framework`, which runs an in-process VM by default. To test against a running op-anvil node instead, set the RPC endpoint:

```bash
# Terminal 1: Start op-anvil
op-anvil

# Terminal 2: Run tests against the local node
OPNET_RPC_TESTNET=http://localhost:8545 op-forge test
```

This is useful when:

- You want to test against forked mainnet/testnet state
- You need to verify behavior with real contract deployments
- You want to share a single node across multiple test suites

## Using with Frontend Development

### Configure the provider

Point your frontend's provider at the local node:

```typescript
import { JSONRpcProvider } from '@btc-vision/op-net';
import { networks } from '@btc-vision/bitcoin';

const provider = new JSONRpcProvider({
  url: 'http://localhost:8545',
  network: networks.regtest,
});
```

### Deploy a contract locally

Use op-forge to deploy to your local node:

```bash
op-anvil &

op-forge create Counter \
  --network testnet \
  --private-key cN3Q...key-from-anvil-output \
  --rpc-url http://localhost:8545
```

### Hot reload workflow

1. Start op-anvil
2. Deploy your contract
3. Start your frontend dev server pointed at `localhost:8545`
4. Make contract changes, rebuild, and redeploy -- the frontend sees the new contract immediately

## Custom Accounts and Balances

### More accounts with higher balances

```bash
op-anvil --accounts 50 --balance 1000
```

### Deterministic accounts

Use a mnemonic for reproducible account generation across runs:

```bash
op-anvil --mnemonic "test test test test test test test test test test test junk"
```

The same mnemonic always produces the same set of accounts and private keys.

### Set balance for a specific address

After startup, you can modify any account's balance via RPC:

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"anvil_setBalance",
    "params":["bc1p...address", "0x56BC75E2D63100000"],
    "id":1
  }'
```

### Impersonate an account

Send transactions as any address without its private key (useful for testing access control):

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"anvil_impersonateAccount",
    "params":["bc1p...address"],
    "id":1
  }'
```

## Mining Control

### Manual mining

Disable auto-mining and mine blocks on demand:

```bash
op-anvil --no-mining
```

Then mine blocks via RPC:

```bash
# Mine 1 block
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_mine","params":[1],"id":1}'

# Mine 10 blocks
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_mine","params":[10],"id":1}'
```

### Timed mining

Simulate realistic block times:

```bash
# Mine a block every 10 seconds
op-anvil --block-time 10
```

## Troubleshooting

### Port already in use

```
Error: Address already in use (127.0.0.1:8545)
```

Either stop the existing process or use a different port:

```bash
op-anvil --port 9545
```

### Fork connection refused

```
Error: Could not connect to fork URL
```

Verify the RPC endpoint is reachable:

```bash
curl https://testnet.opnet.org
```

### State too large after long sessions

If the node becomes slow after many transactions, restart with a clean state:

```bash
# Save important state first
# Then restart
op-anvil
```

Or use snapshots to periodically reset to a known good state.

## See Also

- [op-anvil Overview](/anvil/) -- Introduction and key features
- [op-anvil Configuration](/anvil/configuration/) -- Full flag and environment variable reference
- [op-forge test](/forge/commands/test/) -- Running tests
