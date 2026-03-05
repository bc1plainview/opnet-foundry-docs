---
title: op-cast Commands
description: Full command reference for op-cast organized by category.
---

:::note
op-cast is currently in preview. Command availability may change.
:::

Complete reference for all op-cast commands. Each command includes its description, usage, options, and an example.

## Global Options

These options apply to all commands:

| Option | Description |
|--------|-------------|
| `--rpc-url <url>` | OPNet RPC endpoint URL (overrides opnet.toml) |
| `--network <network>` | Target network: `testnet` or `mainnet` |
| `--private-key <WIF>` | WIF-encoded private key (required for write operations) |
| `-h, --help` | Show help for any command |

## Blockchain Queries

### block-number

Get the latest block number from the connected network.

```bash
op-cast block-number [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--rpc-url <url>` | RPC endpoint |

**Example:**

```bash
op-cast block-number --network testnet
# 152847
```

### block

Get block data by number or hash.

```bash
op-cast block [block-id] [options]
```

**Arguments:**

| Argument | Description | Default |
|----------|-------------|---------|
| `block-id` | Block number or hash | Latest block |

**Options:**

| Option | Description |
|--------|-------------|
| `--full` | Include full transaction objects (not just hashes) |
| `--json` | Output as JSON |

**Example:**

```bash
op-cast block 12345 --network testnet --json
```

### tx

Get transaction data by hash.

```bash
op-cast tx <hash> [options]
```

**Example:**

```bash
op-cast tx 0xabc123...def456 --network testnet
```

### receipt

Get a transaction receipt, including status, gas used, and logs.

```bash
op-cast receipt <hash> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--confirmations <n>` | Wait for N confirmations before returning |

**Example:**

```bash
op-cast receipt 0xabc123...def456 --network testnet --json
```

### balance

Get the BTC balance of an address in satoshis.

```bash
op-cast balance <address> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--btc` | Display balance in BTC instead of satoshis |

**Example:**

```bash
op-cast balance bc1p...address --network testnet
# 1500000000

op-cast balance bc1p...address --network testnet --btc
# 15.00000000 BTC
```

### code

Get the deployed bytecode (WASM) of a contract address.

```bash
op-cast code <address> [options]
```

**Example:**

```bash
op-cast code 0x...contract-address --network testnet
```

### storage

Read a raw storage slot from a contract.

