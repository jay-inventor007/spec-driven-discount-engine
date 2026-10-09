# Step A3 - A Function with a Planted Bug

**Context:** A partner/reviewer provided a function that calculates prorated refunds for subscription cancellations mid-cycle. The function contains one planted defect.

---

## 1. Provided Code (With Planted Bug)

```ts
interface ProrationInput {
  planPriceCents: number;
  cycleStartMs: number;
  cycleEndMs: number;
  cancellationMs: number;
}

export function calculateProrationRefund(input: ProrationInput): number {
  if (input.planPriceCents <= 0) {
    return 0;
  }

  const totalCycleMs = input.cycleEndMs - input.cycleStartMs;
  if (totalCycleMs <= 0) {
    return 0;
  }

  const elapsedMs = input.cancellationMs - input.cycleStartMs;
  const remainingFraction = 1 - (elapsedMs / totalCycleMs);
  const refundCents = Math.round(input.planPriceCents * remainingFraction);

  return refundCents;
}
```

---

## 2. Pseudocode for What the Function ACTUALLY Does

```text
FUNCTION calculateProrationRefundActual
INPUTS:
  input: object containing planPriceCents, cycleStartMs, cycleEndMs, and cancellationMs

OUTPUT:
  refundCents: integer number representing calculated refund in cents

SIDE EFFECTS:
  NONE

FAILS WHEN:
  - input properties are not numbers (throws TypeError)

1. IF planPriceCents is less than or equal to 0 THEN
     RETURN 0.
   OTHERWISE
     continue
   END IF
2. Calculate totalCycleMs by subtracting cycleStartMs from cycleEndMs.
3. IF totalCycleMs is less than or equal to 0 THEN
     RETURN 0.
   OTHERWISE
     continue
   END IF
4. Calculate elapsedMs by subtracting cycleStartMs from cancellationMs unconditionally without bounds checking.
5. Calculate remainingFraction by subtracting (elapsedMs divided by totalCycleMs) from 1.
6. Calculate refundCents by multiplying planPriceCents by remainingFraction and rounding to the nearest integer.
7. RETURN refundCents (even if refundCents is negative or strictly exceeds planPriceCents).
```

---

## 3. Pseudocode for What the Function SHOULD Do

```text
FUNCTION calculateProrationRefundIntended
INPUTS:
  input: object containing planPriceCents, cycleStartMs, cycleEndMs, and cancellationMs

OUTPUT:
  refundCents: integer number representing calculated refund in cents (strictly bounded between 0 and planPriceCents)

SIDE EFFECTS:
  NONE

FAILS WHEN:
  - input properties are not numbers (throws TypeError)

1. IF planPriceCents is less than or equal to 0 THEN
     RETURN 0.
   OTHERWISE
     continue
   END IF
2. Calculate totalCycleMs by subtracting cycleStartMs from cycleEndMs.
3. IF totalCycleMs is less than or equal to 0 THEN
     RETURN 0.
   OTHERWISE
     continue
   END IF
4. IF cancellationMs is less than or equal to cycleStartMs THEN
     RETURN planPriceCents (full refund if cancelled on or before cycle begins).
   OTHERWISE IF cancellationMs is greater than or equal to cycleEndMs THEN
     RETURN 0 (no refund if cancelled on or after cycle ends).
   OTHERWISE
     continue
   END IF
5. Calculate elapsedMs by subtracting cycleStartMs from cancellationMs.
6. Calculate remainingFraction by subtracting (elapsedMs divided by totalCycleMs) from 1.
7. Calculate refundCents by multiplying planPriceCents by remainingFraction and rounding to the nearest integer.
8. RETURN refundCents bounded between 0 and planPriceCents.
```

---

## 4. The Bug Identification

### Name of the Bug:
**Unclamped Temporal Elapsed Calculation (Boundary Leak Leading to Negative or Inflated Financial Values)**

### Explanation:
The bug is the difference between Step 4 of the actual pseudocode and Step 4 of the intended pseudocode:

1. **Post-Cycle Cancellation (Negative Refund):** When `cancellationMs > cycleEndMs` (cancelling after the subscription month has expired), `elapsedMs > totalCycleMs`. As a result, `remainingFraction` becomes negative, and the function returns a **negative refund** (e.g., `-250` cents). If credited to a customer's balance, this would silently debit the user for cancelling late!
2. **Pre-Cycle / Clock-Drift Cancellation (Inflated Refund):** When `cancellationMs < cycleStartMs` (e.g. server clock skew or scheduling a cancellation before a new cycle kicks off), `elapsedMs` becomes negative. This makes `remainingFraction > 1`, and the function refunds **more money than the customer paid** (e.g. paying $10 and being refunded $12).

### The Fix:
Clamp the cancellation boundary so `elapsedMs` can never be less than 0 or greater than `totalCycleMs`:
```ts
if (input.cancellationMs <= input.cycleStartMs) return input.planPriceCents;
if (input.cancellationMs >= input.cycleEndMs) return 0;
```
