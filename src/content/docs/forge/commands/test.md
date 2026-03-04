---
title: "op-forge test"
description: "Run contract tests with filtering, verbosity control, and gas reporting."
---

Run your contract test suite. Tests are discovered automatically from `test/` and executed via `tsx`.

## Usage

```bash
op-forge test [options]
```

## Options

| Option                          | Description                            | Default           |
| ------------------------------- | -------------------------------------- | ----------------- |
| `--root <path>`                 | Project root directory                 | Current directory |
| `--match-test <pattern>`        | Run only tests matching this pattern   | All tests         |
| `--match-contract <pattern>`    | Run only tests for matching contracts  | All contracts     |
| `--no-match-test <pattern>`     | Exclude tests matching this pattern    | None              |
| `-v` to `-vvvvv`               | Verbosity level (1-5)                  | Default (level 2) |
| `--gas-report`                  | Print gas usage for each tested method | `false`           |

## Test Discovery

op-forge looks for test files matching these patterns in the `test/` directory:

- `test/**/*.test.ts`
- `test/**/*.spec.ts`

The test directory is configurable via `opnet.toml`:

```toml
[profile.default]
test = "test"
```

## Examples

Run all tests:

```bash
op-forge test
```

Run tests matching a pattern:

```bash
op-forge test --match-test "increment"
```

Run tests for a specific contract:

```bash
op-forge test --match-contract "Counter"
```

Exclude certain tests:

```bash
op-forge test --no-match-test "slow"
```

Maximum verbosity:

```bash
op-forge test -vvvvv
```

Generate gas report:

```bash
op-forge test --gas-report
```

## Test Framework

Tests use `@btc-vision/unit-test-framework`. A basic test file:

```typescript
import {
  opnet,
  OPNetUnit,
  Assert,
  Blockchain,
} from '@btc-vision/unit-test-framework';

await opnet('Counter', async (vm: OPNetUnit) => {
  vm.beforeEach(async () => {
    Blockchain.dispose();
    Blockchain.clearContracts();
    await Blockchain.init();
  });

  vm.afterEach(() => {
    Blockchain.dispose();
  });

  await vm.it('should initialize count to zero', async () => {
    const count = 0n;
    Assert.expect(count).toEqual(0n);
  });
});
```

Key points:

- **`opnet()`** defines a test suite for a contract
- **`vm.beforeEach()`** resets the blockchain state before each test
- **`vm.afterEach()`** cleans up after each test
- **`Assert.expect()`** provides assertion methods (`toEqual`, `toBeGreaterThan`, etc.)
- Always call `Blockchain.dispose()` and `Blockchain.clearContracts()` in `beforeEach` to avoid state leaking between tests

## Verbosity Levels

| Level    | Flag      | Output                                    |
| -------- | --------- | ----------------------------------------- |
| 1        | `-v`      | Test names and pass/fail                  |
| 2        | `-vv`     | Plus assertion details (default)          |
| 3        | `-vvv`    | Plus gas usage per call                   |
| 4        | `-vvvv`   | Plus calldata encoding details            |
| 5        | `-vvvvv`  | Full trace output                         |

## Gas Report

When `--gas-report` is enabled, op-forge prints a table showing gas consumption for every contract method exercised during the test run:

```
Gas Report
+-----------+-----------+----------+----------+----------+
| Contract  | Method    | Min Gas  | Avg Gas  | Max Gas  |
+-----------+-----------+----------+----------+----------+
| Counter   | increment | 45,230   | 45,230   | 45,230   |
| Counter   | getCount  | 12,100   | 12,100   | 12,100   |
+-----------+-----------+----------+----------+----------+
```

Use this with [snapshot](/forge/commands/snapshot/) to track gas regressions over time.
