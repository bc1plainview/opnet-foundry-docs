---
title: Profiles
description: Use configuration profiles to manage different environments.
---

Profiles let you define different configurations for different environments -- development, CI, production, etc. This mirrors Foundry's profile system.

## How Profiles Work

Each profile is defined under `[profile.<name>]` in `opnet.toml`. The `default` profile is always the base. Other profiles inherit from `default` and override specific values.

```toml
# Base configuration
[profile.default]
src = "src"
out = "out"
optimizer = true
verbosity = 2

# CI profile -- lower verbosity, different output
[profile.ci]
out = "artifacts"
verbosity = 1
optimizer_runs = 1000

# Production profile -- strict settings for mainnet
[profile.production]
verbosity = 1
optimizer_runs = 500

[profile.production.deploy]
gas_limit = 20000000
simulation = true
confirm = true

[profile.production.rpc_endpoints]
mainnet = "https://api.opnet.org"
```

## Selecting a Profile

### Environment Variable

Set the `OPNET_PROFILE` environment variable:

```bash
# Use the CI profile
OPNET_PROFILE=ci op-forge build

# Use the production profile
OPNET_PROFILE=production op-forge create MyContract --network mainnet --private-key <WIF>
```

### CLI Flag

Use the `--profile` flag with the `config` command:

```bash
# View resolved config for the CI profile
op-forge config --profile ci
```

### Default

If no profile is specified, `default` is used.

## Environment Variable Overrides

Individual settings can be overridden with environment variables, regardless of the active profile:

| Environment Variable | Config Key | Example |
|---------------------|------------|---------|
| `OPNET_SRC` | `src` | `OPNET_SRC=contracts` |
| `OPNET_OUT` | `out` | `OPNET_OUT=artifacts` |
| `OPNET_TEST` | `test` | `OPNET_TEST=tests` |
| `OPNET_SCRIPT` | `script` | `OPNET_SCRIPT=scripts` |
| `OPNET_VERBOSITY` | `verbosity` | `OPNET_VERBOSITY=3` |
| `OPNET_RPC_TESTNET` | `rpc_endpoints.testnet` | `OPNET_RPC_TESTNET=http://localhost:8545` |
| `OPNET_RPC_MAINNET` | `rpc_endpoints.mainnet` | `OPNET_RPC_MAINNET=https://my-node.example.com` |

Environment variables take precedence over the opnet.toml file but are overridden by CLI flags.

## Resolution Order

```
CLI flags (highest priority)
    |
Environment variables (OPNET_*)
    |
opnet.toml active profile
    |
Default values (lowest priority)
```

## Example: CI Configuration

A typical CI setup in GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: op-forge build
        env:
          OPNET_PROFILE: ci
      - run: op-forge test
        env:
          OPNET_PROFILE: ci
```
