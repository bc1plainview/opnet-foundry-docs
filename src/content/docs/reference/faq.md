---
title: FAQ
description: Frequently asked questions about OPNet Foundry.
---

## General

### What is OPNet Foundry?

OPNet Foundry is a development toolchain for building, testing, and deploying smart contracts on Bitcoin via the OPNet protocol. It consists of four tools: op-forge (build/test/deploy), op-cast (chain interaction), op-anvil (local node), and op-chisel (REPL).

### How does it relate to Ethereum Foundry?

OPNet Foundry is modeled after Ethereum's Foundry toolchain (forge, cast, anvil, chisel). The command structure, configuration format, and developer experience are designed to be as familiar as possible for developers coming from the Ethereum ecosystem.

### What language are contracts written in?

OPNet contracts are written in AssemblyScript (a TypeScript-like language that compiles to WebAssembly). The toolchain itself is written in TypeScript.

### What version of AssemblyScript?

OPNet uses `@btc-vision/assemblyscript`, a fork of AssemblyScript with OPNet-specific optimizations. Do not install the standard `assemblyscript` package -- it will conflict. If you have it installed, remove it first:

```bash
npm uninstall assemblyscript
pnpm add -D @btc-vision/assemblyscript@rc
```

## Configuration

### Where does opnet.toml go?

Place `opnet.toml` in the root of your project directory, next to `package.json`. op-forge discovers it automatically.

### Can I use environment variables instead of opnet.toml?

Yes. Any setting can be overridden via environment variables prefixed with `OPNET_`. See the [Profiles](/configuration/profiles/) page for the full list.

### How do I switch between testnet and mainnet?

Use profiles:

```toml
[profile.default.rpc_endpoints]
testnet = "https://testnet.opnet.org"

[profile.production.rpc_endpoints]
mainnet = "https://api.opnet.org"
```

Then select the profile:

```bash
OPNET_PROFILE=production op-forge create MyContract --network mainnet --private-key <WIF>
```

## Building

### What does `op-forge build` produce?

It compiles your AssemblyScript contract to WASM (WebAssembly) using the configuration in `asconfig.json`. The output goes to the `out/` directory (configurable). Both `.wasm` and `.wat` files are generated.

### My build fails with "asc not found"

The AssemblyScript compiler must be installed as a project dependency:

```bash
pnpm add -D @btc-vision/assemblyscript@rc
```

### How big can a contract be?

There is no hard size limit on the WASM binary. However, the constructor (`onDeployment`) has a gas limit of 20,000,000. Keep initialization logic minimal -- only set storage pointers in the constructor.

## Testing

### What test framework does op-forge use?

op-forge uses `@btc-vision/unit-test-framework`, the official OPNet testing library. Tests are written in TypeScript and executed via tsx.

### How do I run a specific test?

Use the `--match-test` flag:

```bash
op-forge test --match-test "should increment"
```

### How do I see gas usage in tests?

Use the `--gas-report` flag:

```bash
op-forge test --gas-report
```

Or create a gas snapshot:

```bash
op-forge snapshot
```

## Deployment

### Is simulation required before deployment?

Simulation is enabled by default and strongly recommended. Bitcoin transactions are irreversible -- once broadcast, you cannot undo a deployment. Simulation catches errors before real funds are spent.

To skip simulation (not recommended):

```bash
op-forge create MyContract --network testnet --private-key <WIF> --no-simulate
```

### What format should the private key be in?

WIF (Wallet Import Format). This is a base58-encoded private key that starts with `5`, `K`, or `L` for mainnet, or `c` for testnet.

### What gas limit should I use?

The default gas limit for deployment is 20,000,000 (the OPNet VM constructor limit). For most contracts this is sufficient. The gas limit is configurable in `opnet.toml` under `[profile.<name>.deploy]` or via the `--gas-limit` CLI flag.

## Compatibility

### Can I use OPNet Foundry on Windows?

OPNet Foundry runs on macOS, Linux, and Windows (via WSL or native Node.js). pnpm and Node.js 18+ are required.

### What Node.js version is required?

Node.js 18 or later. The toolchain uses ES modules and modern JavaScript features.

### Can I use npm instead of pnpm?

pnpm is recommended for OPNet projects due to its strict dependency resolution and workspace support. npm will work for basic operations but pnpm is used throughout the documentation and toolchain.
