---
title: op-chisel
description: Interactive REPL for rapid OPNet contract prototyping.
---

# op-chisel

**op-chisel** is an interactive REPL (Read-Eval-Print Loop) for rapid prototyping of OPNet smart contract code. Write and execute contract snippets without creating a full project.

It is the OPNet equivalent of Ethereum Foundry's `chisel`.

## Status

op-chisel is currently under development. The following capabilities are planned:

### Interactive REPL
- TypeScript-based REPL powered by tsx
- Write AssemblyScript contract snippets and see results immediately
- Auto-import common OPNet types (u256, StoredU256, SafeMath)

### Contract Evaluation
- Compile and execute contract methods in-memory
- Inspect storage state after execution
- Test arithmetic with SafeMath operations

### Session Management
- Save and load REPL sessions
- Export snippets to full contract files
- History and auto-completion

### Integration
- Connect to local op-anvil node or testnet
- Deploy snippets as temporary contracts
- Call existing deployed contracts

## Installation

op-chisel will be available as part of OPNet Foundry:

```bash
pnpm add -g @opnet/cli
```

Once installed, it will be accessible as `op-chisel` from the command line.

## Timeline

op-chisel is the final component in the OPNet Foundry roadmap. The tsx-based REPL portion is straightforward; the AssemblyScript evaluation engine is the primary technical challenge.
