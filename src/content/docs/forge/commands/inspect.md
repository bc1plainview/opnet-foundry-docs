---
title: "op-forge inspect"
description: "Inspect compiled contract artifacts including ABI, bytecode, methods, and storage layout."
---

Inspect various aspects of a compiled contract artifact. Useful for verifying the ABI, checking bytecode, listing methods, or viewing the storage layout.

## Usage

```bash
op-forge inspect <contract> [kind] [options]
```

`<contract>` is the contract name as it appears in your `out/` directory.

`[kind]` specifies what to inspect. Defaults to `abi`.

## Inspection Kinds

| Kind               | Description                                    |
| ------------------ | ---------------------------------------------- |
| `abi`              | Print the contract ABI (default)               |
| `bytecode`         | Print the raw WASM bytecode as hex             |
| `methods`          | List all public methods with their selectors   |
| `storage-layout`   | Show the contract storage layout               |

## Options

| Option          | Description            | Default           |
| --------------- | ---------------------- | ----------------- |
| `--root <path>` | Project root directory | Current directory |

## Examples

Inspect the ABI (default):

```bash
op-forge inspect Counter
```

List all public methods:

```bash
op-forge inspect Counter methods
```

View the bytecode:

```bash
op-forge inspect Counter bytecode
```

Show storage layout:

```bash
op-forge inspect Counter storage-layout
```

Inspect a contract in a different project:

```bash
op-forge inspect Counter abi --root /path/to/project
```

## Output Examples

### ABI

```json
[
  {
    "name": "getCount",
    "inputs": [],
    "outputs": [{ "type": "u256" }]
  },
  {
    "name": "increment",
    "inputs": [],
    "outputs": [{ "type": "u256" }]
  }
]
```

### Methods

```
getCount    -> selector: 0xa87d942c
increment   -> selector: 0xd09de08a
```

## Prerequisites

The contract must be compiled first. Run `op-forge build` before inspecting.

```bash
op-forge build
op-forge inspect Counter
```

## See Also

- [op-forge build](/forge/commands/build/) -- Compile contracts before inspecting
