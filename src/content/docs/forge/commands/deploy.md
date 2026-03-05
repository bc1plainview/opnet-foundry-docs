---
title: "op-forge deploy"
description: "Deploy a compiled contract to the OPNet network."
---

`op-forge deploy` is an alias for [`op-forge create`](/forge/commands/create/). Both commands perform the same operation: read a compiled WASM artifact, simulate the deployment, and broadcast it as a Bitcoin transaction.

This page provides a deployment walkthrough with pre-deployment checks and post-deployment verification. For the full flag reference, see [op-forge create](/forge/commands/create/).

## Usage

```bash
op-forge deploy <contract> --network <network> --private-key <WIF> [options]
```

This is identical to:

```bash
op-forge create <contract> --network <network> --private-key <WIF> [options]
```

## Step-by-Step Deployment Walkthrough

### 1. Build the contract

Compile your AssemblyScript source to WASM:

```bash
op-forge build
```

Verify the output exists:

```bash
ls out/
# Counter.wasm  Counter.wat
```

### 2. Run tests

Run your full test suite before deploying:

```bash
op-forge test
```

Do not deploy a contract with failing tests. Fix all failures first.

### 3. Inspect the artifact

Verify the ABI looks correct and all expected methods are present:

```bash
op-forge inspect Counter abi
op-forge inspect Counter methods
```

Check gas usage for deployment:

```bash
op-forge test --gas-report
```

### 4. Select the target network

| Network | Flag | Use Case |
|---------|------|----------|
| `testnet` | `--network testnet` | Development and testing. Uses testnet BTC (no real value). |
| `mainnet` | `--network mainnet` | Production deployment. Uses real BTC. Irreversible. |

Always deploy to testnet first. Only deploy to mainnet after thorough testing.

### 5. Configure the fee rate

The fee rate determines how quickly your deployment transaction is confirmed. Check current network conditions before choosing:

```bash
op-forge deploy Counter \
  --network testnet \
  --private-key <WIF> \
  --fee-rate 15
```

| Flag | Description | Default |
|------|-------------|---------|
| `--fee-rate <sat/vB>` | Fee rate in satoshis per virtual byte | `15` |
| `--priority-fee <sat>` | Priority fee in satoshis | `1000` |
| `--gas-sat-fee <sat>` | Gas fee in satoshis | `500` |

Higher fee rates mean faster confirmation but cost more BTC.

### 6. Deploy

```bash
op-forge deploy Counter \
  --network testnet \
  --private-key cN3Q...your-WIF-key
```

The command:

1. Reads `out/Counter.wasm`
2. Simulates the deployment to estimate gas and detect errors
3. Shows estimated costs and waits for confirmation (if `confirm = true` in opnet.toml)
4. Signs and broadcasts the Bitcoin transaction
5. Prints the transaction ID, contract address, and explorer links

### 7. Verify the deployment

After the transaction is broadcast, verify it on the explorers:

- **Mempool**: `https://mempool.opnet.org/testnet4/tx/{TXID}` (testnet) or `https://mempool.opnet.org/tx/{TXID}` (mainnet)
- **OPScan**: `https://opscan.org/accounts/{ADDRESS}?network=op_testnet` (testnet) or `op_mainnet` (mainnet)

The deployment command prints these links automatically. Save the contract address -- you will need it for all future interactions.

## Pre-Deployment Checklist

Before deploying, verify each of these:

- [ ] `op-forge build` succeeds with no errors
- [ ] `op-forge test` passes all tests
- [ ] `op-forge inspect <Contract> abi` shows the expected methods
- [ ] `op-forge test --gas-report` shows deployment gas is under 20M
- [ ] Private key is for the correct network (testnet key starts with `c`)
- [ ] Wallet has enough BTC for the deployment fee
- [ ] `onDeployment()` does not make cross-contract calls
- [ ] All storage variables are initialized in `onDeployment()`

## Post-Deployment Verification

After deployment, verify the contract is working:

### Check the transaction

Use op-cast to look up the deployment transaction:

```bash
op-cast tx <TXID> --network testnet
op-cast receipt <TXID> --network testnet
```

### Call a read method

Verify the contract is accessible and returns expected initial values:

```bash
op-cast call <contract-address> "getCount()" --network testnet
```

### Check bytecode

Verify the deployed bytecode matches your local build:

```bash
op-cast code <contract-address> --network testnet
```

## Common Deployment Errors

### Simulation failed -- out of gas

The constructor + `onDeployment()` exceeds the 20M gas limit.

**Fix:** Move computation out of `onDeployment()`. Only set storage pointers in the constructor and initialize default values in `onDeployment()`. Remove any cross-contract calls.

### Simulation failed -- revert

The contract reverted during deployment simulation.

**Fix:** Check that `onDeployment()` does not contain logic that depends on external state. Verify all imported modules are available at deploy time.

### Insufficient funds

The wallet does not have enough BTC for the transaction fee.

**Fix:** Fund the wallet with testnet BTC from a faucet (testnet) or add BTC (mainnet). The estimated fee is printed during simulation.

### Invalid private key format

The `--private-key` flag requires WIF (Wallet Import Format).

- **Mainnet** keys start with `5`, `K`, or `L`
- **Testnet** keys start with `c`

Do not use raw hex private keys. Convert to WIF first.

### Network connection error

Cannot reach the RPC endpoint.

**Fix:** Check your `opnet.toml` RPC configuration:

```toml
[profile.default.rpc_endpoints]
testnet = "https://testnet.opnet.org"
mainnet = "https://api.opnet.org"
```

Verify the endpoint is reachable with:

```bash
curl https://testnet.opnet.org
```

## Security

### Never hardcode private keys

Use environment variables:

```bash
export OPNET_PRIVATE_KEY="cN3Q...your-WIF-key"
op-forge deploy Counter \
  --network testnet \
  --private-key "$OPNET_PRIVATE_KEY"
```

### Never commit keys to version control

Add sensitive files to `.gitignore`:

```
.env
*.key
```

### Always simulate first

Simulation is enabled by default. Skipping it with `--no-simulate` is dangerous because Bitcoin transactions are irreversible -- if the deployment fails on-chain, the fees are still consumed.

## Configuration via opnet.toml

Default deployment settings can be stored in `opnet.toml`:

```toml
[profile.default.deploy]
gas_limit = 20000000
simulation = true
confirm = true
```

CLI flags override these settings. See [opnet.toml Reference](/configuration/opnet-toml/) for all options.

## See Also

- [op-forge create](/forge/commands/create/) -- Full command reference with all flags
- [op-forge build](/forge/commands/build/) -- Compile before deploying
- [op-forge inspect](/forge/commands/inspect/) -- Verify artifacts before deploying
- [op-forge test](/forge/commands/test/) -- Test before deploying
