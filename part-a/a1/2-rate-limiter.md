# Step A1 - Function 2 (Touches Authorisation / Quotas): Fixed-Window IP Rate Limiter

**Source Code Reference:** `engineering-task-1-consumable-api/api/src/lib/rateLimit.ts` (`rateLimit`)

---

## 1. Pseudocode

```text
FUNCTION rateLimit
INPUTS:
  req: HTTP request object containing client IP address
  res: HTTP response object for setting rate limit headers
  next: callback function to continue request pipeline or pass errors

OUTPUT:
  None

SIDE EFFECTS:
  - Updates the in-memory window tracking map for the client IP.
  - Sets X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers on the response.
  - Sets Retry-After header on response if rate limit is exceeded.

FAILS WHEN:
  - Client IP has exceeded the maximum allowed requests within the current fixed time window.

1. Read configured window duration in milliseconds and maximum allowed requests per window from configuration.
2. Determine client IP address from the request; IF IP is missing THEN set IP to "unknown".
3. Record current timestamp in milliseconds.
4. Look up rate limit window record for the client IP in the in-memory map.
5. IF no window record exists for the IP OR the window's reset timestamp is less than or equal to current timestamp THEN
     WRITE new window record for IP into memory with count 0 and reset timestamp equal to current timestamp plus window duration.
   OTHERWISE
     continue
   END IF
6. WRITE increment window request count by 1.
7. Calculate seconds remaining until window reset by subtracting current timestamp from reset timestamp, dividing by 1000, and rounding up.
8. WRITE response header "X-RateLimit-Limit" with maximum allowed requests.
9. Calculate remaining quota by subtracting current request count from maximum allowed requests, or 0 if negative.
10. WRITE response header "X-RateLimit-Remaining" with remaining quota.
11. WRITE response header "X-RateLimit-Reset" with seconds remaining until reset.
12. IF window request count is strictly greater than maximum allowed requests THEN
      WRITE response header "Retry-After" with seconds remaining until reset.
      CALL next handler with error 429 RATE_LIMITED.
      RETURN
    OTHERWISE
      CALL next handler with no error.
      RETURN
    END IF
```

---

## 2. Hand-Trace Tables

### Trace 1: Normal Input (First Request of New Window)
- **Configuration:** `maxRequestsPerWindow = 60`, `windowMs = 60,000` (60s).
- **Initial state:** `windows` map is empty.
- **Input:** Request from IP `"102.89.23.4"`, current time `t = 100,000`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–3 | Setup parameters | `max = 60`, `ip = "102.89.23.4"`, `now = 100,000` |
| 4 | Lookup in map | `window = undefined` |
| 5 | Create window record | `windows.set("102.89.23.4", { count: 0, resetAt: 160,000 })` |
| 6 | Increment count | `window.count = 1` |
| 7 | Calculate reset seconds | `ceil((160,000 - 100,000) / 1000) = 60` |
| 8–11 | Set response headers | `X-RateLimit-Limit: 60`, `X-RateLimit-Remaining: 59`, `X-RateLimit-Reset: 60` |
| 12 | Check threshold (`1 > 60` is false) | Calls `next()` with no error. |

- **Comparison to real code execution:** Matches execution exactly.

---

### Trace 2: Edge Case (Final Allowed Request at Cap)
- **Initial state:** IP `"102.89.23.4"` has `count = 59`, `resetAt = 160,000`.
- **Input:** 60th request from IP at time `t = 120,000` (40 seconds remaining).

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–3 | Read inputs | `now = 120,000` |
| 4–5 | Lookup existing window | Record found, `160,000 > 120,000` (not expired) |
| 6 | Increment count | `window.count = 60` |
| 7 | Calculate reset seconds | `ceil((160,000 - 120,000) / 1000) = 40` |
| 8–11 | Set response headers | `X-RateLimit-Limit: 60`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: 40` |
| 12 | Check threshold (`60 > 60` is false) | Calls `next()` with no error. (Request admitted). |

- **Comparison to real code execution:** Matches execution exactly. The 60th request is admitted with `X-RateLimit-Remaining: 0`.

---

### Trace 3: Invalid / Rate-Limited Input (61st Request Exceeding Cap)
- **Initial state:** IP `"102.89.23.4"` has `count = 60`, `resetAt = 160,000`.
- **Input:** 61st request from IP at time `t = 125,000` (35 seconds remaining).

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–5 | Lookup existing window | Record found, not expired |
| 6 | Increment count | `window.count = 61` |
| 7 | Calculate reset seconds | `ceil((160,000 - 125,000) / 1000) = 35` |
| 8–11 | Set response headers | `X-RateLimit-Limit: 60`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: 35` |
| 12 | Check threshold (`61 > 60` is true) | Sets `Retry-After: 35`. Calls `next(new ApiError(429, "RATE_LIMITED", ...))`. Request halted. |

- **Comparison to real code execution:** Matches execution exactly.

---

## 3. Discrepancy & Correction Note
- **Initial Observation:** When drafting step 12, I originally wrote `IF count >= maximum`.
- **Trace vs Execution Discrepancy:** When tracing Trace 2 (60th request), an `>=` check would reject the 60th request, effectively making the limit 59 requests instead of 60. In the real implementation, `window.count > maxRequestsPerWindow` is strictly greater than, so the 60th request is allowed through, and only the 61st request triggers 429.
- **Correction:** Updated step 12 to strictly specify: `IF window request count is strictly greater than maximum allowed requests`.
