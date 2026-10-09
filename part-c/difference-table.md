# Part C: Difference Table & Ambiguity Analysis

This document compares the original **Part B Specification (B1)** with the **Reverse-Engineered AI Pseudocode (C2)**, categorizing differences into **Added**, **Omitted**, and **Ambiguous**, and detailing how the ambiguity was resolved.

---

## 1. Difference Table

| Category | Aspect / Step | Original Specification (B1) | AI Implementation (C2) | Impact / Root Cause |
| :--- | :--- | :--- | :--- | :--- |
| **Added** | Input defensive checks (Step 1) | Assumed valid schema: "IF cart items list is empty OR cart subtotalCents <= 0" | Added runtime checks: `!cart \|\| !cart.items \|\| cart.items.length === 0` | Defends against `null` or `undefined` payload objects passed by consumer. |
| **Added** | Nullish maxDiscount check (Step 10) | "IF coupon maxDiscountCents is not null" | Checks both `null` and `undefined` (`!= null`) | Idiomatic defensive JavaScript handling for optional object properties. |
| **Omitted** | Type inspection (Step 1) | Explicit `Array.isArray(cart.items)` implied by schema definition | Omitted explicit array type guard, relying on `.length` | If an object with a `.length` property was passed, it would bypass initial array guard. |
| **Ambiguous** | Percentage fractional cent rounding (Step 9) | "multiplying cart subtotalCents by coupon discountValue, dividing by 100, and rounding to nearest integer" | Implemented `Math.floor(...)` (integer truncation towards zero) | **Subtle Discrepancy:** On odd fractional cent calculations (e.g., $2.50 at 15% = 37.5 cents), `Math.round` produces 38 cents, while `Math.floor` produces 37 cents. |

---

## 2. In-Depth Ambiguity Analysis: Rounding Half-Cents

### The Problem
In Step 9, the original B1 pseudocode stated:
> *"Calculate percentage amount by multiplying cart subtotalCents by coupon discountValue, dividing by 100, and rounding to nearest integer."*

To a human engineer, "rounding to nearest integer" typically suggests standard arithmetic half-up rounding (`Math.round` in JavaScript). However, to a financial developer or an LLM trained on accounting/e-commerce codebases, calculating discounts often defaults to:
1. **Floor truncation (`Math.floor`)**: Never grant an unearned fractional cent to a buyer; or
2. **Banker's rounding (`round half to even`)**: Required by IEEE 754 and financial standards to eliminate statistical drift.

Because the pseudocode did not define the tie-breaking rule or specify the rounding direction for fractional minor units (`.5` cents), the AI and manual implementations produced divergent outputs on numbers with `.5` cents!

### Concrete Discrepancy Example
- Cart subtotal: 250 cents ($2.50)
- Discount: 15%
- Mathematical calculation: `(250 * 15) / 100 = 3750 / 100 = 37.5` cents.
- **Manual Implementation (B2):** `Math.round(37.5) = 38` cents discount -> Customer pays 212 cents.
- **AI Implementation (C1):** `Math.floor(37.5) = 37` cents discount -> Customer pays 213 cents.
- Discrepancy: **1 cent difference**.

---

## 3. Rewriting B1 to Eliminate Ambiguity

To make the specification 100% deterministic and leave zero room for divergent interpretations across language platforms and AI code generation, Step 9 in the pseudocode should be rewritten as:

```text
REWRITTEN STEP 9:
9. IF coupon discountType equals "percentage" THEN
     IF coupon discountValue is less than 1 OR coupon discountValue is greater than 100 THEN
       RETURN failure with errorCode "INVALID_PERCENTAGE" and errorMessage "Percentage discount must be between 1 and 100".
     END IF
     Calculate exactRawAmount as (cart subtotalCents * coupon discountValue) / 100.
     Calculate rawDiscountCents using standard half-up rounding (round exactRawAmount to the nearest integer, resolving halves by rounding upwards toward positive infinity, equivalent to Math.round in JavaScript).
   OTHERWISE IF coupon discountType equals "fixed_amount" THEN
     ...
```

By explicitly specifying **half-up rounding** and defining the tie-break behavior, any developer or AI model in any programming language (Python `Decimal(x).quantize(ROUND_HALF_UP)`, Java `BigDecimal.ROUND_HALF_UP`, or JavaScript `Math.round`) will produce identical results down to the penny.
