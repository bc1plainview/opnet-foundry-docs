---
title: "op-forge init"
description: "Scaffold a new OPNet contract project from a template."
---

Create a new OPNet contract project with boilerplate code, configuration files, and a test setup.

## Usage

```bash
op-forge init [name] [options]
```

If `name` is omitted, the project is created in the current directory.

## Options

| Option                      | Description                              | Default   |
| --------------------------- | ---------------------------------------- | --------- |
| `-t, --template <template>` | Project template to use                  | `default` |
| `--force`                   | Overwrite existing files without prompting | `false`   |

## Templates

| Template  | Description                                 |
| --------- | ------------------------------------------- |
| `default` | Counter contract with basic state management |
| `op20`    | OP-20 fungible token with standard interface |
| `op721`   | OP-721 non-fungible token                    |

## Examples

Create a project named `my-contract` using the default template:

```bash
op-forge init my-contract
```

Create an OP-20 token project:

```bash
op-forge init my-token --template op20
```

Create a project in the current directory:

```bash
mkdir my-project && cd my-project
op-forge init
```

Force overwrite existing files:

```bash
op-forge init my-contract --force
```

## Generated Structure

```
my-contract/
  src/
    Counter.ts          # Contract source
  test/
    Counter.test.ts     # Test file
  asconfig.json         # AssemblyScript compiler settings
  opnet.toml            # OPNet project configuration
  package.json          # Dependencies and scripts
  tsconfig.json         # TypeScript configuration
```

## After Initialization

The command prints next steps:

```bash
cd my-contract
pnpm install
op-forge build
op-forge test
```

Install dependencies with `pnpm install` before building. The project uses pnpm as its package manager.

## Behavior

- Sets `package.json` `name` field to the project name
- Copies all template files into the target directory
- Does not run `pnpm install` automatically -- you need to run it yourself
- Fails if the target directory is not empty (unless `--force` is passed)
