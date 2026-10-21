# BE-10 — Advertisement Approval and Rejection Testing Report

**Team member:** Ghadi

**Week:** 2 — Backend

**Task deadline:** 21 October 2026

**Testing method:** Manual testing using the terminal and curl.

## Goal

Check that only admins can review advertisements and that approval and rejection save the correct status, rejection reason, and review details.

Also check that invalid decisions and empty rejection reasons are rejected, and that an advertisement cannot be reviewed again after a decision has been made.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Review request without a token | Reject the request | `401 UNAUTHORIZED` | Passed |
| Review request with a regular user token | Reject access | `403 FORBIDDEN` | Passed |
| Send the unsupported decision `ACCEPT` | Reject the input | `400 INVALID_INPUT` | Passed |
| Reject an advertisement without a reason | Reject the input | `400 INVALID_INPUT` | Passed |
| Reject an advertisement with a spaces-only reason | Reject the input | `400 INVALID_INPUT` | Passed |
| Approve a pending advertisement | Approve it and save review details | `200 OK` with status `APPROVED` | Passed |
| Attempt to reject the approved advertisement | Reject the repeated review | `409 INVALID_STATE` | Passed |
| Reject a pending advertisement with a valid reason | Reject it and save the reason and review details | `200 OK` with status `REJECTED` | Passed |

## Testing Method

I tested the advertisement review route manually using `curl` commands in the VS Code terminal.

PostgreSQL was running in Docker, and the backend was running locally on port `3000`. I kept the backend running and used another terminal to send requests.

I used the regular user account `test@example.com` and the admin account `admin@example.com`.

I had obtained each account's token from `data.token` in its login response in the terminal. I placed that token after `Bearer` in requests for that account.

For each test, I compared the HTTP status and response body with the expected result.

## Test Data

I used two advertisements prepared during BE-09 testing. Both had the status `PENDING_REVIEW` before the review tests:

- `Test Car`, with ID `4d5dc010-0fa4-48bd-bdff-810e1cc4703b`. I had created it using a `POST /items` request.
- `Test Car 2`, with ID `24a8b097-4ef2-4b17-b362-572fcf496539`. I had added it to the database using an `INSERT` command to prepare BE-09 test data.

I used the first advertisement to test approval and repeated review protection. I used the second to test rejection and saving the rejection reason.

## Test Cases and Commands

### Test 1 — Review Request Without a Token

I sent a review request without an `Authorization` header:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend rejected the request and returned `401 Unauthorized`, error code `UNAUTHORIZED`, and the message `Sign in required`.

### Test 2 — Regular User Attempting to Review an Advertisement

I sent the request using a token belonging to an account with the role `USER`:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend rejected access and returned `403 Forbidden`, error code `FORBIDDEN`, and the message `Admin only`.

### Test 3 — Unsupported Decision

I used the admin token and sent `ACCEPT` instead of `APPROVED` or `REJECTED`:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"ACCEPT"}'
```

**Result:** The backend rejected the input and returned `400 Bad Request`, error code `INVALID_INPUT`, and the message:

```text
Valid decision and rejection reason required
```

### Test 4 — Rejection Without a Reason

I sent the decision `REJECTED` without the `reason` field:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED"}'
```

**Result:** The backend rejected the input and returned `400 Bad Request` with error code `INVALID_INPUT` because rejection requires a reason.

### Test 5 — Spaces-Only Rejection Reason

I sent a rejection reason containing three spaces:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED","reason":"   "}'
```

**Result:** The backend rejected the input and returned `400 Bad Request` with error code `INVALID_INPUT`. Spaces alone were not accepted as a written reason.

### Test 6 — Approving an Advertisement

I sent an approval decision for `Test Car`:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"APPROVED"}'
```

**Result:** The backend returned `200 OK` with the updated advertisement:

- `status` was `APPROVED`.
- `review_reason` was `null`.
- `reviewed_by` contained the admin ID `b8aa1615-1a07-42d7-bc7f-6c58a4330221`.
- `reviewed_at` contained a review timestamp.

### Test 7 — Attempting to Review an Approved Advertisement

I attempted to reject the same advertisement after approval and provided a valid reason:

```bash
curl -i -X POST http://localhost:3000/admin/items/4d5dc010-0fa4-48bd-bdff-810e1cc4703b/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** The backend rejected the request and returned `409 Conflict`, error code `INVALID_STATE`, and the message `Listing not pending review`.

The advertisement was no longer pending review, so another review through this route was not allowed.

### Test 8 — Rejecting an Advertisement With a Valid Reason

I used the pending advertisement `Test Car 2` and sent the rejection reason `Missing car details`:

```bash
curl -i -X POST http://localhost:3000/admin/items/24a8b097-4ef2-4b17-b362-572fcf496539/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** The backend returned `200 OK` with the updated advertisement:

- `status` was `REJECTED`.
- `review_reason` contained `Missing car details`.
- `reviewed_by` contained the admin ID.
- `reviewed_at` contained a review timestamp.

## Testing Result

All eight test cases matched the expected results.

Review requests without a token or with a regular user role were rejected. Unsupported decisions and rejection requests with missing or spaces-only reasons were also rejected.

Approval and rejection succeeded with the expected review details. The rejection reason was saved, and the attempt to review the approved advertisement again was rejected.