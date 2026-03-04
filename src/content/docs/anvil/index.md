---
title: op-anvil
description: Local OPNet node for development and testing.
---

# op-anvil

**op-anvil** is a lightweight local OPNet node for development and testing. It provides instant block confirmation and a controllable environment for contract development.

It is the OPNet equivalent of Ethereum Foundry's `anvil`.

## Status

op-anvil is currently under development. The following capabilities are planned:

### Local Development Node
- Lightweight mock VM for OPNet contract execution
- Instant block mining (no waiting for confirmations)
- Pre-funded accounts for testing
- Configurable gas limits and fee rates

### Testing Features
- State snapshots and rollbacks
- Time manipulation (advance blocks/timestamps)
- Impersonation of arbitrary addresses
- Logging and tracing of contract execution

### RPC Server
- JSON-RPC interface compatible with OPNet provider
- WebSocket support for event subscriptions
- Configurable port and host

### Chain Forking
- Fork from testnet or mainnet at any block height
- Local overrides on top of forked state
- Replay historical transactions

## Installation

op-anvil will be available as part of OPNet Foundry:

```bash
pnpm add -g @opnet/cli
```

Once installed, it will be accessible as `op-anvil` from the command line.

## Timeline

op-anvil is planned after op-cast in the OPNet Foundry roadmap. It requires deep integration with the OPNet unit-test-framework VM internals.
