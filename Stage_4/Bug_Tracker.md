# Stage 4 — Bug Tracker & Implementation Gaps

**Evidence rule:** A known missing feature is a **gap**, not an observed runtime defect. A bug requires reproduction steps, actual output and environment.

## Implementation gaps (source review, not executed bug reports)

| ID | Severity if shipped | Gap | Owner | Verification gate | Status |
|---|---|---|---|---|---|
| GAP-01 | High | Secure listing image upload/validation missing | Backend + UI | Backend upload tests; frontend acceptance still required | Backend verified; UI open |
| GAP-02 | High | Seller/admin/private/bidding React journeys incomplete | Aseel, Ghadi | QA-14–16/21 | Open |
| GAP-03 | Critical blocker | Genuine bank sandbox commitment unverified | Abeer, Ghadi | QA-07 + provider evidence | Blocked |
| GAP-04 | High | Concurrency and closure untested against PostgreSQL | Abeer, Tala; QA | Native PostgreSQL: 77/77 backend tests; see docs/backend-handoff.md | Personal backend verified; team QA pending |
| GAP-05 | Medium | Private access brute-force protection needs verification | Backend + QA | marketplace-fixes.test.js: repeated guesses return 429 without a grant | Backend verified; team QA pending |

## Verified runtime bugs

| ID | Environment and reproduction | Expected / observed | Fix and retest |
|---|---|---|---|
| BUG-ABEER-01 | Node.js 24.22.1; call validMoney(10000000.03) in the original money.js | Valid two-decimal amount accepted / returned false | Parse decimal parts into integer cents. New money regression passes; native PostgreSQL suite: 77 passed, 0 failed, 0 skipped on 2026-10-24. |

Evidence and remaining scope differences: docs/backend-handoff.md. These results cover this personal backend; they do not establish a complete frontend journey or real bank sandbox integration.

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
