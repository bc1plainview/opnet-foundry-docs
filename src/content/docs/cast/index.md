---
title: op-cast
description: Command-line tool for interacting with OPNet smart contracts and the Bitcoin network.
---

# op-cast

**op-cast** is the command-line tool for interacting with deployed OPNet smart contracts, sending transactions, and querying on-chain state.

It is the OPNet equivalent of Ethereum Foundry's `cast`.

## Status

op-cast is currently under development. The following capabilities are planned:

### Blockchain Queries
- Query block data, transaction receipts, and account balances
- Read contract storage and call view methods
- Fetch gas parameters and mempool status

### Transaction Sending
- Call contract methods with encoded calldata
- Send BTC transfers with fee estimation
- Simulate transactions before broadcasting

### Wallet Operations
- Generate and manage keypairs
- Sign messages with ML-DSA (quantum-resistant)
- Derive addresses from public keys

### ABI Utilities
- Encode and decode function calldata
- Parse event logs
- Generate TypeScript bindings from ABI

### Utility Commands
- Convert between hex, decimal, and base58
- Calculate storage pointers
- Format and parse Bitcoin amounts (sat/BTC)

## Installation

op-cast will be available as part of OPNet Foundry:

```bash
pnpm add -g @opnet/cli
```

Once installed, it will be accessible as `op-cast` from the command line.

## Timeline

op-cast is the next component in the OPNet Foundry roadmap after the op-forge foundation. Check back for updates.
