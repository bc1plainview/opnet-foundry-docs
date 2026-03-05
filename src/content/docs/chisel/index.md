---
title: op-chisel
description: Interactive REPL for rapid OPNet contract prototyping.
---

:::note
op-chisel is currently in preview. Command availability may change.
:::

**op-chisel** is an interactive REPL (Read-Eval-Print Loop) for rapid prototyping of OPNet smart contract code. Write contract snippets, evaluate expressions, and test logic without creating a full project or running a build pipeline.

It is the OPNet equivalent of Ethereum Foundry's `chisel`. Where op-forge requires a project structure and build step, op-chisel lets you experiment with contract code in real time.

## Installation

op-chisel is included with OPNet Foundry:

```bash
pnpm add -g @btc-vision/foundry
```

Or with npm:

```bash
npm install -g @btc-vision/foundry
```

## Key Features

### TypeScript-Based REPL

op-chisel runs a TypeScript REPL powered by tsx. You write code in the same language used for OPNet contracts, with full type checking and autocomplete.

### Auto-Imports of OPNet Types

Common OPNet types are available immediately without explicit imports:

- `u256` -- 256-bit unsigned integer
- `StoredU256`, `StoredString`, `StoredBoolean` -- Persistent storage types
- `SafeMath` -- Overflow-safe arithmetic operations
- `Address` -- OPNet address type
- `Blockchain` -- Access to block data and chain state
- `OP_NET` -- Base contract class

### In-Memory Contract Compilation and Execution

Write a contract method, and op-chisel compiles and executes it in an in-memory VM. See the result immediately -- no disk I/O, no build artifacts, no deployment.

### Session Save and Load

Save your REPL session to a file and load it later to continue where you left off. Export completed snippets to standalone contract files ready for op-forge.

### History and Tab Completion

Full readline support with command history (persisted across sessions) and tab completion for OPNet types, methods, and REPL commands.

## Usage

```bash
op-chisel [options]
```

Running `op-chisel` with no arguments starts an interactive session.

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--fork-url <url>` | Connect to a running op-anvil or testnet node | None |
| `--no-color` | Disable colored output | `false` |
| `--load <file>` | Load a saved session on startup | None |
| `-h, --help` | Show help | |
| `-V, --version` | Show version | |

## REPL Commands

Commands prefixed with `!` are meta-commands that control the REPL itself:

| Command | Description |
|---------|-------------|
| `!help` | Show all available REPL commands |
| `!clear` | Clear the current session code (keep the REPL running) |
| `!reset` | Reset the REPL to its initial state |
| `!save <file>` | Save the current session to a file |
| `!load <file>` | Load a previously saved session |
| `!export <file>` | Export the current code as a standalone `.ts` contract file |
| `!fork <url>` | Connect to a running node (op-anvil or testnet RPC) |
| `!source` | Print the full source code of the current session |
| `!type <expr>` | Print the inferred type of an expression |
| `!gas` | Show gas consumption for the last evaluated expression |
| `!quit` | Exit the REPL |

## Example Session

```
$ op-chisel

Welcome to op-chisel v0.1.0
Type !help for available commands.

> let x: u256 = u256.fromU64(42);
> let y: u256 = u256.fromU64(8);
> SafeMath.add(x, y)
u256: 50

> SafeMath.mul(x, y)
u256: 336

> SafeMath.div(x, u256.Zero)
Revert: Division by zero

> !source
let x: u256 = u256.fromU64(42);
let y: u256 = u256.fromU64(8);

> !clear
Session cleared.
```

### Testing Storage Logic

```
> let counter = new StoredU256(0);
> counter.set(u256.fromU64(100));
> counter.get()
u256: 100

> let next = SafeMath.add(counter.get(), u256.One);
> counter.set(next);
> counter.get()
u256: 101
```

### Evaluating Contract Methods

Write a method body and execute it directly:

```
> @method()
  public increment(calldata: Uint8Array): Uint8Array {
    const current = this.count.get();
    const next = SafeMath.add(current, u256.One);
    this.count.set(next);
    return next.toUint8Array();
  }

Compiled. Gas used: 45,230.
Return: Uint8Array [0, 0, ..., 1]
```

### Connecting to a Running Node

```
> !fork http://localhost:8545
Connected to op-anvil at http://localhost:8545 (block #42)

> Blockchain.blockNumber
u256: 42
```

## Session Files

Saved sessions are plain TypeScript files with a `.chisel` extension. They can be loaded into any session or converted to full contract files with `!export`.

```bash
# Save your work
> !save my-experiment

# In a new session, pick up where you left off
op-chisel --load my-experiment.chisel
```

## Integration with op-anvil

When connected to a running op-anvil instance via `--fork-url` or `!fork`, op-chisel can:

- Read contract storage from the local chain
- Deploy temporary contracts and call their methods
- Access block data and chain state

This combination is useful for debugging contract behavior against real (or forked) state.

## See Also

- [op-chisel Commands](/chisel/commands/) -- Full REPL command reference
- [op-anvil](/anvil/) -- Local development node to pair with op-chisel
- [Contract Development](/getting-started/contract-development/) -- Full guide to writing OPNet contracts
