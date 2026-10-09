/**
 * @file run-b-traces.js
 * @description Test runner that executes the 5 hand-traced inputs from Part B
 * and asserts 100% equivalence with the hand-traced outputs.
 */

import { applyCouponCode } from './applyCouponCode.js';

const couponSave20 = {
  code: 'SAVE20',
  discountType: 'percentage',
  discountValue: 20,
  minSpendCents: 5000,
  maxDiscountCents: 3000,
  startsAtMs: 1000,
  expiresAtMs: 5000,
  maxUsesTotal: 100,
  currentUsesTotal: 10,
  perCustomerLimit: 1
};

const couponFlat50 = {
  code: 'FLAT50',
  discountType: 'fixed_amount',
  discountValue: 5000,
  minSpendCents: 2000,
  maxDiscountCents: null,
  startsAtMs: 1000,
  expiresAtMs: 5000,
  maxUsesTotal: 100,
  currentUsesTotal: 10,
  perCustomerLimit: 2
};

const traces = [
  {
    name: 'Trace 1: Normal Valid Percentage Coupon (SAVE20)',
    input: {
      cart: {
        items: [{ itemId: 'i1', quantity: 2, unitPriceCents: 5000 }],
        subtotalCents: 10000
      },
      coupon: couponSave20,
      customerId: 'cust_1',
      customerUsageCount: 0,
      nowMs: 2000
    },
    expected: {
      success: true,
      discountCents: 2000,
      finalTotalCents: 8000,
      couponCode: 'SAVE20'
    }
  },
  {
    name: 'Trace 2: Awkward Case 1 — Expired Coupon (nowMs >= expiresAtMs)',
    input: {
      cart: {
        items: [{ itemId: 'i1', quantity: 2, unitPriceCents: 5000 }],
        subtotalCents: 10000
      },
      coupon: couponSave20,
      customerId: 'cust_1',
      customerUsageCount: 0,
      nowMs: 5000
    },
    expected: {
      success: false,
      errorCode: 'COUPON_EXPIRED',
      errorMessage: 'This coupon code has expired'
    }
  },
  {
    name: 'Trace 3: Awkward Case 2 — Customer Limit Exceeded (usage >= limit)',
    input: {
      cart: {
        items: [{ itemId: 'i1', quantity: 2, unitPriceCents: 5000 }],
        subtotalCents: 10000
      },
      coupon: couponSave20,
      customerId: 'cust_1',
      customerUsageCount: 1,
      nowMs: 2000
    },
    expected: {
      success: false,
      errorCode: 'CUSTOMER_USAGE_LIMIT_EXCEEDED',
      errorMessage: 'You have already reached the maximum redemption limit for this coupon'
    }
  },
  {
    name: 'Trace 4: Awkward Case 3 — Fixed Discount Exceeds Subtotal (Zero Clamp)',
    input: {
      cart: {
        items: [{ itemId: 'i2', quantity: 1, unitPriceCents: 3000 }],
        subtotalCents: 3000
      },
      coupon: couponFlat50,
      customerId: 'cust_2',
      customerUsageCount: 0,
      nowMs: 2000
    },
    expected: {
      success: true,
      discountCents: 3000,
      finalTotalCents: 0,
      couponCode: 'FLAT50'
    }
  },
  {
    name: 'Trace 5: Awkward Case 4 — Subtotal Less Than Minimum Spend',
    input: {
      cart: {
        items: [{ itemId: 'i3', quantity: 1, unitPriceCents: 4500 }],
        subtotalCents: 4500
      },
      coupon: couponSave20,
      customerId: 'cust_3',
      customerUsageCount: 0,
      nowMs: 2000
    },
    expected: {
      success: false,
      errorCode: 'MINIMUM_SPEND_NOT_MET',
      errorMessage: 'Order subtotal does not meet the minimum spend requirement for this coupon'
    }
  }
];

function runAll() {
  console.log('====================================================');
  console.log('PART B: EXECUTING 5 HAND-TRACED INPUT VERIFICATIONS');
  console.log('====================================================\n');

  let passed = 0;

  for (let i = 0; i < traces.length; i++) {
    const trace = traces[i];
    const actual = applyCouponCode(
      trace.input.cart,
      trace.input.coupon,
      trace.input.customerId,
      trace.input.customerUsageCount,
      trace.input.nowMs
    );

    const match = JSON.stringify(actual) === JSON.stringify(trace.expected);

    console.log(`[Trace ${i + 1}] ${trace.name}`);
    console.log(`  Expected:`, JSON.stringify(trace.expected));
    console.log(`  Actual:  `, JSON.stringify(actual));

    if (match) {
      console.log(`  Status:   PASSED (Matches hand trace perfectly)\n`);
      passed++;
    } else {
      console.error(`  Status:   FAILED! Output diverges from hand trace!\n`);
    }
  }

  console.log(`Summary: ${passed}/${traces.length} hand-traces verified successfully.`);
  if (passed === traces.length) {
    console.log('All Part B trace expectations confirmed.\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAll();
