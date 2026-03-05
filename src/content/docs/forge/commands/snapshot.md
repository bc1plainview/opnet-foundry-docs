---
title: op-forge snapshot
description: Run tests with gas tracking and write a .gas-snapshot file.
---

Run all tests with gas tracking enabled and write the results to a `.gas-snapshot` file. Use `--check` to compare against a previous snapshot and detect gas regressions.

## Usage

```bash
op-forge snapshot [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--root <path>` | Project root directory | Current directory |
| `--check` | Compare against existing snapshot instead of writing a new one | `false` |
| `--tolerance <percent>` | Tolerance percentage for `--check` (fail only if increase exceeds this) | `0` |

## How It Works

1. Discovers all test files (`test/**/*.test.ts`, `test/**/*.spec.ts`)
2. Runs all tests with gas tracking enabled
3. Extracts gas usage data from test results
4. Writes (or compares) the `.gas-snapshot` file

The `.gas-snapshot` file records gas usage per test, allowing you to track how contract changes affect gas consumption over time.

## Examples

### Create a gas snapshot

```bash
op-forge snapshot
```

This runs all tests, records gas usage, and writes `.gas-snapshot` in the project root.

### Check for gas regressions

```bash
op-forge snapshot --check
```

Compares current gas usage against the existing `.gas-snapshot`. Exits with code 1 if any test's gas usage increased.

### Check with tolerance

```bash
op-forge snapshot --check --tolerance 5
```

Allow up to 5% gas increase before failing. Useful in CI where minor fluctuations are acceptable.

### CI usage

Add to your CI pipeline to catch gas regressions:

```yaml
- run: op-forge snapshot --check --tolerance 2
```

## Output Format

The `.gas-snapshot` file contains one line per test:

```
Counter::increment: 45000
Counter::decrement: 43000
Counter::setCount: 52000
```

When using `--check`, the comparison output shows:

```
Gas Snapshot Comparison

  Counter::increment: 45000 -> 46200 (+2.67%)
  Counter::decrement: 43000 -> 42800 (-0.47%)
  Counter::setCount: 52000 -> 52000 (+0.00%)
```

Increases are shown in red, decreases in green.
