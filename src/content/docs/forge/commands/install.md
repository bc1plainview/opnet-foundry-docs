---
title: "op-forge install"
description: "Install a dependency via pnpm."
---

Install a package dependency into your project using pnpm.

## Usage

```bash
op-forge install <package> [options]
```

## Options

| Option          | Description                       | Default           |
| --------------- | --------------------------------- | ----------------- |
| `--dev`         | Install as a dev dependency       | `false`           |
| `--root <path>` | Project root directory           | Current directory |

## Examples

Install a runtime dependency:

```bash
op-forge install @btc-vision/btc-runtime
```

Install a dev dependency:

```bash
op-forge install @btc-vision/unit-test-framework --dev
```

Install in a different project:

```bash
op-forge install some-package --root /path/to/project
```

## Behavior

This command is a convenience wrapper around `pnpm add`. It runs:

- `pnpm add <package>` for runtime dependencies
- `pnpm add -D <package>` for dev dependencies

The command respects the project root specified by `--root` or the current directory.

## OPNet Package Tags

When installing OPNet packages, use the `@rc` tag for release candidate versions:

```bash
op-forge install @btc-vision/btc-runtime@rc
op-forge install @btc-vision/unit-test-framework@rc --dev
```

## See Also

- [op-forge init](/forge/commands/init/) -- Scaffold a project with dependencies pre-configured
