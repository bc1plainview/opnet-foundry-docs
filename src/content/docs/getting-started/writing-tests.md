---
title: Writing Tests
description: Guide to writing and running OPNet contract tests with the unit test framework.
---

OPNet contracts are tested using `@btc-vision/unit-test-framework`, which provides a purpose-built testing API for contract behavior verification. Tests are written in TypeScript and executed via tsx.

## Test File Structure

Test files live in the `test/` directory and must end with `.test.ts` or `.spec.ts`:

```
my-project/
  src/
    Counter.ts
  test/
    Counter.test.ts       # Discovered automatically
    utils.ts              # Helper file (not discovered as a test)
  opnet.toml
```

op-forge discovers test files matching these patterns:

- `test/**/*.test.ts`
- `test/**/*.spec.ts`

The test directory is configurable in `opnet.toml`:

```toml
[profile.default]
test = "test"
```

## Basic Test File

A minimal test file for the Counter contract:

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

### Key concepts

- **`opnet(name, callback)`** -- Defines a test suite. The name is used for filtering and output.
- **`vm.beforeEach()`** -- Runs before each test case. Always reset blockchain state here.
- **`vm.afterEach()`** -- Runs after each test case. Always call `Blockchain.dispose()` to free resources.
- **`vm.it(name, callback)`** -- Defines a single test case.
- **`Assert`** -- Provides assertion methods for verifying behavior.

## Lifecycle Hooks

### vm.beforeEach

Runs before every test case. Use this to reset the blockchain VM and prepare a clean state:

```typescript
vm.beforeEach(async () => {
  Blockchain.dispose();
  Blockchain.clearContracts();
  await Blockchain.init();
});
```

The three calls in `beforeEach` are required in this order:

1. `Blockchain.dispose()` -- Release resources from the previous test
2. `Blockchain.clearContracts()` -- Clear registered contract instances
3. `Blockchain.init()` -- Initialize a fresh VM instance

Skipping any of these calls can cause state leakage between tests.

### vm.afterEach

Runs after every test case. Always dispose the blockchain:

```typescript
vm.afterEach(() => {
  Blockchain.dispose();
});
```

Without this, the VM may hold resources and prevent the test process from exiting.

## Test Cases with vm.it

Each `vm.it()` call defines an isolated test case:

```typescript
await vm.it('should increment the counter', async () => {
  // Arrange
  const initialCount = 0n;

  // Act
  const newCount = initialCount + 1n;

  // Assert
  Assert.expect(newCount).toEqual(1n);
});
```

Test cases are `async` functions. Use `await` for any asynchronous operations.

## Assert API

The `Assert` object provides the assertion methods for verifying test expectations.

### Assert.expect(value)

Creates an expectation chain. Follow with a matcher:

```typescript
Assert.expect(value).toEqual(expected);
```

### Matchers

| Matcher | Description |
|---------|-------------|
| `.toEqual(expected)` | Strict equality check |
| `.toNotEqual(expected)` | Value must not equal expected |
| `.toBeGreaterThan(expected)` | Value must be greater than expected |
| `.toBeGreaterThanOrEqual(expected)` | Value must be greater than or equal to expected |
| `.toBeLessThan(expected)` | Value must be less than expected |
| `.toBeLessThanOrEqual(expected)` | Value must be less than or equal to expected |
| `.toBeTrue()` | Value must be `true` |
| `.toBeFalse()` | Value must be `false` |
| `.toBeDefined()` | Value must not be `undefined` |
| `.toBeUndefined()` | Value must be `undefined` |

### Examples

```typescript
// Equality
Assert.expect(count).toEqual(42n);
Assert.expect(name).toEqual('Counter');

// Comparison
Assert.expect(gasUsed).toBeGreaterThan(0n);
Assert.expect(balance).toBeLessThanOrEqual(maxBalance);

// Boolean
Assert.expect(isOwner).toBeTrue();
Assert.expect(isPaused).toBeFalse();

// Defined
Assert.expect(result).toBeDefined();
```

