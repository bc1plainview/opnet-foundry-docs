---
title: op-anvil Configuration
description: Full configuration reference for op-anvil including CLI flags, environment variables, and configuration files.
---

:::note
op-anvil is currently in preview. Configuration options may change.
:::

Complete reference for configuring op-anvil. Settings can be provided via CLI flags, environment variables, or configuration files.

## CLI Flags

### Server Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--port <port>` | number | `8545` | Port for the JSON-RPC server |
| `--host <host>` | string | `127.0.0.1` | Host address to bind |
| `--silent` | boolean | `false` | Suppress startup banner, account list, and request logs |
| `--no-cors` | boolean | `false` | Disable CORS headers (enabled by default for local development) |

### Account Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--accounts <count>` | number | `10` | Number of pre-funded accounts to create at startup |
| `--balance <btc>` | number | `10` | BTC balance for each pre-funded account |
| `--mnemonic <phrase>` | string | Random | BIP-39 mnemonic for deterministic account generation |
| `--derivation-path <path>` | string | `m/86'/0'/0'/0` | HD derivation path for account generation |

### Mining Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--block-time <seconds>` | number | `0` | Auto-mine a block every N seconds. `0` means mine on every transaction. |
| `--no-mining` | boolean | `false` | Disable auto-mining. Blocks are only mined via `anvil_mine` RPC call. |

### Chain Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--chain-id <id>` | number | `31337` | Chain ID for the local network |
| `--gas-limit <gas>` | number | `30000000` | Block gas limit |
| `--gas-price <sat>` | number | `1` | Base gas price in satoshis |
| `--base-fee <sat>` | number | `1` | Base fee per gas unit |

### Fork Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--fork-url <url>` | string | None | RPC URL to fork state from |
| `--fork-block-number <num>` | number | Latest | Block number to fork at (requires `--fork-url`) |
| `--no-storage-caching` | boolean | `false` | Disable caching of forked storage (re-fetch on every read) |

### State Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--state <path>` | string | None | Path to load initial state from a JSON dump |
| `--dump-state <path>` | string | None | Path to write chain state on exit |

## Environment Variables

All CLI flags can be set via environment variables with the `ANVIL_` prefix. Flags with dashes become underscores, and values are uppercased.

| Environment Variable | Equivalent Flag |
|---------------------|-----------------|
| `ANVIL_PORT` | `--port` |
| `ANVIL_HOST` | `--host` |
| `ANVIL_ACCOUNTS` | `--accounts` |
| `ANVIL_BALANCE` | `--balance` |
| `ANVIL_BLOCK_TIME` | `--block-time` |
| `ANVIL_CHAIN_ID` | `--chain-id` |
| `ANVIL_GAS_LIMIT` | `--gas-limit` |
| `ANVIL_FORK_URL` | `--fork-url` |
| `ANVIL_FORK_BLOCK_NUMBER` | `--fork-block-number` |
| `ANVIL_MNEMONIC` | `--mnemonic` |

Environment variables are overridden by CLI flags.

**Example:**

```bash
export ANVIL_PORT=9545
export ANVIL_ACCOUNTS=20
export ANVIL_BALANCE=100
op-anvil
```

## Configuration via opnet.toml

op-anvil reads defaults from the `[anvil]` section of `opnet.toml` when present:

```toml
[anvil]
port = 8545
host = "127.0.0.1"
accounts = 10
balance = 10
block_time = 0
gas_limit = 30000000
chain_id = 31337

[anvil.fork]
url = "https://testnet.opnet.org"
block_number = 150000
```

**Resolution order** (highest priority first):

1. CLI flags
2. Environment variables (`ANVIL_*`)
3. `opnet.toml` `[anvil]` section
4. Built-in defaults

## Common Configurations

### Fast Development (default)

Instant mining, 10 funded accounts, default gas limits:

```bash
op-anvil
```

### Realistic Testnet Simulation

Simulate testnet conditions with timed blocks and matching gas limits:

```bash
op-anvil \
  --block-time 10 \
  --gas-limit 20000000 \
  --chain-id 48899
```

### CI/Test Environment

Silent output, deterministic accounts from a fixed mnemonic:

```bash
op-anvil \
  --silent \
  --accounts 5 \
  --mnemonic "test test test test test test test test test test test junk"
```

### Forking Testnet for Debugging

Fork from a specific block to replay and debug transactions:

```bash
op-anvil \
  --fork-url https://testnet.opnet.org \
  --fork-block-number 152000
```

### High-Gas Stress Testing

Raise the gas limit and fund accounts with more BTC:

```bash
op-anvil \
  --gas-limit 100000000 \
  --balance 1000 \
  --accounts 50
```

## See Also

- [op-anvil Overview](/anvil/) -- Introduction and key features
- [op-anvil Usage Guide](/anvil/usage/) -- Workflows and patterns
- [opnet.toml Reference](/configuration/opnet-toml/) -- Project-level configuration
