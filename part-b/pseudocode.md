# Part B: Feature Specification - Promotional Discount Code Engine

**Feature:** Applying an e-commerce coupon code with strict validation for validity dates, global and per-customer usage caps, minimum order thresholds, and monetary caps preventing negative balances.

---

## 1. Complete Pseudocode Specification

```text
FUNCTION applyCouponCode
INPUTS:
  cart: object containing:
    - items: list of objects with itemId (string), quantity (integer), and unitPriceCents (integer)
    - subtotalCents: integer representing cart subtotal in minor units
  coupon: object containing:
    - code: string representing coupon identifier
    - discountType: string ("percentage" or "fixed_amount")
    - discountValue: integer (percentage points 1..100 or minor units in cents)
    - minSpendCents: integer (0 or positive minimum subtotal required)
    - maxDiscountCents: optional integer cap for percentage discounts, or null if uncapped
    - startsAtMs: integer epoch timestamp when coupon becomes active
    - expiresAtMs: integer epoch timestamp when coupon expires
    - maxUsesTotal: integer total lifetime redemptions allowed across all users
    - currentUsesTotal: integer current lifetime redemptions already consumed
    - perCustomerLimit: integer maximum redemptions allowed per individual customer
  customerId: string representing unique customer identifier
  customerUsageCount: integer number of times this customer has already redeemed this coupon
  nowMs: integer epoch timestamp representing the current time

OUTPUT:
  result: object containing:
    - success: boolean
    - discountCents: integer (if success is true)
    - finalTotalCents: integer (if success is true)
    - couponCode: string (if success is true)
    - errorCode: string (if success is false)
    - errorMessage: string (if success is false)

SIDE EFFECTS:
  NONE

FAILS WHEN:
  - cart items list is empty or subtotalCents is less than or equal to 0
  - any cart item has quantity less than or equal to 0 or unitPriceCents less than 0
  - nowMs is strictly less than coupon startsAtMs (coupon not yet active)
  - nowMs is greater than or equal to coupon expiresAtMs (coupon expired)
  - coupon currentUsesTotal is greater than or equal to coupon maxUsesTotal (global cap reached)
  - customerUsageCount is greater than or equal to coupon perCustomerLimit (per-customer limit reached)
  - cart subtotalCents is strictly less than coupon minSpendCents (minimum spend not met)
  - coupon discountType is neither "percentage" nor "fixed_amount"

1. IF cart items list is empty OR cart subtotalCents is less than or equal to 0 THEN
     RETURN failure with errorCode "EMPTY_CART" and errorMessage "Cart must contain at least one item with a positive subtotal".
   OTHERWISE
     continue
   END IF

2. FOR EACH item IN cart items DO
     IF item quantity is less than or equal to 0 THEN
       RETURN failure with errorCode "INVALID_ITEM_QUANTITY" and errorMessage "Item quantity must be greater than zero".
     END IF
     IF item unitPriceCents is less than 0 THEN
       RETURN failure with errorCode "INVALID_ITEM_PRICE" and errorMessage "Item price cannot be negative".
     END IF
   END FOR

3. IF nowMs is strictly less than coupon startsAtMs THEN
     RETURN failure with errorCode "COUPON_NOT_YET_ACTIVE" and errorMessage "This coupon code is not active yet".
   OTHERWISE
     continue
   END IF

4. IF nowMs is greater than or equal to coupon expiresAtMs THEN
     RETURN failure with errorCode "COUPON_EXPIRED" and errorMessage "This coupon code has expired".
   OTHERWISE
     continue
   END IF

5. IF coupon currentUsesTotal is greater than or equal to coupon maxUsesTotal THEN
     RETURN failure with errorCode "GLOBAL_USAGE_LIMIT_EXCEEDED" and errorMessage "This coupon has reached its maximum total redemptions".
   OTHERWISE
     continue
   END IF

6. IF customerUsageCount is greater than or equal to coupon perCustomerLimit THEN
     RETURN failure with errorCode "CUSTOMER_USAGE_LIMIT_EXCEEDED" and errorMessage "You have already reached the maximum redemption limit for this coupon".
   OTHERWISE
     continue
   END IF

7. IF cart subtotalCents is strictly less than coupon minSpendCents THEN
     RETURN failure with errorCode "MINIMUM_SPEND_NOT_MET" and errorMessage "Order subtotal does not meet the minimum spend requirement for this coupon".
   OTHERWISE
     continue
   END IF

8. Declare rawDiscountCents as an integer initialized to 0.

9. IF coupon discountType equals "percentage" THEN
     IF coupon discountValue is less than 1 OR coupon discountValue is greater than 100 THEN
       RETURN failure with errorCode "INVALID_PERCENTAGE" and errorMessage "Percentage discount must be between 1 and 100".
     END IF
     Calculate percentage amount by multiplying cart subtotalCents by coupon discountValue, dividing by 100, and rounding to nearest integer.
     Set rawDiscountCents to percentage amount.
   OTHERWISE IF coupon discountType equals "fixed_amount" THEN
     IF coupon discountValue is less than or equal to 0 THEN
       RETURN failure with errorCode "INVALID_FIXED_AMOUNT" and errorMessage "Fixed discount value must be greater than zero".
     END IF
     Set rawDiscountCents to coupon discountValue.
   OTHERWISE
     RETURN failure with errorCode "UNSUPPORTED_DISCOUNT_TYPE" and errorMessage "Unsupported discount type".
   END IF

10. IF coupon maxDiscountCents is not null AND rawDiscountCents is strictly greater than coupon maxDiscountCents THEN
      Set calculatedDiscountCents to coupon maxDiscountCents.
    OTHERWISE
      Set calculatedDiscountCents to rawDiscountCents.
    END IF

11. IF calculatedDiscountCents is strictly greater than cart subtotalCents THEN
      Set finalDiscountCents to cart subtotalCents.
    OTHERWISE
      Set finalDiscountCents to calculatedDiscountCents.
    END IF

12. Calculate finalTotalCents by subtracting finalDiscountCents from cart subtotalCents.

13. RETURN success with discountCents equal to finalDiscountCents, finalTotalCents equal to finalTotalCents, and couponCode equal to coupon code.
```

