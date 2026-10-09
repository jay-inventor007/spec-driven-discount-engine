# Step A1 - Function 3 (Error Handling): Centralised API Error Handler

**Source Code Reference:** `engineering-task-1-consumable-api/api/src/lib/errors.ts` (`errorHandler`)

---

## 1. Pseudocode

```text
FUNCTION errorHandler
INPUTS:
  err: error object or thrown value passed from upstream Express middleware
  req: HTTP request object
  res: HTTP response object
  next: Express next callback function

OUTPUT:
  None

SIDE EFFECTS:
  - Writes HTTP status code and JSON error payload to the HTTP response stream.
  - Logs unhandled internal server errors to the server console.

FAILS WHEN:
  - HTTP response headers have already been transmitted to the client.

1. Declare a variable to hold the standardized API error structure.
2. IF the input error is an instance of ApiError THEN
     Assign the input error directly to the standardized API error.
   OTHERWISE IF the input error has type "entity.parse.failed" THEN
     Create new ApiError with status 400, code "INVALID_JSON", and message "Request body is not valid JSON".
   OTHERWISE IF the input error has type "entity.too.large" THEN
     Create new ApiError with status 413, code "PAYLOAD_TOO_LARGE", and message "Request body is too large".
   OTHERWISE IF the input error has database code "23505" (unique constraint violation) THEN
     Create new ApiError with status 409, code "CONFLICT", and message "This would create a duplicate record".
   OTHERWISE
     WRITE error details to server console for debugging.
     Create new ApiError with status 500, code "INTERNAL_ERROR", and message "Something went wrong on our side".
   END IF
3. Construct error response payload containing error code and message.
4. IF the standardized API error has field-level validation details THEN
     Attach details array to the error response payload.
   OTHERWISE
     continue
   END IF
5. WRITE HTTP status code of the standardized error to the response.
6. WRITE error response payload as JSON to the response.
7. RETURN
```

---

## 2. Hand-Trace Tables

### Trace 1: Normal Input (Explicit Domain ApiError - 404 NOT_FOUND)
- **Input:**
  - `err`: `new ApiError(404, "NOT_FOUND", "Listing not found")`
  - `res`: mock Express response object.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1 | Declare variable | `apiError = uninitialized` |
| 2 | Check `err instanceof ApiError` (true) | `apiError = err` (status 404, code "NOT_FOUND", msg "Listing not found") |
| 3 | Construct payload | `{ error: { code: "NOT_FOUND", message: "Listing not found" } }` |
| 4 | Check `details` (undefined) | No details attached. |
| 5–6 | Write status and JSON | `res.status(404).json({ error: { code: "NOT_FOUND", message: "Listing not found" } })` |
| 7 | Return | Response sent cleanly. |

- **Comparison to real code execution:** Matches execution exactly.

---

### Trace 2: Edge Case Input (PostgreSQL Unique Constraint Error '23505')
- **Input:**
  - `err`: Database driver error object `{ code: "23505", constraint: "agents_email_key", message: "duplicate key value..." }`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1 | Declare variable | `apiError = uninitialized` |
| 2 | Evaluate branches | Not `ApiError`; not parse failed; not entity too large; `err.code === "23505"` is true. |
| 2 (match) | Create conflict error | `apiError = new ApiError(409, "CONFLICT", "This would create a duplicate record")` |
| 3 | Construct payload | `{ error: { code: "CONFLICT", message: "This would create a duplicate record" } }` |
| 4 | Check `details` (none) | Continue. |
| 5–6 | Write status and JSON | `res.status(409).json({ error: { code: "CONFLICT", message: "This would create a duplicate record" } })` |
| 7 | Return | Response sent cleanly. |

- **Comparison to real code execution:** Matches execution exactly. Raw SQL / table details are safely hidden from the client.

---

### Trace 3: Invalid / Unhandled Runtime Error (Null Pointer Exception)
- **Input:**
  - `err`: `new TypeError("Cannot read properties of undefined (reading 'split')")`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1 | Declare variable | `apiError = uninitialized` |
| 2 | Evaluate branches | Does not match any known error types -> falls through to `OTHERWISE`. |
| 2 (fallback) | Log and redact | Logs `TypeError` stack trace to server console. Sets `apiError = new ApiError(500, "INTERNAL_ERROR", "Something went wrong on our side")`. |
| 3 | Construct payload | `{ error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side" } }` |
| 4–6 | Write status and JSON | `res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side" } })` |
| 7 | Return | Response sent cleanly. |

- **Comparison to real code execution:** Matches execution exactly. Prevents stack trace leakage to the client.

---

## 3. Discrepancy & Correction Note
- **Initial Observation:** In my first draft, I included `IF (res.headersSent) RETURN next(err)`.
- **Trace vs Execution Discrepancy:** While Express best practices recommend checking `res.headersSent`, the actual implementation in `errors.ts` does not contain this guard; it immediately calls `res.status().json()`.
- **Correction:** Removed the speculative `headersSent` check from pseudocode step 2 to accurately reflect the actual implementation in the repository, and documented it under `FAILS WHEN` as an honest limitation.
