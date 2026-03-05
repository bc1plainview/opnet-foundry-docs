---
title: op-anvil
description: Local OPNet node for development and testing.
---

:::note
op-anvil is currently in preview. Command availability may change.
:::

**op-anvil** is a lightweight local OPNet development node. It runs an in-process OPNet VM with instant block mining, pre-funded test accounts, and a JSON-RPC interface -- giving you a fast, deterministic environment for contract development and testing.

It is the OPNet equivalent of Ethereum Foundry's `anvil`. Instead of waiting for testnet block confirmations, op-anvil mines blocks instantly, letting you iterate on contracts in seconds.

## Installation

op-anvil is included with OPNet Foundry:

```bash
pnpm add -g @btc-vision/foundry
```

Or with npm:

```bash
npm install -g @btc-vision/foundry
```

## Key Features

### Instant Block Mining

Blocks are mined immediately when a transaction is submitted. No waiting for confirmations. You can also configure automatic mining at fixed intervals with `--block-time`.

### Pre-Funded Test Accounts

op-anvil starts with 10 pre-funded accounts (configurable with `--accounts`). Each account has a known private key printed at startup, making it simple to test deployments and contract interactions without faucets.

### JSON-RPC Interface

Exposes a JSON-RPC server compatible with the OPNet provider (`JSONRpcProvider`). Point your frontend or scripts at `http://localhost:8545` and interact with the local node the same way you would with testnet.

### State Snapshots and Rollbacks

Take a snapshot of the current chain state, run a series of transactions, then roll back to the snapshot. Useful for test isolation and exploratory debugging.

### Configurable Gas and Block Parameters

Set custom gas limits, gas prices, and block sizes. Simulate different network conditions without waiting for real chain behavior.

### Chain Forking

Fork from OPNet testnet or mainnet at any block height. Run local transactions against real chain state. Forked data is cached for fast subsequent runs.

## Usage

```bash
op-anvil [options]
```

Running `op-anvil` with no arguments starts a local node on `http://127.0.0.1:8545` with default settings.

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--port <port>` | Port for the JSON-RPC server | `8545` |
| `--host <host>` | Host address to bind | `127.0.0.1` |
| `--accounts <count>` | Number of pre-funded accounts to create | `10` |
| `--balance <btc>` | BTC balance for each pre-funded account | `10` |
| `--block-time <seconds>` | Auto-mine a block every N seconds (0 = mine on transaction) | `0` |
| `--fork-url <url>` | RPC URL to fork from (testnet or mainnet) | None |
| `--fork-block-number <num>` | Block number to fork from (requires `--fork-url`) | Latest |
| `--gas-limit <gas>` | Block gas limit | `30000000` |
| `--chain-id <id>` | Chain ID for the local network | `31337` |
| `--silent` | Suppress startup banner and account list | `false` |
| `-h, --help` | Show help | |
| `-V, --version` | Show version | |

## Examples

### Start a basic local node

```bash
op-anvil
```

Output:

```
op-anvil v0.1.0

Available Accounts
==================
(0) bc1p...aaa (10 BTC)
(1) bc1p...bbb (10 BTC)
...
(9) bc1p...jjj (10 BTC)

Private Keys
==================
(0) cN3Q...key0
(1) cN3Q...key1
...
(9) cN3Q...key9

Listening on 127.0.0.1:8545
```

### Fork from testnet

Run a local node backed by real testnet state:

```bash
op-anvil --fork-url https://testnet.opnet.org
```

### Fork from a specific block

Pin to a specific block for deterministic replay:

```bash
op-anvil \
  --fork-url https://testnet.opnet.org \
  --fork-block-number 150000
```

### Custom gas limit and accounts

```bash
op-anvil \
  --gas-limit 50000000 \
  --accounts 20 \
  --balance 100
```

### Auto-mine every 5 seconds

Simulate realistic block timing:

```bash
op-anvil --block-time 5
```

### Use with op-forge test

Point the test runner at your local node:

```bash
# Terminal 1: Start the local node
op-anvil

# Terminal 2: Run tests against it
OPNET_RPC_TESTNET=http://localhost:8545 op-forge test
```

### Use with a frontend

Configure your provider to connect to the local node:

```typescript
import { JSONRpcProvider } from '@btc-vision/op-net';

const provider = new JSONRpcProvider({
  url: 'http://localhost:8545',
  network: networks.regtest,
});
```

## JSON-RPC Methods

op-anvil supports the standard OPNet JSON-RPC methods plus additional development methods:

| Method | Description |
|--------|-------------|
| `opnet_blockNumber` | Get the current block number |
| `opnet_getBlockByNumber` | Get a block by number |
| `opnet_getTransactionByHash` | Get a transaction by hash |
| `opnet_call` | Simulate a contract call |
| `opnet_sendTransaction` | Send a transaction |
| `anvil_snapshot` | Take a state snapshot (returns snapshot ID) |
| `anvil_revert` | Revert to a previous snapshot |
| `anvil_mine` | Mine a specified number of blocks |
| `anvil_setBalance` | Set the balance of an address |
| `anvil_impersonateAccount` | Send transactions as any address |

## See Also

- [op-anvil Configuration](/anvil/configuration/) -- Full reference for all flags and environment variables
- [op-anvil Usage Guide](/anvil/usage/) -- Detailed usage patterns and workflows
- [op-forge test](/forge/commands/test/) -- Run tests against a local op-anvil node