---

## 2. Five Hand-Traced Inputs

### Shared Fixtures:
- Standard percentage coupon `SAVE20`:
  `{ code: "SAVE20", discountType: "percentage", discountValue: 20, minSpendCents: 5000, maxDiscountCents: 3000, startsAtMs: 1000, expiresAtMs: 5000, maxUsesTotal: 100, currentUsesTotal: 10, perCustomerLimit: 1 }`
- Standard fixed coupon `FLAT50`:
  `{ code: "FLAT50", discountType: "fixed_amount", discountValue: 5000, minSpendCents: 2000, maxDiscountCents: null, startsAtMs: 1000, expiresAtMs: 5000, maxUsesTotal: 100, currentUsesTotal: 10, perCustomerLimit: 2 }`

---

### Trace 1: Normal Valid Percentage Coupon
- **Input:**
  - `cart`: items `[{ itemId: "i1", quantity: 2, unitPriceCents: 5000 }]`, `subtotalCents = 10000` ($100.00)
  - `coupon`: `SAVE20`
  - `customerId`: `"cust_1"`, `customerUsageCount = 0`
  - `nowMs = 2000` (within valid window)

| Step | Evaluation | State |
| :---: | :--- | :--- |
| 1–2 | Cart validation | 1 item, qty 2, price 5000 -> valid |
| 3–4 | Date validation | `1000 <= 2000 < 5000` -> valid |
| 5–6 | Usage limit | `10 < 100` and `0 < 1` -> valid |
| 7 | Min spend | `10000 >= 5000` -> valid |
| 8–9 | Discount calculation | `round((10000 * 20) / 100) = 2000` |
| 10 | Max discount check | `2000 < 3000` cap -> `calculatedDiscountCents = 2000` |
| 11 | Cart clamp check | `2000 < 10000` -> `finalDiscountCents = 2000` |
| 12–13 | Final total | `finalTotalCents = 10000 - 2000 = 8000` ($80.00) |
| **Result** | **SUCCESS** | `{ success: true, discountCents: 2000, finalTotalCents: 8000, couponCode: "SAVE20" }` |

