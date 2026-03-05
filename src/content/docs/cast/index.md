---
title: op-cast
description: Command-line tool for interacting with OPNet smart contracts and the Bitcoin network.
---

:::note
op-cast is currently in preview. Command availability may change.
:::

**op-cast** is the command-line tool for interacting with deployed OPNet smart contracts, sending transactions, querying on-chain state, and performing conversions -- all from the terminal.

It is the OPNet equivalent of Ethereum Foundry's `cast`. Where op-forge handles the build-test-deploy lifecycle, op-cast handles everything after deployment: reading contract state, writing transactions, managing wallets, and encoding/decoding data.

## Installation

op-cast is included with OPNet Foundry:

```bash
pnpm add -g @btc-vision/foundry
```

Or with npm:

```bash
npm install -g @btc-vision/foundry
```

## Usage

```bash
op-cast <subcommand> [options]
```

## Global Options

| Option | Description |
|--------|-------------|
| `--rpc-url <url>` | OPNet RPC endpoint URL |
| `--network <network>` | Target network: `testnet` or `mainnet` |
| `--private-key <WIF>` | WIF-encoded private key (for write operations) |
| `-h, --help` | Show help |
| `-V, --version` | Show version |

## Command Categories

### Blockchain Queries

Read data from the OPNet network without sending transactions.

| Command | Description |
|---------|-------------|
| `block-number` | Get the latest block number |
| `block` | Get block data by number or hash |
| `tx` | Get transaction data by hash |
| `receipt` | Get a transaction receipt |
| `balance` | Get the BTC balance of an address |
| `code` | Get the deployed bytecode of a contract |
| `storage` | Read a raw storage slot from a contract |
| `gas-params` | Get current gas parameters from the network |
| `chain-id` | Get the chain ID of the connected network |

**Example: Query a block**

```bash
op-cast block 12345 --network testnet
```

**Example: Check a balance**

```bash
op-cast balance bc1p...address --network testnet
```

### Contract Interaction

Call contract methods (read-only) or send transactions (state-changing).

| Command | Description |
|---------|-------------|
| `call` | Call a read-only contract method (does not broadcast) |
| `send` | Send a state-changing transaction to a contract |
| `calldata-encode` | Encode function calldata from a method signature and arguments |
| `calldata-decode` | Decode raw calldata into method name and arguments |
| `abi-encode` | ABI-encode values without a function selector |
| `abi-decode` | ABI-decode raw bytes into typed values |

**Example: Read a contract value**

```bash
op-cast call 0x...contract-address "getCount()" --network testnet
```

**Example: Send a transaction**

```bash
op-cast send 0x...contract-address "increment()" \
  --network testnet \
  --private-key <WIF>
```

**Example: Encode calldata**

```bash
op-cast calldata-encode "transfer(address,uint256)" 0x...to 1000000
```

### Wallet Operations

Generate keypairs, sign messages, and derive addresses.

| Command | Description |
|---------|-------------|
| `wallet new` | Generate a new keypair (ML-DSA quantum-resistant) |
| `wallet sign` | Sign a message with a private key |
| `wallet verify` | Verify a signed message |
| `wallet address` | Derive an address from a public key |

**Example: Generate a new wallet**

```bash
op-cast wallet new
```

**Example: Sign a message**

```bash
op-cast wallet sign "hello world" --private-key <WIF>
```

### Conversion Utilities

Convert between formats and units.

| Command | Description |
|---------|-------------|
| `to-hex` | Convert decimal to hexadecimal |
| `to-dec` | Convert hexadecimal to decimal |
| `to-base58` | Convert hex to base58 encoding |
| `to-wei` | Convert BTC amounts to satoshis (or token amounts to base units) |
| `format-bytes` | Format raw bytes into a readable representation |

**Example: Convert to hex**

```bash
op-cast to-hex 255
# 0xff
```

**Example: Convert BTC to satoshis**

```bash
op-cast to-wei 1.5
# 150000000
```

### Lookup

Resolve identifiers and function signatures.

| Command | Description |
|---------|-------------|
| `namehash` | Compute the namehash of a domain |
| `sig` | Get the 4-byte selector for a function signature |
| `4byte` | Look up a function signature from its 4-byte selector |

**Example: Get a function selector**

```bash
op-cast sig "increment()"
# 0xd09de08a
```

## Configuration

op-cast reads RPC endpoints from `opnet.toml` when available:

```toml
[profile.default.rpc_endpoints]
testnet = "https://testnet.opnet.org"
mainnet = "https://api.opnet.org"
```

The `--rpc-url` flag overrides the config file. The `--network` flag selects which endpoint to use from the config.

## See Also

- [op-cast Commands](/cast/commands/) -- Full command reference with all options
- [op-forge create](/forge/commands/create/) -- Deploy contracts that op-cast can interact with
- [opnet.toml Reference](/configuration/opnet-toml/) -- Configure RPC endpoints
