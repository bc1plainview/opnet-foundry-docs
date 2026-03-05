---
title: Contract Development
description: Guide to writing OPNet smart contracts in AssemblyScript.
---

OPNet smart contracts are written in AssemblyScript -- a TypeScript-like language that compiles to WebAssembly (WASM). This guide covers the contract structure, storage, methods, events, and patterns you need to write production contracts.

## Contract Structure

Every OPNet contract extends the `OP_NET` base class:

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

## Constructor Rules

The constructor runs on **every** contract call, not just deployment. It must only contain pointer initialization and the `super()` call.

**Do:**

```typescript
constructor() {
  super();
  this.count = new StoredU256(Blockchain.nextPointer);
  this.owner = new StoredAddress(Blockchain.nextPointer);
}
```

**Do not:**

```typescript
// WRONG -- this runs on every call, not just deployment
constructor() {
  super();
  this.count = new StoredU256(Blockchain.nextPointer);
  this.count.set(u256.Zero); // Never put logic here
}
```

The constructor has a **20M gas limit** during deployment. Keep it minimal -- only allocate storage pointers.

## onDeployment

The `onDeployment()` method runs once when the contract is first deployed. All initialization logic goes here:

```typescript
public override onDeployment(_calldata: Uint8Array): void {
  this.count.set(u256.Zero);
  this.owner.set(Blockchain.origin);
}
```

### Rules for onDeployment

- **No cross-contract calls.** Calling other contracts during deployment will revert.
- **Keep it simple.** The 20M gas limit applies to the entire deployment including constructor + onDeployment.
- **Initialize all storage.** Set default values for every stored variable.

If deployment reverts consuming all gas, check:

1. Cross-contract calls in `onDeployment()` -- remove them
2. Calldata encoding mismatch -- verify ABI encoding
3. Missing `asconfig.json` features -- ensure all `enable` entries are present

## Public Methods with @method()

The `@method()` decorator marks a function as a public contract method callable from external transactions:

```typescript
@method()
public increment(_calldata: Uint8Array): Uint8Array {
  const current = this.count.get();
  const next = SafeMath.add(current, u256.One);
  this.count.set(next);
  return next.toUint8Array();
}
```

### Rules

- Every `@method()` **must declare parameters with types.** A method with no parameters still needs the calldata parameter.
- Methods receive calldata as `Uint8Array` and return `Uint8Array`.
- Do not import `@method()` -- it is injected by `@btc-vision/opnet-transform` at compile time.
- The same applies to `@returns()`, `@emit()`, and `ABIDataTypes` -- these are compile-time globals, not importable symbols.

## Storage Types

OPNet provides persistent storage types that survive across transactions. Each stored value requires a unique pointer from `Blockchain.nextPointer`.

### StoredU256

Store a 256-bit unsigned integer:

```typescript
private balance: StoredU256;

constructor() {
  super();
  this.balance = new StoredU256(Blockchain.nextPointer);
}
```

Read and write:

```typescript
const current = this.balance.get();    // Returns u256
this.balance.set(u256.fromU64(1000));  // Sets value
```

### StoredString

Store a string value:

```typescript
private name: StoredString;

constructor() {
  super();
  this.name = new StoredString(Blockchain.nextPointer);
}

public override onDeployment(_calldata: Uint8Array): void {
  this.name.set('MyContract');
}
```

### StoredBoolean

Store a boolean flag:

```typescript
private paused: StoredBoolean;

constructor() {
  super();
  this.paused = new StoredBoolean(Blockchain.nextPointer);
}

public override onDeployment(_calldata: Uint8Array): void {
  this.paused.set(false);
}
```

### AddressMemoryMap and StoredMapU256

For key-value mappings, use `AddressMemoryMap` or `StoredMapU256`. Do not use native `Map<Address, T>` -- reference equality is broken in AssemblyScript.

```typescript
import { AddressMemoryMap } from '@btc-vision/btc-runtime/runtime';

private balances: AddressMemoryMap<StoredU256>;

constructor() {
  super();
  this.balances = new AddressMemoryMap<StoredU256>(Blockchain.nextPointer);
}
```

### Blockchain.nextPointer

Every stored value needs a unique pointer. `Blockchain.nextPointer` auto-increments, so each call returns the next available slot:

```typescript
constructor() {
  super();
  // Pointer 0
  this.count = new StoredU256(Blockchain.nextPointer);
  // Pointer 1
  this.owner = new StoredAddress(Blockchain.nextPointer);
  // Pointer 2
  this.name = new StoredString(Blockchain.nextPointer);
}
```

The order of pointer allocation must be consistent. Changing the order changes which storage slot each variable maps to.

## SafeMath

All `u256` arithmetic **must** use `SafeMath`. Direct operators (`+`, `-`, `*`, `/`) are not safe for `u256` values.

