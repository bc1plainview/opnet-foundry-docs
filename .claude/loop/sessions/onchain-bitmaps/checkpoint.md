# Checkpoint: onchain-bitmaps
Updated: 2026-03-05T19:10:00Z

## Position
- Phase: build (Step 2e: UI Testing)
- Cycle: 1 / 3
- Step: UI tester agent running

## Phases Completed
- [x] challenge
- [x] specify
- [x] explore
- [x] build (contract-dev, frontend-dev, auditor, deployer)
- [ ] review

## Agents Completed
- opnet-contract-dev: PASS (WASM compiled, ABI exported)
- opnet-frontend-dev: PASS (React+Vite build passes)
- opnet-auditor: PASS (cycle 2, after fixes)
- opnet-deployer: PASS (contract at opt1sqplthn3r38yw5lgzdqts02qc0q8lkhudnghx76vg)
- opnet-ui-tester: RUNNING

## Key Decisions
- OP721 with on-chain SVG generation from block hash bytes (4x4 grid, 16 synthwave colors)
- Token ID = block height as u256 (simple, no collision risk)
- Trust model: caller-supplied block data with zero-hash guard (no on-chain oracle available)
- tokenURI override using StoredString (bypasses 200-char MAX_URI_LENGTH)
- Free to mint (gas only, no platform fee)

## Next Action
Wait for UI tester results, then commit + push + create PR
