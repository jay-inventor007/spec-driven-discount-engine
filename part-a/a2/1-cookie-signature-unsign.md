# Step A2 - Function 1 (Short): `cookie-signature.unsign`

**Library:** `cookie-signature` (v1.0.6) — standard dependency used by Express `cookie-parser`  
**GitHub:** `https://github.com/tj/node-cookie-signature`

---

## 1. Original Source Code

```js
exports.unsign = function(input, secret){
  if ('string' != typeof input) throw new TypeError("Signed cookie string must be provided.");
  if ('string' != typeof secret) throw new TypeError("Secret string must be provided.");
  var tentativeValue = input.slice(0, input.lastIndexOf('.'));
  var expectedInput = exports.sign(tentativeValue, secret);
  var expectedBuffer = Buffer.from(expectedInput);
  var inputBuffer = Buffer.from(input);
  return (
    expectedBuffer.length === inputBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, inputBuffer)
  ) ? tentativeValue : false;
};
```

---

## 2. Pseudocode (Standard Format)

```text
FUNCTION unsign
INPUTS:
  input: string representing the signed cookie (e.g. "user123.DG7...signature")
  secret: string representing the HMAC secret key

OUTPUT:
  value: raw unsigned string if valid, or false if signature verification fails

SIDE EFFECTS:
  NONE

FAILS WHEN:
  - input is not a string (throws TypeError)
  - secret is not a string (throws TypeError)

1. IF input is not of type string THEN
     RETURN error: Signed cookie string must be provided.
   OTHERWISE
     continue
   END IF
2. IF secret is not of type string THEN
     RETURN error: Secret string must be provided.
   OTHERWISE
     continue
   END IF
3. Find the index of the last dot character in the input string.
4. Extract the substring from index 0 up to the last dot as the tentative payload value.
5. CALL sign with the tentative payload value and the secret to compute the expected signed string.
6. Convert the expected signed string into a raw byte buffer.
7. Convert the input signed string into a raw byte buffer.
8. IF the length of the expected buffer equals the length of the input buffer AND timing-safe byte comparison of both buffers returns true THEN
     RETURN tentative payload value.
   OTHERWISE
     RETURN false.
   END IF
```

---

## 3. Hand-Trace Tables

### Trace 1: Normal Input (Valid Signed Cookie)
- **Input:** `input = "session_alice.j1gX9B2..."`, `secret = "secret-key-1"`

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–2 | Type validations | Both strings -> continue |
| 3–4 | Slice at last dot | `tentativeValue = "session_alice"` |
| 5 | Compute expected signature | `expectedInput = sign("session_alice", "secret-key-1") = "session_alice.j1gX9B2..."` |
| 6–7 | Convert to buffers | `expectedBuffer` and `inputBuffer` created |
| 8 | Compare buffers | Lengths match, bytes match -> **Returns `"session_alice"`** |

### Trace 2: Edge Case (Dot in the Payload Value)
- **Input:** `input = "user.name.foo.H3gX..."` (payload contains multiple dots), `secret = "secret-key-1"`

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–2 | Type validations | Valid -> continue |
| 3–4 | `lastIndexOf('.')` | Slices at the final dot: `tentativeValue = "user.name.foo"` |
| 5–8 | Compute HMAC & compare | Re-signs `"user.name.foo"`; matches -> **Returns `"user.name.foo"`** |

### Trace 3: Invalid Input (Tampered Signature or No Dot)
- **Input:** `input = "session_alice"`, `secret = "secret-key-1"`

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 3–4 | `lastIndexOf('.')` | No dot found (`lastIndexOf` returns `-1`). `slice(0, -1)` strips the final character: `tentativeValue = "session_alic"` |
| 5 | Re-sign | Computes signature for `"session_alic"`, producing `"session_alic.<sig>"` |
| 8 | Compare lengths | `expectedBuffer.length !== inputBuffer.length` -> **Returns `false`** |

---

## 4. AI Comparison Notes (First Pass Without AI)

- **Student's First Pass Finding:** In Trace 3, when no dot is present in `input`, `lastIndexOf('.')` returns `-1`. The JavaScript `input.slice(0, -1)` does not return an empty string; it slices off the very last character of the input.
- **Where the AI was wrong:** When prompted to explain what happens when `input` contains no dot, the AI claimed that `lastIndexOf` returning -1 causes `slice(0, -1)` to throw an `IndexOutOfBoundsException` or return an empty string. That is false in JavaScript/Node.js: `slice(0, -1)` removes the trailing character and continues execution, safely failing at the timing comparison step without throwing. Reading the specification and ECMAScript spec confirmed my manual trace was correct.
