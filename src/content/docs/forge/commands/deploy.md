---
title: "op-forge deploy"
description: "Deploy a compiled contract to the OPNet network."
---

`op-forge deploy` is an alias for [`op-forge create`](/forge/commands/create/).

In OPNet Foundry, the `create` command is the deployment command. It reads a compiled WASM artifact, simulates the deployment, and broadcasts it as a Bitcoin transaction.

## Usage

```bash
op-forge create <contract> --network <network> --private-key <WIF>
```

## Quick Example

```bash
op-forge create Counter \
  --network testnet \
  --private-key cN3Q...your-WIF-key
```

See [op-forge create](/forge/commands/create/) for full documentation, all options, and examples.
