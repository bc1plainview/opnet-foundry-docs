---
title: "op-forge create"
description: "Deploy a compiled contract to the OPNet network."
---

Deploy a compiled contract to the OPNet testnet or mainnet. This is the deployment command -- `op-forge create` reads your compiled WASM artifact, simulates the deployment, and broadcasts it as a Bitcoin transaction.

## Usage

```bash
op-forge create <contract> [options]
```

`<contract>` is the name of the contract as it appears in your `out/` directory (e.g., `Counter` for `out/Counter.wasm`).

## Required Options

| Option                      | Description                        |
| --------------------------- | ---------------------------------- |
| `--network <network>`       | Target network: `testnet` or `mainnet` |
| `--private-key <WIF>`       | WIF-encoded private key for signing |

## Options

| Option                      | Description                        | Default      |
| --------------------------- | ---------------------------------- | ------------ |
| `--fee-rate <sat/vB>`       | Fee rate in satoshis per virtual byte | `15`       |
| `--priority-fee <sat>`      | Priority fee in satoshis           | `1000`       |
| `--gas-sat-fee <sat>`       | Gas fee in satoshis                | `500`        |
| `--gas-limit <gas>`         | Maximum gas for deployment         | `20000000`   |
| `--no-simulate`             | Skip simulation before broadcasting | `false`     |

## Examples

Deploy Counter to testnet:

```bash
op-forge create Counter \
  --network testnet \
  --private-key cN3Q...your-WIF-key
```

Deploy with custom fee rate:

```bash
op-forge create Counter \
  --network testnet \
  --private-key cN3Q...your-WIF-key \
  --fee-rate 25
```

Deploy to mainnet:

```bash
op-forge create Counter \
  --network mainnet \
  --private-key L4x...your-WIF-key
```

Deploy with maximum gas:

```bash
op-forge create Counter \
  --network testnet \
  --private-key cN3Q...your-WIF-key \
  --gas-limit 20000000
```

## Deployment Process

The `create` command follows this sequence:

1. **Load artifact** -- Reads `out/<contract>.wasm`
2. **Simulate** -- Runs the deployment in a simulation to estimate gas and detect errors
3. **Confirm** -- Shows estimated costs and asks for confirmation (if `confirm = true` in config)
4. **Broadcast** -- Signs and broadcasts the Bitcoin transaction
5. **Report** -- Prints the transaction ID, contract address, and explorer links

## Simulation

By default, `create` always simulates the deployment before broadcasting. Simulation catches errors like:

- Bytecode that exceeds the gas limit
- Invalid contract initialization
- Insufficient funds

To skip simulation (not recommended):

```bash
op-forge create Counter \
  --network testnet \
  --private-key <WIF> \
  --no-simulate
```

Skipping simulation is dangerous. If the deployment transaction fails on-chain, the Bitcoin fees are still consumed.

## Gas Limits

The constructor gas limit is hardcoded at **20,000,000**. This limit applies to the `onDeployment()` method execution during contract creation.

Keep your `onDeployment()` method simple:

- Initialize storage pointers and set default values
- Do not make cross-contract calls
- Do not perform expensive computation

If deployment reverts consuming all gas, check:

1. Cross-contract calls in `onDeployment()` -- remove them
2. Calldata encoding mismatch -- verify ABI encoding
3. Missing `asconfig.json` features

## Explorer Links

After successful deployment, the command prints links to view the transaction:

- **Mempool**: `https://mempool.opnet.org/testnet4/tx/{TXID}` (testnet) or `https://mempool.opnet.org/tx/{TXID}` (mainnet)
- **OPScan**: `https://opscan.org/accounts/{ADDRESS}?network=op_testnet` (testnet) or `op_mainnet` (mainnet)

## Security

Never hardcode your private key in scripts or commit it to version control. Use environment variables:

```bash
export OPNET_PRIVATE_KEY="cN3Q...your-WIF-key"
op-forge create Counter --network testnet --private-key "$OPNET_PRIVATE_KEY"
```

## See Also

- [op-forge build](/forge/commands/build/) -- Compile contracts before deploying
- [op-forge inspect](/forge/commands/inspect/) -- Inspect compiled artifacts
- [opnet.toml deploy section](/configuration/opnet-toml/) -- Configure default deployment settings