```typescript
import { SafeMath } from '@btc-vision/btc-runtime/runtime';

// Addition
const sum = SafeMath.add(a, b);

// Subtraction (reverts on underflow)
const diff = SafeMath.sub(a, b);

// Multiplication
const product = SafeMath.mul(a, b);

// Division (reverts on division by zero)
const quotient = SafeMath.div(a, b);
```

SafeMath reverts the transaction if an overflow, underflow, or division by zero occurs.

## Events with @emit()

Emit events to log data that external observers can read:

```typescript
@emit('Incremented')
private emitIncremented(oldValue: u256, newValue: u256): void {
  // Event parameters are encoded automatically
}
```

Use events to signal state changes to frontends and indexers. Do not import `@emit()` -- it is a compile-time global.

## Access Control

### Owner pattern

Store the deployer address and check it in restricted methods:

```typescript
private owner: StoredAddress;

constructor() {
  super();
  this.owner = new StoredAddress(Blockchain.nextPointer);
}

public override onDeployment(_calldata: Uint8Array): void {
  this.owner.set(Blockchain.origin);
}

@method()
public restrictedAction(_calldata: Uint8Array): Uint8Array {
  const sender = Blockchain.sender;
  const owner = this.owner.get();

  if (!sender.equals(owner)) {
    throw new Revert('Not owner');
  }

  // ... perform action
}
```

### Payable method protection

If a method accepts BTC value, block contract callers to prevent reentrancy:

```typescript
@method()
public deposit(_calldata: Uint8Array): Uint8Array {
  const sender = Blockchain.sender;
  const origin = Blockchain.origin;

  // Block contract callers -- only EOAs
  if (!sender.equals(origin)) {
    throw new Revert('Contracts cannot call this method');
  }

  // ... handle deposit
}
```

## Revert

To revert a transaction with an error message:

```typescript
throw new Revert('Insufficient balance');
```

Note: use `throw new Revert()`, not `throw Revert()`. The `new` keyword is required.

## Gas Considerations

- **Constructor limit: 20M gas.** Keep `constructor()` and `onDeployment()` minimal.
- **No cross-contract calls in deployment.** They consume gas unpredictably.
- **SafeMath is cheap.** Do not try to optimize away SafeMath calls -- the gas savings are negligible and the risk is high.
- **Storage reads/writes are the main gas cost.** Minimize storage operations where possible.
- Use `op-forge test --gas-report` to measure gas consumption and `op-forge snapshot` to track regressions.

## Time-Dependent Logic

Use `Blockchain.block.number` for all time-dependent logic. Do not use `Blockchain.block.medianTimestamp` -- it is manipulable by miners.

```typescript
// Correct: use block number
const deadline: u256 = SafeMath.add(Blockchain.block.number, u256.fromU64(100));

// Wrong: timestamp is miner-manipulable
// const deadline = Blockchain.block.medianTimestamp + 3600;
```

## Hashing

OPNet uses SHA-256 for hashing. Do not use Keccak256 -- it is not supported.

## Complete Example: Counter Contract

```typescript
import {
  OP_NET,
  Blockchain,
  SafeMath,
  StoredU256,
  Revert,
} from '@btc-vision/btc-runtime/runtime';
import { u256 } from 'as-bignum/assembly';

export class Counter extends OP_NET {
  private count: StoredU256;
  private owner: StoredAddress;

  constructor() {
    super();
    // Only pointer allocation in constructor
    this.count = new StoredU256(Blockchain.nextPointer);
    this.owner = new StoredAddress(Blockchain.nextPointer);
  }

  public override onDeployment(_calldata: Uint8Array): void {
    // Initialization logic here
    this.count.set(u256.Zero);
    this.owner.set(Blockchain.origin);
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

  @method()
  public reset(_calldata: Uint8Array): Uint8Array {
    // Only owner can reset
    if (!Blockchain.sender.equals(this.owner.get())) {
      throw new Revert('Not owner');
    }
    this.count.set(u256.Zero);
    return u256.Zero.toUint8Array();
  }
}
```

## Project Setup Checklist

1. **Scaffold:** `op-forge init my-contract`
2. **Install dependencies:** `pnpm install`
3. **Remove standard assemblyscript** if present: `npm uninstall assemblyscript`
4. **Install OPNet assemblyscript:** `pnpm add -D @btc-vision/assemblyscript@rc`
5. **Verify asconfig.json** includes the opnet-transform
6. **Build:** `op-forge build`
7. **Test:** `op-forge test`
8. **Deploy:** `op-forge create MyContract --network testnet --private-key <WIF>`

## See Also

- [Your First Project](/getting-started/first-project/) -- End-to-end tutorial
- [Writing Tests](/getting-started/writing-tests/) -- Testing your contracts
- [op-forge build](/forge/commands/build/) -- Build command reference
- [op-forge create](/forge/commands/create/) -- Deployment command reference
- [opnet.toml Reference](/configuration/opnet-toml/) -- Project configuration
