# Spec-Driven Discount Engine

> **A specification-driven promotional coupon & discount calculation engine featuring formal verification, boundary condition analysis, fractional-cent ambiguity resolution, and differential test suites.**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Verification Suites](https://img.shields.io/badge/test%20suites-passing-success.svg)]()

---

## 1. Architectural Overview

In high-volume e-commerce and fintech systems, discount calculations are deceptively difficult:
- **Financial Bounds:** Discounts must strictly never exceed order subtotals or yield negative balances.
- **Quota Race Conditions:** Global and per-customer usage counters must be validated deterministically.
- **Fractional Precision:** Ambiguities in integer minor units (cents) can cause financial drift between clients, servers, and automated pipelines.

This repository demonstrates **specification-first engineering**: defining airtight mathematical contracts using formal pseudocode, verifying logic through manual trace matrices, identifying real-world defects in decompiled code, and executing differential automated testing between human and AI-generated implementations.

---

## 2. The Formal Specification Standard

Every algorithm in this library adheres strictly to a 7-rule formal contract:

```text
FUNCTION <name>
INPUTS: <parameter, type, and semantic invariant>
OUTPUT: <return data structure and type>
SIDE EFFECTS: <external state mutations or NONE>
FAILS WHEN: <exhaustive list of early termination conditions and validations>

1. Numbered steps (one discrete action per step).
2. Plain English, present tense, zero programming syntax.
3. Explicit branching (IF ... THEN ... OTHERWISE ... END IF).
4. Explicit loops (FOR EACH ... IN ... END FOR).
5. Explicit early exits (IF <condition> THEN RETURN <error> END IF).
6. Explicit external calls (CALL <system/API> (may fail, may be slow)).
7. Explicit state changes (WRITE <record / cache / header>).
```

---

## 3. Library Structure

```
spec-driven-discount-engine/
├── package.json                          # Test scripts and module configuration
├── part-a/
│   ├── a1/                               # Core systems algorithms + state trace tables
│   │   ├── 1-cursor-pagination.md        # Keyset cursor pagination & encoding (Complex)
│   │   ├── 2-rate-limiter.md             # Fixed-window IP rate limiter (Auth/Quota)
│   │   └── 3-error-handler.md            # Central Express error normalizer (Error Handling)
│   ├── a2/                               # Open-source decompilations & AI audit
│   │   ├── 1-cookie-signature-unsign.md  # cookie-signature .unsign + AI error caught
│   │   ├── 2-cookie-parse.md             # cookie .parse + AI comparison
│   │   └── 3-p-limit.md                  # p-limit concurrency limiter + AI comparison
│   └── a3/                               # Planted defect analysis (Actual vs Intended)
│       └── planted-bug.md                # Prorated subscription refund calculator
├── part-b/
│   ├── pseudocode.md                     # Feature pseudocode + 5 hand-traced inputs
│   └── implementation/
│       ├── applyCouponCode.js            # Reference implementation mapped step-by-step to spec
│       └── run-b-traces.js               # Runner validating all 5 hand-traced inputs
├── part-c/
│   ├── ai-implementation/
│   │   └── applyCouponCodeAI.js          # Implementation generated strictly from specification
│   ├── reverse-pseudocode.md             # Pseudocode reverse-engineered from AI implementation
│   ├── difference-table.md               # Classified differences: Added, Omitted, Ambiguous
│   ├── comparison-test/
│   │   └── compare-implementations.js    # 10-input automated comparison runner (Reference vs AI)
│   └── recording-notes.md                # Non-technical conceptual script & listener feedback
├── public-post.md                        # Architecture retrospective draft
└── README.md
```

---

## 4. Verification & Test Execution

This library has **zero third-party dependencies** and runs natively on Node.js 18+:

```bash
# Execute both verification suites
npm test

# Run Suite B: 5 hand-traced inputs verification
npm run test:part-b

# Run Suite C: 10-input differential comparison runner
npm run test:part-c
```

---

## 5. Key Engineering Findings

### Decompiled Systems Audit & AI Hallucination Caught (Part A)
- **Keyset Pagination & Rate Limiting:** Formally specified high-throughput cursor parsing and fixed-window IP quota counters.
- **The Node.js Buffer Slice Hallucination:** In `cookie-signature.unsign`, an LLM audit asserted that searching for a non-existent dot (`.`) causes `slice(0, -1)` to throw an `IndexOutOfBoundsException`. In JavaScript/Node.js, `slice(0, -1)` safely strips the trailing character and proceeds to the HMAC timing-safe comparison, failing securely without throwing.
- **Proration Defect Caught:** Identified an unbounded subtraction bug in subscription cancellations where timestamps outside the billing cycle produced negative charges or refunds exceeding the original plan price.

### Feature Specification & Differential Analysis (Parts B & C)
- **The Feature:** `applyCouponCode` handles percentage and fixed discount types with minimum order spend, customer limits, global lifetime limits, expiration timestamps, and a non-negative total clamp.
- **The Fractional Cent Ambiguity:** In Step 9, the specification instructed to *"divide by 100, and round to nearest integer"*.
  - Reference implementation used standard arithmetic rounding: `Math.round(37.5) = 38¢`.
  - AI implementation used financial integer floor truncation: `Math.floor(37.5) = 37¢`.
  - On a $2.50 order with a 15% coupon, the two implementations **disagreed by exactly 1 cent**.
- **The Resolution:** Rewrote Step 9 to explicitly mandate standard `round-half-up` arithmetic, producing 100% deterministic results across all platforms.
