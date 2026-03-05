---
title: Installation
description: Install OPNet Foundry and get op-forge running on your system.
---

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 9 or later (Foundry uses pnpm for dependency management)

## Install via Script

The quickest way to install OPNet Foundry:

```bash
curl -L https://raw.githubusercontent.com/bc1plainview/opnet-foundry-docs/main/install.sh | bash
```

This installs `op-forge` and updates your PATH. Restart your terminal after installation.

## Install via npm

```bash
pnpm add -g @btc-vision/foundry
```

Or with npm:

```bash
npm install -g @btc-vision/foundry
```

## Build from Source

Clone the repository and build locally:

```bash
git clone https://github.com/bc1plainview/opnet-foundry.git
cd opnet-foundry
pnpm install
pnpm build
pnpm link --global
```

This makes `op-forge` available globally.

## Verify Installation

```bash
op-forge --version
```

Expected output:

```
op-forge 0.1.0
```

## Shell Completions

op-forge supports tab completion for bash, zsh, and fish. After installing, run:

```bash
# bash
op-forge completions bash >> ~/.bashrc

# zsh
op-forge completions zsh >> ~/.zshrc

# fish
op-forge completions fish > ~/.config/fish/completions/op-forge.fish
```

## Platform Support

| Platform       | Status    |
| -------------- | --------- |
| macOS (ARM)    | Supported |
| macOS (Intel)  | Supported |
| Linux (x64)    | Supported |
| Linux (ARM)    | Supported |
| Windows (WSL2) | Supported |
| Windows native | Not yet   |

## Updating

To update to the latest version:

```bash
pnpm add -g @btc-vision/foundry@latest
```

Or re-run the install script:

```bash
curl -L https://raw.githubusercontent.com/bc1plainview/opnet-foundry-docs/main/install.sh | bash
```

## Next Steps

Once installed, create your first project:

```bash
op-forge init my-first-contract
```

Follow the [Your First Project](/getting-started/first-project/) tutorial for a complete walkthrough.
