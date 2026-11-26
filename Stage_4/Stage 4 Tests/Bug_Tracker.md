# Stage 4 — Bug Tracker & Implementation Gaps

**Evidence rule:** A known missing feature is a **gap**, not an observed runtime defect. A bug requires reproduction steps, actual output and environment.

## Implementation gaps (source review, not executed bug reports)

| ID | Severity if shipped | Gap | Owner | Verification gate | Status |
|---|---|---|---|---|---|
| GAP-01 | High | Secure listing image upload/validation missing | Backend + UI | Backend upload tests; frontend acceptance still required | Backend verified; UI open |
| GAP-02 | High | Seller/admin/private/bidding React journeys incomplete | Abeer | QA-14–16/21 | Open |
| GAP-03 | Critical blocker | Genuine bank sandbox commitment unverified |  Ghadi | QA-07 + provider evidence | Blocked |
| GAP-04 | High | Concurrency and closure untested against PostgreSQL | Abeer, Tala; QA | Native PostgreSQL: 77/77 backend tests | Personal backend verified; team QA pending |
| GAP-05 | Medium | Private access brute-force protection needs verification | Backend + QA | marketplace-fixes.test.js: repeated guesses return 429 without a grant | Backend verified; team QA pending |

### Status Update — 21 November 2026

The table above records earlier concerns, not confirmed bugs. The following checks were performed on a local copy of Mezyad 

- **GAP-01 — Listing images:** Image upload worked from the seller interface.
- **GAP-02 — Auction workflows:** Listing review, private auction access, and bidding worked.
- **GAP-03 — Moyasar commitment:** Moyasar approved the test commitment, and Mezyad saved a valid bid.
- **GAP-04 — Closure and simultaneous bids:** Auctions closed correctly with and without a winner. With Moyasar in test mode, two equal bids were submitted at the same time. One was saved, and the other was rejected because it was below the updated minimum.
- **GAP-05 — Private auction codes:** The correct code granted access, and an incorrect code was rejected. The limit on repeated attempts was not retested.


## Verified runtime bugs

### BUG-01: The bid screen did not recognize an approved commitment

| Field | Details |
| --- | --- |
| Environment | A local copy of Mezyad with Moyasar in test mode. |
| Steps to reproduce | Open an auction as a bidder, complete the test commitment, and return to the auction page. |
| Expected result | Mezyad recognizes the approved commitment and lets the bidder place a valid bid. |
| Actual result before the fix | The request to read the commitment returned 404. Mezyad treated the bidder as if they had no commitment and blocked bidding. |
| Cause | The frontend used the wrong API base path to read the commitment. |
| Fix | Corrected the API path in `frontend/src/features/auctions/hooks/useMarket.js`. [Fix commit](https://github.com/Abeerr0/mezyad/commit/f2f791fc71fc9dc10ae55461916e836003b9178d) |
| Manual retest | I tested the fix on a local copy. Mezyad recognized the approved test commitment and recorded a valid bid. |
| Status | Fixed and verified locally. |
| Owner | Ghadi |


### BUG-02: Incorrect Monetary Amount Validation

| Field | Details |
| --- | --- |
| BUG ID / Title | BUG-02 — Incorrect Monetary Amount Validation |
| Severity | High |
| Environment and commit SHA | Node.js 24.22.1 — [Original version](https://github.com/Abeerr0/mezyad/blob/c7700721e3c5bedab404245e4e102b26b964ee8b/backend/src/money.js#L1-L6) |
| Preconditions | A valid monetary amount containing two decimal places. |
| Steps to reproduce | Call `validMoney(10000000.03)` using the original implementation. |
| Expected | The function accepts the amount and returns `true`. |
| Actual | The function returned `false` for a valid amount. |
| Root cause | Floating-point precision errors when multiplying decimal amounts by 100. |
| Impact | Valid auction prices and bid amounts could be rejected. |
| Owner | Abeer |
| Fix | Convert monetary amounts into integer halalas by separating the whole and fractional parts. |
| Fix PR/commit | [Fixed validation — money.js](https://github.com/Abeerr0/mezyad/blob/Development/backend/src/money.js#L1-L9) · [Integer conversion — money.js](https://github.com/Abeerr0/mezyad/blob/Development/backend/src/money.js#L11-L23) |
| Retest date/result | 24 October 2026 — Recorded results: 77 passed, 0 failed, 0 skipped. [Regression test code](https://github.com/Abeerr0/mezyad/blob/Development/backend/tests/money.test.js#L15-L24) |
| State | Verified locally. |



### BUG-03: User Session Lost After Page Refresh

| Field | Details |
| --- | --- |
| BUG ID / Title | BUG-03 — User Session Lost After Page Refresh |
| Severity | Medium |
| Environment and commit SHA | React frontend — [Original version](https://github.com/Abeerr0/mezyad/blob/8d259d8615e54e92b660fba2e91d4b9f04c8c35c/frontend/src/main.jsx) |
| Preconditions | The user is successfully logged into Mezyad. |
| Steps to reproduce | Log in with valid credentials and refresh the browser page. |
| Expected | The user remains authenticated while the session is valid. |
| Actual | Authentication data was stored only in React state, which resets on page refresh. Identified through source review. |
| Root cause | Authentication data was not persisted outside `useState`. |
| Impact | Users could lose their login state and experience interruptions during authenticated workflows. |
| Owner | Abeer |
| Fix | Store authentication data in `sessionStorage`, restore it on page load, and clear it when the session ends. |
| Fix PR/commit | [Session restoration — useWorkspace.js](https://github.com/Abeerr0/mezyad/blob/Development/frontend/src/features/account/hooks/useWorkspace.js#L64-L75) · [Session persistence — useWorkspace.js](https://github.com/Abeerr0/mezyad/blob/Development/frontend/src/features/account/hooks/useWorkspace.js#L76-L87) · [Expired session handling](https://github.com/Abeerr0/mezyad/blob/Development/frontend/src/features/account/hooks/useWorkspace.js#L89-L103) |
| Retest date/result | 26 November 2026 — Source code verified. Browser retest pending. |
| State | Fixed. |




## Defect entry template

**BUG ID / title:**  
**Severity:** Critical / High / Medium / Low  
**Environment and commit SHA:**  
**Preconditions:**  
**Steps to reproduce:**  
**Expected:**  
**Actual (log/screenshot):**  
**Owner:**  
**Fix PR/commit:**  
**Retest date/result:**  
**State:** Open / In Progress / Fixed / Verified / Closed
