---
title: opnet.toml Reference
description: Complete reference for the opnet.toml configuration file.
---

# opnet.toml Reference

`opnet.toml` is the configuration file for OPNet Foundry projects, equivalent to Foundry's `foundry.toml`. It controls compilation, testing, deployment, and formatting settings.

## File Location

Place `opnet.toml` in the root of your project directory. op-forge looks for this file automatically when running any command.

## Default Configuration

A new project created with `op-forge init` includes this default configuration:

```toml
[profile.default]
src = "src"
out = "out"
test = "test"
script = "script"
libs = ["node_modules"]
optimizer = true
optimizer_runs = 200
verbosity = 2
gas_reports = ["*"]
fuzz_runs = 256
fuzz_max_test_rejects = 65536

[profile.default.rpc_endpoints]
testnet = "https://testnet.opnet.org"
mainnet = "https://api.opnet.org"

[profile.default.explorers]
testnet_mempool = "https://mempool.opnet.org/testnet4/tx/"
mainnet_mempool = "https://mempool.opnet.org/tx/"
testnet_opscan = "https://opscan.org/accounts/{address}?network=op_testnet"
mainnet_opscan = "https://opscan.org/accounts/{address}?network=op_mainnet"

[profile.default.deploy]
gas_limit = 20000000
simulation = true
confirm = true

[fmt]
line_length = 120
tab_width = 4
bracket_spacing = true
```

## Profile Settings

All project settings live under `[profile.<name>]`. The `default` profile is used unless overridden.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `src` | string | `"src"` | Source directory for contract files |
| `out` | string | `"out"` | Output directory for compiled artifacts |
| `test` | string | `"test"` | Directory containing test files |
| `script` | string | `"script"` | Directory for deployment scripts |
| `libs` | string[] | `["node_modules"]` | Library/dependency directories |
| `optimizer` | boolean | `true` | Enable WASM optimizer |
| `optimizer_runs` | number | `200` | Optimization level |
| `verbosity` | number | `2` | Output verbosity (1-5) |
| `gas_reports` | string[] | `["*"]` | Contracts to include in gas reports (`*` for all) |
| `fuzz_runs` | number | `256` | Number of fuzz test iterations |
| `fuzz_max_test_rejects` | number | `65536` | Max rejected fuzz inputs before failure |

## RPC Endpoints

```toml
[profile.default.rpc_endpoints]
testnet = "https://testnet.opnet.org"
mainnet = "https://api.opnet.org"
```

| Key | Default | Description |
|-----|---------|-------------|
| `testnet` | `https://testnet.opnet.org` | OPNet testnet RPC URL (Signet fork) |
| `mainnet` | `https://api.opnet.org` | OPNet mainnet RPC URL |

Custom RPC endpoints can point to any OPNet-compatible node.

## Explorer URLs

```toml
[profile.default.explorers]
testnet_mempool = "https://mempool.opnet.org/testnet4/tx/"
mainnet_mempool = "https://mempool.opnet.org/tx/"
testnet_opscan = "https://opscan.org/accounts/{address}?network=op_testnet"
mainnet_opscan = "https://opscan.org/accounts/{address}?network=op_mainnet"
```

Explorer URLs are used by deployment commands to print transaction and contract links after deployment.

The `{address}` placeholder in OPScan URLs is replaced with the deployed contract address.

## Deployment Settings

```toml
[profile.default.deploy]
gas_limit = 20000000
simulation = true
confirm = true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `gas_limit` | number | `20000000` | Gas limit for contract deployment (constructor). The OPNet VM enforces a hard 20M limit for constructors. |
| `simulation` | boolean | `true` | Simulate deployment before broadcasting. Always recommended -- BTC transactions are irreversible. |
| `confirm` | boolean | `true` | Prompt for confirmation before broadcasting. |

## Formatting

```toml
[fmt]
line_length = 120
tab_width = 4
bracket_spacing = true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `line_length` | number | `120` | Maximum line length |
| `tab_width` | number | `4` | Indentation width |
| `bracket_spacing` | boolean | `true` | Add spaces inside brackets |

These settings will be used by `op-forge fmt` (coming soon).

## Configuration Resolution

op-forge resolves configuration from multiple sources, with the following precedence (highest wins):

1. **CLI flags** -- e.g., `--out build`
2. **Environment variables** -- e.g., `OPNET_OUT=build`
3. **opnet.toml profile** -- the active profile's settings
4. **Default values** -- built-in defaults

View the resolved configuration for your project:

```bash
op-forge config
```
