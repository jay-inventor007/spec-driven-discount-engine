# Engineering Task 5: Pseudocoding

A rigorous exploration of pseudocode as an independent engineering discipline: reading existing code into formal pseudocode, verifying implementations by hand-tracing, finding planted bugs, specifying new features before writing code, directing AI implementation from specification, and verifying the AI-generated output line by line.

---

## The Pseudocode Standard

Every function in this repository follows the strict bootcamp specification:

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

## Repository Structure

```
engineering-task-5-pseudocoding/
├── part-a/
│   ├── a1/                     # 3 functions from our own slices + hand-trace tables
│   │   ├── 1-cursor-pagination.md  (Complex: Keyset pagination & nextCursor encoder)
│   │   ├── 2-rate-limiter.md        (Authorisation/Quota: Fixed-window IP limiter)
│   │   └── 3-error-handler.md       (Error Handling: Centralised API error normalizer)
│   ├── a2/                     # 3 open-source functions (short, medium, complex) + comparison
│   └── a3/                     # 1 function with a planted bug (actual vs intended)
├── part-b/                     # Feature specification & student manual implementation
│   ├── pseudocode.md           # Complete pseudocode + 5 hand-traced test cases
│   └── implementation/         # Manual code implemented directly from pseudocode
├── part-c/                     # AI direction, reverse-engineering & verification
│   ├── ai-implementation/      # Code produced by AI strictly from B1 pseudocode
│   ├── reverse-pseudocode.md   # Pseudocode reverse-engineered from AI code
│   ├── difference-table.md     # Classified differences: Added, Omitted, Ambiguous
│   ├── comparison-test/        # 10-input automated comparison runner (B2 vs C1)
│   └── recording-notes.md      # Non-technical explanation notes & listener feedback
└── README.md
```
