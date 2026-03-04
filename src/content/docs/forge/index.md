---
title: op-forge
description: The OPNet smart contract build, test, and deployment tool.
---

`op-forge` is the core tool in the OPNet Foundry suite. It handles the entire smart contract lifecycle: project scaffolding, compilation, testing, artifact inspection, gas tracking, and deployment.

## Usage

```bash
op-forge <command> [options]
```

## Commands

| Command                                    | Description                           |
| ------------------------------------------ | ------------------------------------- |
| [init](/forge/commands/init/)               | Scaffold a new project from a template |
| [build](/forge/commands/build/)             | Compile AssemblyScript contracts to WASM |
| [test](/forge/commands/test/)               | Run contract tests                     |
| [create](/forge/commands/create/)           | Deploy a compiled contract             |
| [clean](/forge/commands/clean/)             | Remove build artifacts                 |
| [config](/forge/commands/config/)           | Display resolved configuration         |
| [inspect](/forge/commands/inspect/)         | Inspect contract artifacts (ABI, bytecode) |
| [install](/forge/commands/install/)         | Install a dependency via pnpm          |
| [snapshot](/forge/commands/snapshot/)       | Save or compare gas usage snapshots    |

## Upcoming Commands

These commands are planned but not yet implemented:

`fmt`, `coverage`, `script`, `debug`, `verify-contract`, `doc`, `flatten`, `tree`, `remappings`, `selectors`, `cache`, `update`, `remove`

## Global Options

```
--root <path>     Project root directory (default: current directory)
-h, --help        Show help
-V, --version     Show version
```

## Configuration

op-forge reads configuration from `opnet.toml` in your project root. See the [opnet.toml reference](/configuration/opnet-toml/) for all available settings.

Configuration is resolved in this order (highest priority first):

1. CLI flags
2. Environment variables (`OPNET_*`)
3. `opnet.toml` profile settings
4. Built-in defaults

## Project Structure

A typical op-forge project:

```
my-project/
  src/              # Contract source files (.ts)
  test/             # Test files (.test.ts, .spec.ts)
  out/              # Compiled artifacts (WASM, WAT, ABI)
  opnet.toml        # Project configuration
  asconfig.json     # AssemblyScript compiler settings
  package.json
  tsconfig.json
```

## Templates

op-forge includes three project templates:

| Template  | Description                               |
| --------- | ----------------------------------------- |
| `default` | Counter contract -- basic state and methods |
| `op20`    | OP-20 fungible token                       |
| `op721`   | OP-721 non-fungible token                  |

Use templates with `op-forge init`:

```bash
op-forge init my-token --template op20
```
