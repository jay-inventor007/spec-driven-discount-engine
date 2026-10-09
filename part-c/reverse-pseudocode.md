# Part C: Reverse-Engineered Pseudocode (from AI Implementation)

This document contains the pseudocode reverse-engineered line-by-line from the AI implementation (`part-c/ai-implementation/applyCouponCodeAI.js`).

---

## 1. Specification

```text
FUNCTION applyCouponCodeAI
INPUTS:
  cart: object containing:
    - items: array of objects with itemId (string), quantity (number), and unitPriceCents (number)
    - subtotalCents: number representing order subtotal in cents
  coupon: object containing:
    - code: string representing coupon identifier
    - discountType: string ("percentage" or "fixed_amount")
    - discountValue: number
    - minSpendCents: number
    - maxDiscountCents: optional number or null
    - startsAtMs: number
    - expiresAtMs: number
    - maxUsesTotal: number
    - currentUsesTotal: number
    - perCustomerLimit: number
  customerId: string
  customerUsageCount: number
  nowMs: number

OUTPUT:
  result: object containing:
    - success: boolean
    - discountCents: number (when success is true)
    - finalTotalCents: number (when success is true)
    - couponCode: string (when success is true)
    - errorCode: string (when success is false)
    - errorMessage: string (when success is false)

SIDE EFFECTS:
  NONE

FAILS WHEN:
  - cart is falsy, cart.items is falsy or empty array, or cart.subtotalCents <= 0
  - any item has quantity <= 0 or unitPriceCents < 0
  - nowMs < coupon.startsAtMs
  - nowMs >= coupon.expiresAtMs
  - coupon.currentUsesTotal >= coupon.maxUsesTotal
  - customerUsageCount >= coupon.perCustomerLimit
  - cart.subtotalCents < coupon.minSpendCents
  - coupon.discountType is "percentage" but discountValue < 1 or discountValue > 100
  - coupon.discountType is "fixed_amount" but discountValue <= 0
  - coupon.discountType is not recognized

1. IF cart is null/undefined OR cart items is null/undefined OR length of cart items is 0 OR cart subtotalCents is less than or equal to 0 THEN
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

8. Declare rawDiscountCents initialized to 0.

9. IF coupon discountType equals "percentage" THEN
     IF coupon discountValue is less than 1 OR coupon discountValue is greater than 100 THEN
       RETURN failure with errorCode "INVALID_PERCENTAGE" and errorMessage "Percentage discount must be between 1 and 100".
     END IF
     Calculate rawDiscountCents by taking floor of (cart subtotalCents * coupon discountValue / 100).
   OTHERWISE IF coupon discountType equals "fixed_amount" THEN
     IF coupon discountValue is less than or equal to 0 THEN
       RETURN failure with errorCode "INVALID_FIXED_AMOUNT" and errorMessage "Fixed discount value must be greater than zero".
     END IF
     Set rawDiscountCents to coupon discountValue.
   OTHERWISE
     RETURN failure with errorCode "UNSUPPORTED_DISCOUNT_TYPE" and errorMessage "Unsupported discount type".
   END IF

10. Set calculatedDiscountCents to rawDiscountCents.
    IF coupon maxDiscountCents is not null AND coupon maxDiscountCents is not undefined THEN
      IF rawDiscountCents is strictly greater than coupon maxDiscountCents THEN
        Set calculatedDiscountCents to coupon maxDiscountCents.
      END IF
    END IF

11. Set finalDiscountCents to calculatedDiscountCents.
    IF calculatedDiscountCents is strictly greater than cart subtotalCents THEN
      Set finalDiscountCents to cart subtotalCents.
    END IF

12. Calculate finalTotalCents by subtracting finalDiscountCents from cart subtotalCents.

13. RETURN success with discountCents equal to finalDiscountCents, finalTotalCents equal to finalTotalCents, and couponCode equal to coupon code.
```
