---
title: op-chisel Commands
description: Full reference for op-chisel REPL commands, expression evaluation, and session management.
---

:::note
op-chisel is currently in preview. Command availability may change.
:::

Complete reference for op-chisel REPL commands and capabilities.

## REPL Meta-Commands

Meta-commands are prefixed with `!` and control the REPL environment. They are not contract code -- they manage sessions, output, and connections.

### !help

Print a list of all available meta-commands with brief descriptions.

```
> !help

Available commands:
  !help             Show this help message
  !clear            Clear the current session code
  !reset            Reset REPL to initial state
  !save <file>      Save session to a file
  !load <file>      Load a saved session
  !export <file>    Export as a standalone contract file
  !fork <url>       Connect to a running node
  !source           Print current session source code
  !type <expr>      Print the type of an expression
  !gas              Show gas for last expression
  !quit             Exit the REPL
```

### !clear

Clear all code from the current session without exiting the REPL. The OPNet type imports and any active fork connection are preserved.

```
> let x: u256 = u256.fromU64(42);
> !clear
Session cleared.
> x
Error: 'x' is not defined
```

### !reset

Reset the REPL to its initial state. Clears all code, disconnects from any forked node, and resets the in-memory VM.

```
> !reset
REPL reset to initial state.
```

### !save

Save the current session to a file. The file is saved with a `.chisel` extension in the current directory (or the specified path).

```
> !save my-experiment
Saved to my-experiment.chisel
```

```
> !save /path/to/sessions/debug-session
Saved to /path/to/sessions/debug-session.chisel
```

### !load

Load a previously saved session. The current session is replaced with the loaded code.

```
> !load my-experiment
Loaded my-experiment.chisel (12 lines)
```

### !export

Export the current session code as a standalone AssemblyScript contract file ready for use in an op-forge project.

The exported file includes the necessary imports, a contract class wrapper, and all session code organized into methods.

```
> !export MyContract
Exported to MyContract.ts

// Generated file:
import { OP_NET, Blockchain, SafeMath, StoredU256 } from '@btc-vision/btc-runtime/runtime';
import { u256 } from 'as-bignum/assembly';

export class MyContract extends OP_NET {
  // ... session code as contract methods
}
```

### !fork

Connect to a running op-anvil node or a remote OPNet RPC endpoint. Once connected, you can read chain state, call contracts, and interact with deployed code.

```
> !fork http://localhost:8545
Connected to op-anvil at http://localhost:8545 (block #42)
```

```
> !fork https://testnet.opnet.org
Connected to OPNet testnet (block #152847)
```

To disconnect:

```
> !fork off
Disconnected from node.
```

### !source

Print the full source code accumulated in the current session.

```
> let x: u256 = u256.fromU64(10);
> let y: u256 = SafeMath.mul(x, u256.fromU64(5));
> !source
let x: u256 = u256.fromU64(10);
let y: u256 = SafeMath.mul(x, u256.fromU64(5));
```

### !type

Print the inferred type of an expression without evaluating it.

```
> !type SafeMath.add(u256.One, u256.One)
u256

> !type new StoredU256(0)
StoredU256

> !type Blockchain.blockNumber
u256
```

### !gas

Show the gas consumed by the last evaluated expression. If the last expression was not executable (e.g., a type declaration), shows 0.

```
> SafeMath.add(u256.fromU64(100), u256.fromU64(200))
u256: 300

> !gas
Gas used: 1,245
```

### !quit

Exit the REPL. If the session has unsaved changes, op-chisel prompts for confirmation.

```
> !quit
Session has unsaved changes. Quit anyway? (y/n)
```

Use `Ctrl+D` as a shortcut for `!quit`.

## Expression Evaluation

Any input that is not a meta-command is evaluated as AssemblyScript code in the REPL context.

### Simple expressions

```
> u256.fromU64(42)
u256: 42

> SafeMath.add(u256.fromU64(10), u256.fromU64(20))
u256: 30
```

### Variable declarations

Variables persist across lines within a session:

```
> let balance: u256 = u256.fromU64(1000000);
> let fee: u256 = u256.fromU64(500);
> SafeMath.sub(balance, fee)
u256: 999500
```

### Multi-line input

op-chisel detects incomplete expressions (unclosed braces, parentheses) and waits for continuation lines:

```
> if (SafeMath.gt(balance, u256.Zero)) {
...   SafeMath.sub(balance, u256.One)
... }
u256: 999999
```

### Storage operations

Test persistent storage without deploying:

```
> let counter = new StoredU256(0);
> counter.set(u256.fromU64(100));
> counter.get()
u256: 100

> counter.set(SafeMath.add(counter.get(), u256.One));
> counter.get()
u256: 101
```

### Method definitions

Define and call contract methods:

```
> function doubleIt(val: u256): u256 {
...   return SafeMath.mul(val, u256.fromU64(2));
... }
> doubleIt(u256.fromU64(21))
u256: 42
```

## Type Inspection

Use `!type` to check types before evaluation. This is especially useful for complex expressions:

```
> !type u256.fromU64(42)
u256

> !type SafeMath.add(u256.One, u256.One)
u256

> !type new StoredU256(0)
StoredU256

> !type [u256.One, u256.fromU64(2)]
StaticArray<u256>
```

## Session Management

### Workflow: Experiment then export

A typical chisel workflow:

1. Start a session and experiment with contract logic
2. Refine until the logic works correctly
3. Save the session for reference
4. Export to a contract file for use in an op-forge project

```bash
$ op-chisel

> let threshold: u256 = u256.fromU64(100);
> let count = new StoredU256(0);

> function incrementIfBelow(limit: u256): u256 {
...   const current = count.get();
...   if (SafeMath.lt(current, limit)) {
...     const next = SafeMath.add(current, u256.One);
...     count.set(next);
...     return next;
...   }
...   return current;
... }

> incrementIfBelow(threshold)
u256: 1

> !save bounded-counter
Saved to bounded-counter.chisel

> !export BoundedCounter
Exported to BoundedCounter.ts
```

### Loading sessions on startup

Skip the interactive startup and load directly into a saved session:

```bash
op-chisel --load bounded-counter.chisel
```

### Session file format

`.chisel` files are plain text containing the TypeScript code from the session, one statement per line. They can be edited in any text editor.

## Integration with op-anvil

When connected to a running op-anvil instance, chisel gains access to:

### Reading chain state

```
> !fork http://localhost:8545

> Blockchain.blockNumber
u256: 42

> Blockchain.getBalance(Address.fromString(hashedKey, tweakedKey))
u256: 1000000000
```

### Calling deployed contracts

```
> !fork http://localhost:8545

> // Assuming a Counter contract is deployed
> let result = op-cast call 0x...contract "getCount()"
u256: 15
```

### Deploying temporary contracts

Code written in the REPL can be compiled and deployed to the connected node as a temporary contract for testing.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Autocomplete type names, methods, and REPL commands |
| `Up/Down` | Navigate command history |
| `Ctrl+C` | Cancel current input |
| `Ctrl+D` | Exit the REPL |
| `Ctrl+L` | Clear the screen |
| `Ctrl+R` | Reverse search through history |

## See Also

- [op-chisel Overview](/chisel/) -- Introduction and key features
- [op-anvil](/anvil/) -- Local development node for paired use with chisel
- [Contract Development](/getting-started/contract-development/) -- Full guide to writing OPNet contracts