---

### Trace 2: Awkward Case 1 — Expired Coupon
- **Input:**
  - `coupon`: `SAVE20` (`expiresAtMs = 5000`)
  - `nowMs = 5000` (exact boundary where `nowMs >= expiresAtMs`)

| Step | Evaluation | State |
| :---: | :--- | :--- |
| 1–3 | Cart & startsAt check | Valid |
| 4 | Expiry check (`5000 >= 5000` is true) | Triggers step 4 early exit. |
| **Result** | **FAILURE** | `{ success: false, errorCode: "COUPON_EXPIRED", errorMessage: "This coupon code has expired" }` |

---

### Trace 3: Awkward Case 2 — Customer Limit Exceeded
- **Input:**
  - `coupon`: `SAVE20` (`perCustomerLimit = 1`)
  - `customerUsageCount = 1`
  - `nowMs = 2000`

| Step | Evaluation | State |
| :---: | :--- | :--- |
| 1–5 | Cart, dates, global uses (`10 < 100`) | Valid |
| 6 | Customer usage check (`1 >= 1` is true) | Triggers step 6 early exit. |
| **Result** | **FAILURE** | `{ success: false, errorCode: "CUSTOMER_USAGE_LIMIT_EXCEEDED", errorMessage: "You have already reached the maximum redemption limit for this coupon" }` |

---

### Trace 4: Awkward Case 3 — Fixed Discount Exceeds Cart Subtotal (Zero Total Clamp)
- **Input:**
  - `cart`: items `[{ itemId: "i2", quantity: 1, unitPriceCents: 3000 }]`, `subtotalCents = 3000` ($30.00)
  - `coupon`: `FLAT50` (discountValue = 5000 cents / $50.00 off, minSpend = 2000)
  - `customerUsageCount = 0`, `nowMs = 2000`

| Step | Evaluation | State |
| :---: | :--- | :--- |
| 1–7 | Cart, dates, limits, min spend (`3000 >= 2000`) | Valid |
| 8–9 | Fixed discount calculation | `rawDiscountCents = 5000` |
| 10 | Max discount check (`null`) | `calculatedDiscountCents = 5000` |
| 11 | Cart subtotal clamp (`5000 > 3000` is true) | `finalDiscountCents = 3000` (discount clamped to prevent negative balance!) |
| 12–13 | Final total | `finalTotalCents = 3000 - 3000 = 0` |
| **Result** | **SUCCESS** | `{ success: true, discountCents: 3000, finalTotalCents: 0, couponCode: "FLAT50" }` |

---

### Trace 5: Awkward Case 4 — Subtotal Less Than Minimum Spend
- **Input:**
  - `cart`: items `[{ itemId: "i3", quantity: 1, unitPriceCents: 4500 }]`, `subtotalCents = 4500` ($45.00)
  - `coupon`: `SAVE20` (`minSpendCents = 5000`)
  - `nowMs = 2000`

| Step | Evaluation | State |
| :---: | :--- | :--- |
| 1–6 | Cart, dates, limits | Valid |
| 7 | Min spend check (`4500 < 5000` is true) | Triggers step 7 early exit. |
| **Result** | **FAILURE** | `{ success: false, errorCode: "MINIMUM_SPEND_NOT_MET", errorMessage: "Order subtotal does not meet the minimum spend requirement for this coupon" }` |
