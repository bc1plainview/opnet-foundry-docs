#!/usr/bin/env bash
set -euo pipefail

echo "Installing OPNet Foundry..."
echo ""

# Check prerequisites
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required but not installed."
  echo "Install it from https://nodejs.org (v20 or later)"
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Error: Node.js v20 or later is required (found v$(node -v))"
  exit 1
fi

# Prefer pnpm, fall back to npm
if command -v pnpm &>/dev/null; then
  PKG_MGR="pnpm"
  echo "Using pnpm"
  pnpm add -g @btc-vision/foundry
else
  PKG_MGR="npm"
  echo "Using npm (install pnpm for best results: npm i -g pnpm)"
  npm install -g @btc-vision/foundry
fi

echo ""
echo "OPNet Foundry installed successfully!"
echo ""
echo "  op-forge --version    Check installation"
echo "  op-forge init myapp   Create a new project"
echo ""
echo "Docs: https://opnet-foundry.vercel.app"
