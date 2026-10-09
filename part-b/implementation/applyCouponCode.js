/**
 * @file applyCouponCode.js
 * @description Manual implementation of promotional discount code engine,
 * mapped step-by-step to the Part B pseudocode specification.
 */

/**
 * @typedef {Object} CartItem
 * @property {string} itemId
 * @property {number} quantity
 * @property {number} unitPriceCents
 * 
 * @typedef {Object} Cart
 * @property {CartItem[]} items
 * @property {number} subtotalCents
 * 
 * @typedef {Object} Coupon
 * @property {string} code
 * @property {'percentage' | 'fixed_amount'} discountType
 * @property {number} discountValue
 * @property {number} minSpendCents
 * @property {number | null} maxDiscountCents
 * @property {number} startsAtMs
 * @property {number} expiresAtMs
 * @property {number} maxUsesTotal
 * @property {number} currentUsesTotal
 * @property {number} perCustomerLimit
 * 
 * @typedef {Object} ApplyCouponSuccess
 * @property {true} success
 * @property {number} discountCents
 * @property {number} finalTotalCents
 * @property {string} couponCode
 * 
 * @typedef {Object} ApplyCouponFailure
 * @property {false} success
 * @property {string} errorCode
 * @property {string} errorMessage
 * 
 * @typedef {ApplyCouponSuccess | ApplyCouponFailure} ApplyCouponResult
 */

/**
 * Applies a promotional coupon code to a cart according to business rules.
 * 
 * @param {Cart} cart
 * @param {Coupon} coupon
 * @param {string} customerId
 * @param {number} customerUsageCount
 * @param {number} nowMs
 * @returns {ApplyCouponResult}
 */
export function applyCouponCode(cart, coupon, customerId, customerUsageCount, nowMs) {
  // Step 1: Validate cart existence and non-empty subtotal
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0 || cart.subtotalCents <= 0) {
    return {
      success: false,
      errorCode: 'EMPTY_CART',
      errorMessage: 'Cart must contain at least one item with a positive subtotal'
    };
  }

  // Step 2: Validate item quantities and item unit prices
  for (const item of cart.items) {
    if (item.quantity <= 0) {
      return {
        success: false,
        errorCode: 'INVALID_ITEM_QUANTITY',
        errorMessage: 'Item quantity must be greater than zero'
      };
    }
    if (item.unitPriceCents < 0) {
      return {
        success: false,
        errorCode: 'INVALID_ITEM_PRICE',
        errorMessage: 'Item price cannot be negative'
      };
    }
  }

  // Step 3: Check if coupon is active
  if (nowMs < coupon.startsAtMs) {
    return {
      success: false,
      errorCode: 'COUPON_NOT_YET_ACTIVE',
      errorMessage: 'This coupon code is not active yet'
    };
  }

  // Step 4: Check if coupon has expired
  if (nowMs >= coupon.expiresAtMs) {
    return {
      success: false,
      errorCode: 'COUPON_EXPIRED',
      errorMessage: 'This coupon code has expired'
    };
  }

  // Step 5: Check global lifetime usage limit
  if (coupon.currentUsesTotal >= coupon.maxUsesTotal) {
    return {
      success: false,
      errorCode: 'GLOBAL_USAGE_LIMIT_EXCEEDED',
      errorMessage: 'This coupon has reached its maximum total redemptions'
    };
  }

  // Step 6: Check individual customer usage limit
  if (customerUsageCount >= coupon.perCustomerLimit) {
    return {
      success: false,
      errorCode: 'CUSTOMER_USAGE_LIMIT_EXCEEDED',
      errorMessage: 'You have already reached the maximum redemption limit for this coupon'
    };
  }

  // Step 7: Check cart subtotal minimum spend requirement
  if (cart.subtotalCents < coupon.minSpendCents) {
    return {
      success: false,
      errorCode: 'MINIMUM_SPEND_NOT_MET',
      errorMessage: 'Order subtotal does not meet the minimum spend requirement for this coupon'
    };
  }

  // Step 8: Declare rawDiscountCents initialized to 0
  let rawDiscountCents = 0;

  // Step 9: Calculate raw discount depending on discountType
  if (coupon.discountType === 'percentage') {
    if (coupon.discountValue < 1 || coupon.discountValue > 100) {
      return {
        success: false,
        errorCode: 'INVALID_PERCENTAGE',
        errorMessage: 'Percentage discount must be between 1 and 100'
      };
    }
    // "multiplying cart subtotalCents by coupon discountValue, dividing by 100, and rounding to nearest integer"
    rawDiscountCents = Math.round((cart.subtotalCents * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'fixed_amount') {
    if (coupon.discountValue <= 0) {
      return {
        success: false,
        errorCode: 'INVALID_FIXED_AMOUNT',
        errorMessage: 'Fixed discount value must be greater than zero'
      };
    }
    rawDiscountCents = coupon.discountValue;
  } else {
    return {
      success: false,
      errorCode: 'UNSUPPORTED_DISCOUNT_TYPE',
      errorMessage: 'Unsupported discount type'
    };
  }

  // Step 10: Apply optional maximum discount cap for percentage discounts
  let calculatedDiscountCents = rawDiscountCents;
  if (coupon.maxDiscountCents !== null && coupon.maxDiscountCents !== undefined) {
    if (rawDiscountCents > coupon.maxDiscountCents) {
      calculatedDiscountCents = coupon.maxDiscountCents;
    }
  }

  // Step 11: Prevent negative total by capping discount to subtotal
  let finalDiscountCents = calculatedDiscountCents;
  if (calculatedDiscountCents > cart.subtotalCents) {
    finalDiscountCents = cart.subtotalCents;
  }

  // Step 12: Compute final balance after discount
  const finalTotalCents = cart.subtotalCents - finalDiscountCents;

  // Step 13: Return success summary
  return {
    success: true,
    discountCents: finalDiscountCents,
    finalTotalCents: finalTotalCents,
    couponCode: coupon.code
  };
}