## Testing Contract Methods

To test actual contract methods, register the contract with the blockchain VM and call methods through the test harness:

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

  await vm.it('should return initial count of zero', async () => {
    // Deploy and call the contract in the test VM
    // The exact API depends on your contract setup
    const count = 0n; // Placeholder for actual contract call
    Assert.expect(count).toEqual(0n);
  });

  await vm.it('should increment count by one', async () => {
    const before = 0n;
    const after = before + 1n;
    Assert.expect(after).toEqual(1n);
    Assert.expect(after).toBeGreaterThan(before);
  });

  await vm.it('should handle multiple increments', async () => {
    let count = 0n;
    for (let i = 0; i < 5; i++) {
      count += 1n;
    }
    Assert.expect(count).toEqual(5n);
  });
});
```

## Gas Tracking in Tests

### Gas report

Run tests with gas reporting to see how much gas each method consumes:

```bash
op-forge test --gas-report
```

Output:

```
Gas Report
+-----------+-----------+----------+----------+----------+
| Contract  | Method    | Min Gas  | Avg Gas  | Max Gas  |
+-----------+-----------+----------+----------+----------+
| Counter   | increment | 45,230   | 45,230   | 45,230   |
| Counter   | getCount  | 12,100   | 12,100   | 12,100   |
+-----------+-----------+----------+----------+----------+
```

### Gas snapshots

Save a gas baseline and check for regressions:

```bash
# Save current gas usage
op-forge snapshot

# After code changes, check for regressions
op-forge snapshot --check --tolerance 5
```

The `--tolerance 5` flag allows up to 5% gas increase before failing. See [op-forge snapshot](/forge/commands/snapshot/) for details.

## Running Tests

### Run all tests

```bash
op-forge test
```

### Filter by test name

Run only tests whose name matches a pattern:

```bash
op-forge test --match-test "increment"
```

### Filter by contract name

Run only tests for a specific contract:

```bash
op-forge test --match-contract "Counter"
```

### Exclude tests

Skip tests matching a pattern:

```bash
op-forge test --no-match-test "slow"
```

### Verbose output

Increase verbosity for debugging:

```bash
op-forge test -vvv
```

Verbosity levels range from `-v` (minimal) to `-vvvvv` (full trace). See [op-forge test](/forge/commands/test/) for details.

## Multiple Test Suites

You can define multiple `opnet()` suites in a single file, or split suites across files:

```typescript
// test/Counter.test.ts
await opnet('Counter - Basic', async (vm: OPNetUnit) => {
  // ... setup hooks ...

  await vm.it('should initialize to zero', async () => {
    // ...
  });
});

await opnet('Counter - Edge Cases', async (vm: OPNetUnit) => {
  // ... setup hooks ...

  await vm.it('should handle large values', async () => {
    // ...
  });
});
```

Each suite gets its own `beforeEach`/`afterEach` hooks.

## Best Practices

1. **Always reset state in `beforeEach`.** Call `Blockchain.dispose()`, `Blockchain.clearContracts()`, and `Blockchain.init()` in every suite.

2. **Always dispose in `afterEach`.** Prevents resource leaks and hung test processes.

3. **Use bigint for all numeric values.** OPNet uses `u256` internally. Use `0n`, `1n`, etc. in tests to match.

4. **Test behavior, not implementation.** Verify what a method returns and what state it produces, not the internal steps it takes.

5. **One assertion per concept.** Multiple assertions in a test are fine, but they should all relate to the same behavior being verified.

6. **Name tests descriptively.** Use "should [expected behavior]" format so test output reads clearly.

## See Also

- [op-forge test](/forge/commands/test/) -- Full command reference for the test runner
- [op-forge snapshot](/forge/commands/snapshot/) -- Gas snapshot tracking
- [Contract Development](/getting-started/contract-development/) -- Writing the contracts you test
- [Your First Project](/getting-started/first-project/) -- End-to-end tutorial including tests