```bash
op-cast storage <address> <slot> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `address` | Contract address |
| `slot` | Storage slot (hex or decimal) |

**Example:**

```bash
op-cast storage 0x...contract 0x0 --network testnet
# 0x0000000000000000000000000000000000000000000000000000000000000042
```

### gas-params

Get current gas parameters from the network.

```bash
op-cast gas-params [options]
```

**Example:**

```bash
op-cast gas-params --network testnet
# Gas price: 15 sat/vB
# Block gas limit: 30000000
```

### chain-id

Get the chain ID of the connected network.

```bash
op-cast chain-id [options]
```

**Example:**

```bash
op-cast chain-id --network testnet
# 48899
```

## Contract Interaction

### call

Call a read-only contract method. Does not create a transaction or spend gas.

```bash
op-cast call <address> <signature> [args...] [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `address` | Contract address |
| `signature` | Method signature (e.g., `"getCount()"`) |
| `args` | Method arguments (space-separated) |

**Options:**

| Option | Description |
|--------|-------------|
| `--block <id>` | Block number to query at (default: latest) |
| `--decode <types>` | Decode the return value with the given types |

**Example:**

```bash
# Read a counter value
op-cast call 0x...contract "getCount()" --network testnet
# 0x000000000000000000000000000000000000000000000000000000000000002a

# With return type decoding
op-cast call 0x...contract "getCount()" --network testnet --decode uint256
# 42
```

### send

Send a state-changing transaction to a contract method. Requires a private key.

```bash
op-cast send <address> <signature> [args...] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--private-key <WIF>` | Signing key (required) |
| `--gas-limit <gas>` | Gas limit for the transaction |
| `--fee-rate <sat/vB>` | Fee rate in satoshis per virtual byte |
| `--simulate` | Simulate only, do not broadcast |

**Example:**

```bash
# Increment a counter
op-cast send 0x...contract "increment()" \
  --network testnet \
  --private-key cN3Q...key

# Transfer tokens
op-cast send 0x...token "transfer(address,uint256)" 0x...to 1000000 \
  --network testnet \
  --private-key cN3Q...key
```

### calldata-encode

Encode function calldata from a method signature and arguments.

```bash
op-cast calldata-encode <signature> [args...]
```

**Example:**

```bash
op-cast calldata-encode "transfer(address,uint256)" 0x...to 1000000
# 0xa9059cbb000000000000000000000000...
```

### calldata-decode

Decode raw calldata into method name and arguments.

```bash
op-cast calldata-decode <signature> <data>
```

**Example:**

```bash
op-cast calldata-decode "transfer(address,uint256)" 0xa9059cbb000...
# to: 0x...address
# amount: 1000000
```

### abi-encode

ABI-encode values without a function selector.

```bash
op-cast abi-encode <types> [values...]
```

**Example:**

```bash
op-cast abi-encode "uint256,address" 42 0x...address
```

### abi-decode

ABI-decode raw bytes into typed values.

```bash
op-cast abi-decode <types> <data>
```

**Example:**

```bash
op-cast abi-decode "uint256" 0x000000000000000000000000000000000000000000000000000000000000002a
# 42
```

## Wallet Operations

### wallet new

Generate a new keypair with ML-DSA (quantum-resistant) key material.

```bash
op-cast wallet new [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Example:**

```bash
op-cast wallet new
# Address:     bc1p...xyz
# Private Key: cN3Q...key (WIF)
# Public Key:  02abc...def
# ML-DSA Key:  <hashed ML-DSA public key>
```

### wallet sign

Sign a message with a private key.

```bash
op-cast wallet sign <message> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--private-key <WIF>` | Signing key (required) |

**Example:**

```bash
op-cast wallet sign "hello world" --private-key cN3Q...key
# Signature: 0x...
```

### wallet verify

Verify a signed message against a public key.

```bash
op-cast wallet verify <message> <signature> <address> [options]
```

**Example:**

```bash
op-cast wallet verify "hello world" 0x...sig bc1p...address
# Valid: true
```

### wallet address

Derive an address from a public key.

```bash
op-cast wallet address <public-key> [options]
```

**Example:**

```bash
op-cast wallet address 02abc...def
# bc1p...xyz
```

## Conversion Utilities

### to-hex

Convert a decimal number to hexadecimal.

```bash
op-cast to-hex <value>
```

**Example:**

```bash
op-cast to-hex 255
# 0xff

op-cast to-hex 1000000
# 0xf4240
```

### to-dec

Convert a hexadecimal value to decimal.

```bash
op-cast to-dec <value>
```

**Example:**

```bash
op-cast to-dec 0xff
# 255

op-cast to-dec 0xf4240
# 1000000
```

### to-base58

Convert a hex value to base58 encoding.

```bash
op-cast to-base58 <value>
```

**Example:**

```bash
op-cast to-base58 0x00abc123
# 1Ld...
```

### to-wei

Convert BTC to satoshis, or token amounts to their base unit representation. Named `to-wei` for familiarity with Ethereum tooling -- in OPNet this converts to satoshis.

```bash
op-cast to-wei <value> [decimals]
```

**Arguments:**

| Argument | Description | Default |
|----------|-------------|---------|
| `value` | Human-readable amount | |
| `decimals` | Number of decimal places | `8` (BTC) |

**Example:**

```bash
op-cast to-wei 1.5
# 150000000

op-cast to-wei 1.5 18
# 1500000000000000000
```

### format-bytes

Format raw bytes into a readable hex representation.

```bash
op-cast format-bytes <data>
```

**Example:**

```bash
op-cast format-bytes 0x48656c6c6f
# 48 65 6c 6c 6f  |Hello|
```

## Lookup

### namehash

Compute the namehash of a domain string.

```bash
op-cast namehash <name>
```

**Example:**

```bash
op-cast namehash "mycontract.opnet"
# 0x...
```

### sig

Get the 4-byte function selector for a given function signature.

```bash
op-cast sig <signature>
```

**Example:**

```bash
op-cast sig "increment()"
# 0xd09de08a

op-cast sig "transfer(address,uint256)"
# 0xa9059cbb
```

### 4byte

Reverse-lookup a function signature from its 4-byte selector.

```bash
op-cast 4byte <selector>
```

**Example:**

```bash
op-cast 4byte 0xd09de08a
# increment()

op-cast 4byte 0xa9059cbb
# transfer(address,uint256)
```

## See Also

- [op-cast Overview](/cast/) -- Introduction and quick start
- [op-forge create](/forge/commands/create/) -- Deploy contracts
- [opnet.toml Reference](/configuration/opnet-toml/) -- Configure RPC endpoints
