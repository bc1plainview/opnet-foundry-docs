# OPNet Foundry Docs

Documentation site for [OPNet Foundry](https://opnet-foundry.vercel.app) — the complete development toolchain for building, testing, and deploying OPNet smart contracts on Bitcoin.

## What's Inside

- **Getting Started** — Installation guide, first project tutorial
- **op-forge** — Command reference for all 10 implemented commands (init, build, test, create, deploy, clean, config, inspect, install, snapshot)
- **op-cast** — Blockchain interaction tool (coming soon)
- **op-anvil** — Local development node (coming soon)
- **op-chisel** — Interactive REPL (coming soon)
- **Configuration** — `opnet.toml` reference, profiles, environment variables
- **Reference** — FAQ, troubleshooting

## Stack

- [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) — static docs framework
- [Pagefind](https://pagefind.app) — client-side full-text search
- [Vercel](https://vercel.com) — hosting

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:4321

## Build

```bash
pnpm build
pnpm preview
```

## Deploy

Deployed automatically on push via Vercel. Production URL: https://opnet-foundry.vercel.app

## License

MIT
