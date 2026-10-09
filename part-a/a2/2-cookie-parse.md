# Step A2 - Function 2 (Medium): `cookie.parse`

**Library:** `cookie` (v0.6.0) — industry-standard HTTP Cookie header parser  
**GitHub:** `https://github.com/jshttp/cookie`

---

## 1. Original Source Code

```js
function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = options || {};
  var dec = opt.decode || decodeURIComponent;

  var index = 0;
  while (index < str.length) {
    var eqIdx = str.indexOf('=', index);
    if (eqIdx === -1) {
      break;
    }

    var endIdx = str.indexOf(';', index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      // index on ';' stealing from previous value
      index = str.lastIndexOf(';', eqIdx - 1) + 1;
      continue;
    }

    var key = str.slice(index, eqIdx).trim();

    // only assign once
    if (undefined === obj[key]) {
      var val = str.slice(eqIdx + 1, endIdx).trim();

      // quoted values
      if (val.charCodeAt(0) === 0x22) {
        val = val.slice(1, -1);
      }

      try {
        obj[key] = dec(val);
      } catch (e) {
        obj[key] = val;
      }
    }

    index = endIdx + 1;
  }

  return obj;
}
```

---

## 2. Pseudocode (Standard Format)

```text
FUNCTION parseCookies
INPUTS:
  str: raw HTTP Cookie header string
  options: optional configuration object containing custom decode function

OUTPUT:
  obj: key-value dictionary of parsed cookie names and decoded values

SIDE EFFECTS:
  NONE

FAILS WHEN:
  - str is not of type string (throws TypeError)

1. IF str is not of type string THEN
     RETURN error: argument str must be a string.
   OTHERWISE
     continue
   END IF
2. Initialize an empty key-value dictionary for parsed cookies.
3. Identify decoder function from options, defaulting to standard URL percent decoding.
4. Initialize current character scanning index at 0.
5. WHILE current scanning index is less than the length of str DO
     Find index of the next "=" character starting from the current index.
     IF no "=" character is found THEN
       BREAK out of the loop.
     END IF

     Find index of the next ";" delimiter starting from the current index.
     IF no ";" character is found THEN
       Set end index to the total length of str.
     OTHERWISE IF ";" index is less than "=" index THEN
       Set current index to one position after the previous ";" delimiter before the "=" character.
       CONTINUE to the next iteration.
     END IF

     Extract string from current index to "=" index, trimming surrounding whitespace, as cookie key.
     IF cookie key does not already exist in the parsed dictionary THEN
       Extract string from one character after "=" index to end index, trimming surrounding whitespace, as cookie value.
       IF cookie value starts with a double quote character THEN
         Strip the first and last characters from the cookie value.
       OTHERWISE
         continue
       END IF

       TRY
         CALL decoder function with cookie value and store result in dictionary under cookie key.
       CATCH decoding failure
         Store raw un-decoded cookie value in dictionary under cookie key.
       END TRY
     OTHERWISE
       continue (ignore duplicate keys, first occurrence wins)
     END IF

     Set current scanning index to one character past the end index.
   END WHILE
6. RETURN the parsed cookies dictionary.
```

---

## 3. Hand-Trace Tables

### Trace 1: Normal Input (Multiple Standard Cookies)
- **Input:** `str = "user=alice; theme=dark"`, `options = undefined`

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 1–4 | Init | `obj = {}`, `index = 0` |
| 5 (Iter 1) | Find `=` (idx 4), `;` (idx 10) | `key = "user"`, `val = "alice"`, not quoted. |
| 5 | Decode and store | `obj["user"] = "alice"`, advance `index = 11` |
| 5 (Iter 2) | Find `=` (idx 17), no `;` (endIdx 22) | `key = "theme"`, `val = "dark"`. |
| 5 | Decode and store | `obj["theme"] = "dark"`, advance `index = 23` |
| 6 | Exit loop | **Returns `{"user": "alice", "theme": "dark"}`** |

### Trace 2: Edge Case (Quoted Value and Duplicate Cookie Name)
- **Input:** `str = 'token="xyz%20123"; token="ignored"'`

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 5 (Iter 1) | First pair `token="xyz%20123"` | `key = "token"`, `val = '"xyz%20123"'`. Starts with quote -> strips quotes -> `"xyz%20123"`. Decodes `%20` -> `"xyz 123"`. `obj["token"] = "xyz 123"`. |
| 5 (Iter 2) | Second pair `token="ignored"` | `key = "token"`. Check `undefined === obj["token"]` is false -> skipped! |
| 6 | Return | **Returns `{"token": "xyz 123"}` (First cookie wins)** |

### Trace 3: Invalid Input (Malformed Percent-Encoding in Value)
- **Input:** `str = "session=%E0%A4%9"` (incomplete UTF-8 byte sequence)

| Step | Action Taken | Internal State / Output |
| :---: | :--- | :--- |
| 5 | Parse key/val | `key = "session"`, `val = "%E0%A4%9"` |
| 5 | Try `decodeURIComponent` | Standard decoder throws `URIError: URI malformed`. Caught by `catch` block! |
| 5 | Fallback assignment | Stores raw value: `obj["session"] = "%E0%A4%9"`. |
| 6 | Return | **Returns `{"session": "%E0%A4%9"}`** without crashing. |

---

## 4. AI Comparison Notes

- **Student's First Pass Finding:** The parser deliberately catches decoding exceptions and falls back to assigning the raw un-decoded string, rather than letting `URIError` crash the application.
- **Where the AI was wrong:** In the AI comparison, the AI stated that duplicate cookies with the same key would overwrite each other so the *last* cookie wins. Reading the code line 28 (`if (undefined === obj[key])`) proves that is wrong: the *first* cookie assigned is preserved and subsequent duplicates are ignored. My manual trace was correct.
