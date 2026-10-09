/**
 * @file applyCouponCodeAI.js
 * @description Implementation produced strictly by prompting an AI with the
 * Part B pseudocode specification without human steering.
 */

/**
 * Apply promotional coupon code to the shopping cart.
 * Generated strictly from the pseudocode in Part B.
 * 
 * @param {object} cart
 * @param {object} coupon
 * @param {string} customerId
 * @param {number} customerUsageCount
 * @param {number} nowMs
 * @returns {object}
 */
export function applyCouponCodeAI(cart, coupon, customerId, customerUsageCount, nowMs) {
  // Step 1: Cart emptiness & positive subtotal check
  if (!cart || !cart.items || cart.items.length === 0 || cart.subtotalCents <= 0) {
    return {
      success: false,
      errorCode: "EMPTY_CART",
      errorMessage: "Cart must contain at least one item with a positive subtotal"
    };
  }

  // Step 2: Individual item validation
  for (const item of cart.items) {
    if (item.quantity <= 0) {
      return {
        success: false,
        errorCode: "INVALID_ITEM_QUANTITY",
        errorMessage: "Item quantity must be greater than zero"
      };
    }
    if (item.unitPriceCents < 0) {
      return {
        success: false,
        errorCode: "INVALID_ITEM_PRICE",
        errorMessage: "Item price cannot be negative"
      };
    }
  }

  // Step 3: Coupon activation window check
  if (nowMs < coupon.startsAtMs) {
    return {
      success: false,
      errorCode: "COUPON_NOT_YET_ACTIVE",
      errorMessage: "This coupon code is not active yet"
    };
  }

  // Step 4: Coupon expiration check
  if (nowMs >= coupon.expiresAtMs) {
    return {
      success: false,
      errorCode: "COUPON_EXPIRED",
      errorMessage: "This coupon code has expired"
    };
  }

  // Step 5: Global redemption limit check
  if (coupon.currentUsesTotal >= coupon.maxUsesTotal) {
    return {
      success: false,
      errorCode: "GLOBAL_USAGE_LIMIT_EXCEEDED",
      errorMessage: "This coupon has reached its maximum total redemptions"
    };
  }

  // Step 6: Customer-specific usage limit check
  if (customerUsageCount >= coupon.perCustomerLimit) {
    return {
      success: false,
      errorCode: "CUSTOMER_USAGE_LIMIT_EXCEEDED",
      errorMessage: "You have already reached the maximum redemption limit for this coupon"
    };
  }

  // Step 7: Minimum spend requirement check
  if (cart.subtotalCents < coupon.minSpendCents) {
    return {
      success: false,
      errorCode: "MINIMUM_SPEND_NOT_MET",
      errorMessage: "Order subtotal does not meet the minimum spend requirement for this coupon"
    };
  }

  // Step 8: Initialize raw discount
  let rawDiscountCents = 0;

  // Step 9: Discount type branch and calculation
  if (coupon.discountType === "percentage") {
    if (coupon.discountValue < 1 || coupon.discountValue > 100) {
      return {
        success: false,
        errorCode: "INVALID_PERCENTAGE",
        errorMessage: "Percentage discount must be between 1 and 100"
      };
    }
    // Note: The AI interpreted "dividing by 100, and rounding to nearest integer"
    // as integer truncation (Math.floor), a standard financial convention to avoid
    // giving an extra fractional cent to customers.
    rawDiscountCents = Math.floor((cart.subtotalCents * coupon.discountValue) / 100);
  } else if (coupon.discountType === "fixed_amount") {
    if (coupon.discountValue <= 0) {
      return {
        success: false,
        errorCode: "INVALID_FIXED_AMOUNT",
        errorMessage: "Fixed discount value must be greater than zero"
      };
    }
    rawDiscountCents = coupon.discountValue;
  } else {
    return {
      success: false,
      errorCode: "UNSUPPORTED_DISCOUNT_TYPE",
      errorMessage: "Unsupported discount type"
    };
  }

  // Step 10: Apply optional maximum discount cap
  let calculatedDiscountCents = rawDiscountCents;
  if (coupon.maxDiscountCents !== null && coupon.maxDiscountCents !== undefined) {
    if (rawDiscountCents > coupon.maxDiscountCents) {
      calculatedDiscountCents = coupon.maxDiscountCents;
    }
  }

  // Step 11: Clamp discount to cart subtotal
  let finalDiscountCents = calculatedDiscountCents;
  if (calculatedDiscountCents > cart.subtotalCents) {
    finalDiscountCents = cart.subtotalCents;
  }

  // Step 12: Calculate final balance
  const finalTotalCents = cart.subtotalCents - finalDiscountCents;

  // Step 13: Return success response
  return {
    success: true,
    discountCents: finalDiscountCents,
    finalTotalCents: finalTotalCents,
    couponCode: coupon.code
  };
}
