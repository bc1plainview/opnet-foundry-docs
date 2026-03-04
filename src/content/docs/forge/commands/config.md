---
title: "op-forge config"
description: "Display the resolved project configuration."
---

Print the fully resolved configuration for your project, showing all settings after merging defaults, `opnet.toml`, environment variables, and CLI flags.

## Usage

```bash
op-forge config [options]
```

## Options

| Option              | Description                        | Default           |
| ------------------- | ---------------------------------- | ----------------- |
| `--root <path>`     | Project root directory             | Current directory |
| `--profile <name>`  | Configuration profile to display   | `default`         |

## Examples

Show the default profile configuration:

```bash
op-forge config
```

Show a specific profile:

```bash
op-forge config --profile production
```

Show config for a different project:

```bash
op-forge config --root /path/to/project
```

## Output

The command prints the resolved configuration as TOML:

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

[profile.default.deploy]
gas_limit = 20000000
simulation = true
confirm = true
```

## Configuration Resolution

Settings are resolved in this order (highest priority first):

1. **CLI flags** -- Options passed directly to commands
2. **Environment variables** -- Variables prefixed with `OPNET_`
3. **`opnet.toml` profile** -- Settings in the active profile
4. **Defaults** -- Built-in default values

Use this command to verify that your configuration is correct, especially when debugging deployment or build issues.

## See Also

- [opnet.toml Reference](/configuration/opnet-toml/) -- Full configuration file documentation
- [Profiles](/configuration/profiles/) -- Using multiple configuration profiles
