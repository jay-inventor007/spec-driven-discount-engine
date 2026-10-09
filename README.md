# Engineering Task 5: Pseudocoding

A rigorous exploration of pseudocode as an independent engineering discipline: reading existing code into formal pseudocode, verifying implementations by hand-tracing, finding planted defects, specifying new features prior to code generation, directing AI implementation from specification, and verifying the AI-generated output line by line.

---

## 1. The Pseudocode Standard

Every function in this repository adheres strictly to the bootcamp standard specification:

```text
FUNCTION <name>
INPUTS: <each input with its type and what it means>
OUTPUT: <what is returned with its type>
SIDE EFFECTS: <anything written, sent, or changed outside, or NONE>
FAILS WHEN: <every condition under which this function cannot succeed>

1. Numbered steps. One action per step.
2. Plain English, present tense, no code syntax ("Look up the user by email" not "user = db.find(email)").
3. Explicit branches (IF ... THEN ... OTHERWISE ... END IF).
4. Explicit loops (FOR EACH ... IN ... END FOR).
5. Explicit early exits (IF <condition> THEN RETURN <error> END IF).
6. Marked external calls (CALL database / external API (may fail, may be slow)).
7. Marked state changes (WRITE <record / header / store>).
```

---

## 2. Repository Structure

```
engineering-task-5-pseudocoding/
├── package.json                          # Test scripts and module configuration
├── part-a/
│   ├── a1/                               # 3 functions from our own codebase + hand traces
│   │   ├── 1-cursor-pagination.md        # Keyset cursor pagination & encoding (Complex)
│   │   ├── 2-rate-limiter.md             # Fixed-window IP rate limiter (Auth/Quota)
│   │   └── 3-error-handler.md            # Central Express error normalizer (Error Handling)
│   ├── a2/                               # 3 open-source functions + AI comparisons
│   │   ├── 1-cookie-signature-unsign.md  # cookie-signature .unsign (Short) + AI error caught
│   │   ├── 2-cookie-parse.md             # cookie .parse (Medium) + AI comparison
│   │   └── 3-p-limit.md                  # p-limit concurrency limiter (Complex) + AI comparison
│   └── a3/                               # Function with planted bug (Actual vs Intended)
│       └── planted-bug.md                # Prorated subscription refund calculator
├── part-b/
│   ├── pseudocode.md                     # Feature pseudocode + 5 hand-traced inputs
│   └── implementation/
│       ├── applyCouponCode.js            # Manual code mapped step-by-step to B1
│       └── run-b-traces.js               # Runner validating all 5 hand-traced inputs
├── part-c/
│   ├── ai-implementation/
│   │   └── applyCouponCodeAI.js          # Code produced by AI strictly from B1 pseudocode
│   ├── reverse-pseudocode.md             # Pseudocode reverse-engineered from AI implementation
│   ├── difference-table.md               # Classified differences: Added, Omitted, Ambiguous
│   ├── comparison-test/
│   │   └── compare-implementations.js    # 10-input automated comparison runner (B2 vs C1)
│   └── recording-notes.md                # Non-technical explanation notes & listener feedback
├── public-post.md                        # Shareable post draft reflecting on pseudocoding
└── README.md
```

---

## 3. Running the Test Suites

This repository has zero external production dependencies and runs natively on Node.js 18+:

```bash
# Run both verification suites
npm test

# Run Part B: 5 hand-traced inputs verification
npm run test:part-b

# Run Part C: 10-input automated comparison (Manual B2 vs AI C1)
npm run test:part-c
```

---

## 4. Key Highlights & Findings

### Part A: Code Analysis & Planted Bug
- **A1:** Analyzed 3 critical subsystems (keyset cursor pagination, rate limiting, and centralized error handling) with comprehensive input/output trace tables.
- **A2 AI Error Caught:** In `cookie-signature.unsign`, the AI claimed that when a string lacks a dot delimiter, `lastIndexOf('.')` returning `-1` causes `slice(0, -1)` to throw an `IndexOutOfBoundsException` or return an empty string. In JavaScript, `slice(0, -1)` strips the final character and safely continues to the HMAC timing-safe comparison, failing securely without throwing.
- **A3 Planted Bug:** Identified an unbounded proration defect in subscription cancellation where canceling outside the cycle range produces negative refunds or refunds exceeding the original plan price.

### Part B & C: Feature Design, AI Direction & Ambiguity Resolution
- **Feature:** `applyCouponCode` handles percentage and fixed discount types with minimum spend, customer limits, global limits, expiration dates, and a non-negative total clamp.
- **Part B Manual Trace:** 5 diverse test inputs (normal percentage, expired date, customer limit hit, fixed discount clamping to zero, subtotal below minimum spend) hand-traced step-by-step.
- **Part C Ambiguity Exposure:** In Step 9, the pseudocode instructed to *"round to nearest integer"*. The manual code implemented `Math.round` (round half up: 37.5 ¢ $\rightarrow$ 38 ¢), whereas the AI implemented `Math.floor` (truncation: 37.5 ¢ $\rightarrow$ 37 ¢). The 10-input automated comparison suite isolated this 1-cent divergence in Test 9.
- **The Fix:** Rewrote Step 9 to explicitly mandate standard round-half-up arithmetic, eliminating platform divergence across human and AI implementations.
