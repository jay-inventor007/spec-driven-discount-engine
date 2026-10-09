# Step A1 - Function 1 (The Most Complex): Keyset Cursor Pagination & Page Listing

**Source Code Reference:** `engineering-task-1-consumable-api/api/src/lib/list.ts` (`listPage` & `decodeCursor`)

---

## 1. Pseudocode

```text
FUNCTION listPage
INPUTS:
  spec: object containing table name, select columns, allowed sort fields, default sort, and default order
  page: object containing limit number, optional cursor string, sort field name, and order direction ("asc" or "desc")
  filters: key-value dictionary of user query filters
  conditions: object containing base SQL filter fragments and parameter values

OUTPUT:
  result: object containing data array and meta object (total, limit, hasMore, nextCursor)

SIDE EFFECTS:
  Reads rows from the database.

FAILS WHEN:
  - Database connection or query fails
  - Provided cursor string is malformed or cannot be decoded
  - Cursor signature (sort field, order, or filter hash) does not match the current request parameters

1. Look up the configuration for the requested sort field in the specification.
2. Compute a 12-character cryptographic hash of the active filter keys and values to fingerprint the query.
3. CALL database to count total matching records matching the base filter conditions (may fail, may be slow).
4. Store the count as total matching rows.
5. Copy the base query filter conditions and parameters into a working list.
6. IF an encoded cursor string was provided in the input THEN
     Decode the base64 URL string into JSON.
     IF decoding fails or cursor format is invalid THEN
       RETURN error: cursor is malformed
     END IF
     IF the cursor sort field does not match the requested sort field OR the cursor order does not match the requested order OR the cursor filter hash does not match the computed query fingerprint THEN
       RETURN error: cursor was issued for a different sort, order, or set of filters
     END IF
     Append the cursor sort value and tiebreaker ID to the query parameters.
     Determine comparison operator: ">" if order is ascending, otherwise "<".
     Append keyset seek condition comparing (sort column, record id) against cursor parameters.
   OTHERWISE
     continue
   END IF
7. Append limit plus one to the query parameters so we can detect whether a subsequent page exists.
8. CALL database to retrieve matching records ordered by the sort column and id up to limit plus one (may fail, may be slow).
9. IF the number of retrieved rows is greater than the requested limit THEN
     Mark hasMore as true.
     Trim the rows list to only include up to the requested limit.
   OTHERWISE
     Mark hasMore as false.
   END IF
10. IF hasMore is true AND the trimmed rows list is not empty THEN
      Take the final row in the trimmed list.
      Construct next cursor containing sort name, order direction, filter fingerprint, last sort column value, and last record id.
      Encode next cursor as base64 URL string.
    OTHERWISE
      Set next cursor to empty.
    END IF
11. Strip internal cursor metadata columns from each record in the final rows list.
12. RETURN object containing cleaned data rows and metadata (total, limit, hasMore, nextCursor).
```

---

## 2. Hand-Trace Tables

### Trace 1: Normal Input (First Page Fetch)
- **Input:**
  - `spec`: `from = "listings"`, `sortFields = { listed_at: { column: "listed_at", cast: "timestamptz" } }`
  - `page`: `limit = 2`, `cursor = undefined`, `sort = "listed_at"`, `order = "desc"`
  - `filters`: `{ city: "Lagos" }`
  - `conditions`: `parts = ["city = $1"]`, `params = ["Lagos"]`
- **Database state:** 3 listings in Lagos: L1 (listed 12:00), L2 (listed 11:00), L3 (listed 10:00).

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1 | Look up sort field configuration | `sortField = { column: "listed_at", cast: "timestamptz" }` |
| 2 | Hash filter `{ city: "Lagos" }` | `filterHash = "a1b2c3d4e5f6"` |
| 3 | Count query run | `SELECT count(*) FROM listings WHERE city = $1` with `["Lagos"]` |
| 4 | Store total count | `total = 3` |
| 5 | Copy conditions | `parts = ["city = $1"]`, `params = ["Lagos"]` |
| 6 | Check `page.cursor` | `page.cursor` is `undefined` -> continue |
| 7 | Add fetch limit (limit + 1) | `params = ["Lagos", 3]` (fetch up to 3 rows) |
| 8 | Query listings | Database returns 3 rows: `[L1, L2, L3]` |
| 9 | Check rows length vs limit (3 > 2) | `hasMore = true`, `pageRows = [L1, L2]` |
| 10 | Build next cursor from last row (L2) | `nextCursor = encode({ s: "listed_at", o: "desc", f: "a1b2c3d4e5f6", v: "11:00", id: L2.id })` |
| 11 | Clean internal cursor column | Clean `[L1, L2]` |
| 12 | Return result | `{ data: [L1, L2], meta: { total: 3, limit: 2, hasMore: true, nextCursor: "..." } }` |

- **Comparison to real code execution:** Matches execution exactly.

---

### Trace 2: Edge Case (Last Page with No Remaining Rows)
- **Input:**
  - Same spec, filters, sort, order.
  - `page`: `limit = 2`, `cursor = "<valid cursor for L2>"`.
- **Database state:** 1 row remaining after L2: `[L3]`.

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–5 | Setup and count | `total = 3`, `filterHash = "a1b2c3d4e5f6"` |
| 6 | Decode and validate cursor | Cursor valid; adds seek condition `(listed_at, id) < ($2::timestamptz, $3::uuid)` |
| 7 | Limit + 1 param | `params` has limit parameter `3` |
| 8 | Query listings | Database returns 1 row: `[L3]` |
| 9 | Check rows length vs limit (1 <= 2) | `hasMore = false`, `pageRows = [L3]` |
| 10 | Build next cursor (`hasMore` is false) | `nextCursor = null` |
| 11 | Clean data | Clean `[L3]` |
| 12 | Return result | `{ data: [L3], meta: { total: 3, limit: 2, hasMore: false, nextCursor: null } }` |

- **Comparison to real code execution:** Matches execution exactly.

---

### Trace 3: Invalid Input (Filter Mismatch on Cursor)
- **Input:**
  - `page`: `limit = 2`, `cursor = "<cursor issued under filter city=Lagos>"`.
  - `filters`: `{ city: "Abuja" }` (user changed city while retaining old cursor).

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–5 | Compute filter hash for `{ city: "Abuja" }` | `filterHash = "z9y8x7w6v5u4"` |
| 6 | Decode cursor and verify signature | Cursor has `f = "a1b2c3d4e5f6"`. Compares `cursor.f !== filterHash`. Condition triggers. |
| 6 (exit) | Early error return | **FAILS:** `ApiError(400, "INVALID_CURSOR", "cursor was issued for a different sort, order, or set of filters...")` |

- **Comparison to real code execution:** Matches execution exactly.

---

## 3. Discrepancy & Correction Note
- **Initial Observation:** In my first draft of the pseudocode, step 9 set `nextCursor` whenever `pageRows` was not empty.
- **Trace vs Execution Discrepancy:** When tracing Trace 2 (the final page), the real code only generates a `nextCursor` when `hasMore` is `true`. Giving a client a `nextCursor` on the last page leads to a redundant empty fetch.
- **Correction:** Clarified Step 10 with the explicit compound branch `IF hasMore is true AND the trimmed rows list is not empty THEN ... OTHERWISE Set next cursor to empty`.
