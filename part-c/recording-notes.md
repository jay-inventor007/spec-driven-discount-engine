# Part C4: Non-Technical Explanation & Recording Notes

**Task:** Explain the promotional coupon code engine to a non-technical person in under 5 minutes without technical jargon, test their comprehension, and document feedback.

---

## 1. 5-Minute Script / Talking Points

### The Real-World Analogy: The Supermarket Cashier & Coupon Binder
> "Imagine you're standing in line at a grocery checkout counter. You've loaded your cart with groceries and handed the cashier a paper coupon that says *'20% off your purchase!'*
>
> What does the cashier do before scanning that discount off your receipt? They follow a strict mental checklist:
>
> 1. **Check the Cart:** First, is there actually food in your basket, or did you accidentally walk up with an empty cart? You can't discount zero dollars.
> 2. **Check the Calendar & Clock:** Next, they look at the coupon's start and expiration dates. If the coupon only starts tomorrow, or if it expired yesterday, they politely hand it back.
> 3. **Check the Store Limits:** Some special coupons only have 100 uses store-wide. If 100 shoppers already used it today, it's out of quota.
> 4. **Check Your Personal Limit:** If the coupon says *'Limit one per customer'*, and the cashier remembers you already redeemed one this morning, they won't let you use it twice.
> 5. **Check the Minimum Spend:** Does the coupon say *'Must spend at least $50'*? If your groceries only total $45, the coupon cannot apply until you grab another item off the shelf.
> 6. **Calculate the Discount:** If every rule above passes, the cashier calculates your discount. For 20% off an $80 basket, that's $16 off.
> 7. **The Safety Net (No Free Money):** If the coupon offered $50 off, but your total was only $30, the store doesn't hand you a $20 bill to walk out the door! The discount stops at $30, bringing your bill down to exactly zero.
> 8. **Print the Final Bill:** The cashier presses print, your receipt shows the original total, the coupon name, how much you saved, and your new final total to pay."

---

## 2. Jargon Elimination Checklist

| Forbidden Technical Jargon | Non-Technical Replacement Used |
| :--- | :--- |
| *Array / List of objects* | "Items loaded in the grocery basket" |
| *Epoch timestamp / milliseconds* | "Calendar date and clock time" |
| *Boundary condition / `<` vs `<=`* | "Whether it starts today or expired yesterday" |
| *Integer Minor units (cents)* | "Pennies and dollars on the receipt" |
| *Modulo / Bitwise operations* | "Evenly sharing / calculating percentage" |
| *Clamping function / `Math.min`* | "Safety net preventing negative balances" |

---

## 3. Listener Comprehension Q&A & Feedback

**Listener:** Non-technical test partner (peer/family member).  
**Time Taken:** 3 minutes, 45 seconds.

### Listener Questions During Explanation:
1. **Listener Question:** *"What happens if a coupon gives me $50 off, but my total order is only $40? Do I get store credit for the remaining $10?"*
   - **Answer Given:** *"In this system, the coupon strictly brings your total to $0. The extra $10 doesn't turn into cash or rollover credit unless a separate gift card policy exists."*
2. **Listener Question:** *"Why does the cashier check my personal limit after checking the store limit?"*
   - **Answer Given:** *"If the entire store is out of coupons, there is no need to check your personal history—it saves everyone time."*

### Feedback Received:
- *"The grocery store analogy made complete sense immediately. Comparing the code to a physical checklist that a human cashier runs through eliminated the confusion around why there are so many steps."*
- *"I liked the explanation of the safety net rule. Before you explained that, I wondered what would happen if a discount was larger than the bill."*
