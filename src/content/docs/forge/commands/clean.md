---
title: "op-forge clean"
description: "Remove build artifacts from the project."
---

Remove compiled WASM, WAT, and other build artifacts from the output directory.

## Usage

```bash
op-forge clean [options]
```

## Options

| Option          | Description            | Default           |
| --------------- | ---------------------- | ----------------- |
| `--root <path>` | Project root directory | Current directory |

## Examples

Clean the current project:

```bash
op-forge clean
```

Clean a project at a specific path:

```bash
op-forge clean --root /path/to/project
```

## Behavior

Removes the following directories:

- `out/` -- Compiled WASM and WAT files
- `build/` -- Intermediate build artifacts

These directories are recreated on the next `op-forge build`.

## When to Use

- Before a fresh build to ensure no stale artifacts
- Before committing (if `out/` is not in `.gitignore`)
- When switching between contract versions or branches
