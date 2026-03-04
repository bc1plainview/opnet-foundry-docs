---
title: "Your First Project"
description: "Build, test, and deploy a Counter contract on OPNet from scratch."
---

This tutorial walks through creating a Counter contract, compiling it, running tests, and deploying to testnet. By the end, you will have a working contract on OPNet.

## 1. Create the Project

Scaffold a new project using the default template:

```bash
op-forge init my-counter
cd my-counter
pnpm install
```

This creates a project with the following structure:

```
my-counter/
  src/
    Counter.ts          # Contract source
  test/
    Counter.test.ts     # Contract tests
  asconfig.json         # AssemblyScript compiler config
  opnet.toml            # OPNet project config
  package.json
  tsconfig.json
```

## 2. Understand the Contract

Open `src/Counter.ts`. The default template includes a simple counter:

```typescript
import {
  OP_NET,
  Blockchain,
  SafeMath,
  StoredU256,
} from '@btc-vision/btc-runtime/runtime';
import { u256 } from 'as-bignum/assembly';

export class Counter extends OP_NET {
  private count: StoredU256;

  constructor() {
    super();
    this.count = new StoredU256(Blockchain.nextPointer);
  }

  public override onDeployment(_calldata: Uint8Array): void {
    this.count.set(u256.Zero);
  }

  @method()
  public getCount(_calldata: Uint8Array): Uint8Array {
    const current = this.count.get();
    return current.toUint8Array();
  }

  @method()
  public increment(_calldata: Uint8Array): Uint8Array {
    const current = this.count.get();
    const next = SafeMath.add(current, u256.One);
    this.count.set(next);
    return next.toUint8Array();
  }
}
```

Key points:

- **`StoredU256`** persists a `u256` value in contract storage. Each stored value needs a unique pointer from `Blockchain.nextPointer`.
- **`onDeployment()`** runs once when the contract is first deployed. This is where you initialize state. Never put initialization logic in the constructor -- the constructor runs on every call.
- **`@method()`** marks public callable methods. Each method receives calldata as `Uint8Array` and returns `Uint8Array`.
- **`SafeMath.add()`** performs overflow-safe arithmetic on `u256` values. Always use SafeMath for arithmetic operations.

## 3. Build the Contract

Compile the AssemblyScript source to WASM:

```bash
op-forge build
```

Expected output:

```
Compiling Counter...
  WASM: out/Counter.wasm (12.4 KB)
  WAT:  out/Counter.wat
Build completed in 1.2s
```

The compiled artifacts are in the `out/` directory. The `.wasm` file is the bytecode that gets deployed. The `.wat` file is the human-readable WebAssembly text format, useful for debugging.

To also see the compiled sizes:

```bash
op-forge build --sizes
```

## 4. Inspect the Contract

Before testing, you can inspect the compiled ABI:

```bash
op-forge inspect Counter abi
```

This prints the ABI extracted from the compiled contract, showing all public methods and their signatures.

To see all available methods:

```bash
op-forge inspect Counter methods
```

## 5. Run Tests

Open `test/Counter.test.ts`:

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

Run the tests:

```bash
op-forge test
```

Expected output:

```
Running tests...

Counter
  [PASS] should initialize count to zero (12ms)

1 passed, 0 failed
```

### Filtering Tests

Run only tests matching a pattern:

```bash
op-forge test --match-test "initialize"
```

Run only tests for a specific contract:

```bash
op-forge test --match-contract "Counter"
```

### Verbose Output

Increase verbosity for debugging:

```bash
op-forge test -vvv
```

### Gas Report

Generate a gas report for all tested methods:

```bash
op-forge test --gas-report
```

## 6. Take a Gas Snapshot

Save current gas usage for future comparison:

```bash
op-forge snapshot
```

This writes a `.gas-snapshot` file. On future runs, you can check for regressions:

```bash
op-forge snapshot --check --tolerance 5
```

This fails if any method's gas usage increased by more than 5%.

## 7. Deploy to Testnet

Before deploying, make sure you have:

- A funded testnet wallet (WIF private key)
- Testnet BTC for transaction fees

Deploy the compiled contract:

```bash
op-forge create Counter \
  --network testnet \
  --private-key <your-WIF-key>
```

The `create` command:

1. Reads the compiled WASM from `out/Counter.wasm`
2. Simulates the deployment transaction
3. If simulation succeeds, broadcasts the transaction
4. Prints the transaction ID and contract address

Example output:

```
Simulating deployment...
  Gas used: 18,432,000 / 20,000,000
  Estimated fee: 4,250 sat

Broadcasting transaction...
  TX: abc123...def456
  Contract: bc1p...xyz

Deployment successful.
View on explorer:
  https://mempool.opnet.org/testnet4/tx/abc123...def456
  https://opscan.org/accounts/0x...?network=op_testnet
```

### Deployment Options

Adjust fees and gas:

```bash
op-forge create Counter \
  --network testnet \
  --private-key <WIF> \
  --fee-rate 20 \
  --gas-limit 20000000
```

Skip simulation (not recommended):

```bash
op-forge create Counter \
  --network testnet \
  --private-key <WIF> \
  --no-simulate
```

## 8. View Configuration

To see the resolved project configuration:

```bash
op-forge config
```

This shows all settings merged from defaults, `opnet.toml`, environment variables, and CLI flags.

## Next Steps

- Read the [op-forge command reference](/forge/) for detailed documentation on every command
- Learn about [opnet.toml configuration](/configuration/opnet-toml/) to customize your project
- Explore the [profile system](/configuration/profiles/) for managing multiple environments
