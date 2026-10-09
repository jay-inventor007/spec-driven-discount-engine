# Step A2 - Function 3 (Complex): `p-limit` (Concurrency Limiter)

**Library:** `p-limit` (v4.0.0 / v5.0.0) — the industry-standard async concurrency limiter  
**GitHub:** `https://github.com/sindresorhus/p-limit`

---

## 1. Original Source Code

```js
export default function pLimit(concurrency) {
  if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up');
  }

  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = async (fn, resolve, args) => {
    activeCount++;
    const result = (async () => fn(...args))();
    resolve(result);

    try {
      await result;
    } catch {}

    next();
  };

  const enqueue = (fn, resolve, args) => {
    queue.push(run.bind(undefined, fn, resolve, args));

    (async () => {
      await Promise.resolve();

      if (activeCount < concurrency && queue.length > 0) {
        queue.shift()();
      }
    })();
  };

  const generator = (fn, ...args) => new Promise((resolve) => {
    enqueue(fn, resolve, args);
  });

  return generator;
}
```

---

## 2. Pseudocode (Standard Format)

```text
FUNCTION pLimit
INPUTS:
  concurrency: positive integer or Infinity defining maximum simultaneous in-flight operations

OUTPUT:
  generator: a callable limiter function that wraps async tasks in a controlled concurrency queue

SIDE EFFECTS:
  Maintains internal queue state and active count across asynchronous execution loops.

FAILS WHEN:
  - concurrency is not a positive integer (throws TypeError)

1. IF concurrency is not a positive integer AND concurrency is not Infinity THEN
     RETURN error: Expected concurrency to be a number from 1 and up.
   OTHERWISE
     continue
   END IF
2. Initialize an empty FIFO task queue.
3. Initialize active task counter at 0.

4. DEFINE internal helper next:
     Decrement active task counter by 1.
     IF task queue is not empty THEN
       Remove the oldest queued runner from the front of the queue and execute it.
     OTHERWISE
       continue
     END IF
   END DEFINE

5. DEFINE internal helper run(fn, resolve, args):
     Increment active task counter by 1.
     Execute fn with args as an asynchronous promise.
     Resolve the outer caller's promise immediately with that task's execution promise.
     WAIT FOR task promise to settle (ignoring any thrown errors so queue progression does not break).
     CALL next to release the active concurrency slot.
   END DEFINE

6. DEFINE internal helper enqueue(fn, resolve, args):
     Wrap run with fn, resolve, and args, and append it to the back of the task queue.
     Yield execution to the microtask queue (allowing caller to register additional tasks synchronously).
     IF active task counter is strictly less than concurrency limit AND task queue is not empty THEN
       Remove the oldest runner from the front of the queue and execute it.
     OTHERWISE
       continue (task remains queued until a running task calls next)
     END IF
   END DEFINE

7. DEFINE generator(fn, args):
     Create a new Promise with resolver.
     CALL enqueue with fn, resolver, and args.
     RETURN the Promise to the caller.
   END DEFINE

8. RETURN generator function to the caller.
```

---

## 3. Hand-Trace Tables

### Trace 1: Normal Input (2 Tasks within Concurrency Cap = 2)
- **Input:** `limit = pLimit(2)`. Call `limit(taskA)`, then `limit(taskB)`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| Init | Setup limiter | `concurrency = 2`, `queue = []`, `activeCount = 0` |
| 1 | Enqueue taskA | `queue = [taskA]`. Microtask yields. `activeCount (0) < 2` -> runs taskA. `activeCount = 1`. |
| 2 | Enqueue taskB | `queue = [taskB]`. Microtask yields. `activeCount (1) < 2` -> runs taskB. `activeCount = 2`. |
| 3 | Both in flight | Both run concurrently. When taskA finishes, `next()` decrements `activeCount = 1`. Queue is empty. |

- **Comparison to real code execution:** Matches execution exactly.

---

### Trace 2: Edge Case (Task Queuing Exceeding Cap = 1)
- **Input:** `limit = pLimit(1)`. Call `limit(taskA)`, `limit(taskB)`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1 | Enqueue taskA | Runs taskA immediately. `activeCount = 1`. |
| 2 | Enqueue taskB | `queue = [taskB]`. Microtask runs: `activeCount (1) < 1` is false! `taskB` stays in queue. |
| 3 | taskA completes | `taskA` finishes -> calls `next()`. `activeCount` becomes 0. `queue.length > 0` is true -> dequeues and runs `taskB`! `activeCount` becomes 1. |
| 4 | taskB completes | `taskB` finishes -> calls `next()`. `activeCount` becomes 0. Queue empty. |

- **Comparison to real code execution:** Matches execution exactly.

---

### Trace 3: Invalid Input (Task Rejection / Thrown Error)
- **Input:** `limit(taskThatThrows)`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1 | `run()` starts | `activeCount = 1`. `resolve(result)` hands rejected promise back to caller. |
| 2 | `try { await result; } catch {}` | The error rejection is swallowed *inside* the limiter runner, preventing unhandled runner crashes. |
| 3 | `next()` called | Crucial: `next()` executes in the `finally` path, decrementing `activeCount = 0` so the queue never gets permanently locked up! |

- **Comparison to real code execution:** Matches execution exactly.

---

## 4. AI Comparison Notes

- **Student's First Pass Finding:** The `try { await result; } catch {}` block inside `run` is what protects the queue from deadlock. If a task throws or rejects, `resolve(result)` still propagates the rejection to the caller, while the runner gracefully swallows it internally to ensure `next()` is executed.
- **Where the AI was wrong:** When asked why `resolve(result)` is called *before* `await result`, the AI initially claimed that `resolve()` completes the operation before the function finishes. That is a misunderstanding of Promises: resolving an outer promise with an inner pending promise links their resolution without awaiting it. It is what allows the caller to attach `.then()` / `.catch()` immediately while the runner manages lifecycle and concurrency boundaries in the background. My manual trace was correct.
