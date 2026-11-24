# Stage 4 — Bug Tracker & Implementation Gaps

**Evidence rule:** A known missing feature is a **gap**, not an observed runtime defect. A bug requires reproduction steps, actual output and environment.

## Implementation gaps (source review, not executed bug reports)

| ID | Severity if shipped | Gap | Owner | Verification gate | Status |
|---|---|---|---|---|---|
| GAP-01 | High | Secure listing image upload/validation missing | Backend + UI | Backend upload tests; frontend acceptance still required | Backend verified; UI open |
| GAP-02 | High | Seller/admin/private/bidding React journeys incomplete | Aseel, Ghadi | QA-14–16/21 | Open |
| GAP-03 | Critical blocker | Genuine bank sandbox commitment unverified | Abeer, Ghadi | QA-07 + provider evidence | Blocked |
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

| ID | Environment and reproduction | Expected / observed | Fix and retest |
|---|---|---|---|
| BUG-ABEER-01 | Node.js 24.22.1; call validMoney(10000000.03) in the original money.js | Valid two-decimal amount accepted / returned false | Parse decimal parts into integer cents. New money regression passes; native PostgreSQL suite: 77 passed, 0 failed, 0 skipped on 2026-10-24. |

These results cover this personal backend; they do not establish a complete frontend journey or real bank sandbox integration.

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
