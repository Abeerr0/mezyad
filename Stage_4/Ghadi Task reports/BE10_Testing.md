# BE-10 — Advertisement Approval and Rejection Testing Report

**Team member:** Ghadi

**Week:** 2 — Backend

**Task deadline:** 21 October 2026

**Retest date:** 15 November 2026

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

I tested the advertisement review route using `curl` commands in the VS Code terminal.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Test Data

I used pending listings for two accounts and signed in as the admin and regular user. I checked the saved decision, reviewer, time, and rejection reason where applicable.

## Test Cases and Commands

### Test 1 — Review Request Without a Token

I sent a review request without an `Authorization` header:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

### Test 2 — Regular User Attempting to Review an Advertisement

I sent the request using a token belonging to an account with the role `USER`:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `403 FORBIDDEN`.

### Test 3 — Unsupported Decision

I used the admin token and sent `ACCEPT` instead of `APPROVED` or `REJECTED`:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"ACCEPT"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 4 — Rejection Without a Reason

I sent the decision `REJECTED` without the `reason` field:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 5 — Spaces-Only Rejection Reason

I sent a rejection reason containing three spaces:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED","reason":"   "}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 6 — Approving an Advertisement

I sent an approval decision for `Test Car`:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"APPROVED"}'
```

**Result:** The backend returned `200`. The response showed `status=APPROVED reviewer and time saved`.

### Test 7 — Attempting to Review an Approved Advertisement

I attempted to reject the same advertisement after approval and provided a valid reason:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/6e3eabf0-d9a8-432b-8849-40c2efa6a901/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** The backend returned `409 INVALID_STATE`.

### Test 8 — Rejecting an Advertisement With a Valid Reason

I used the pending advertisement `Test Car 2` and sent the rejection reason `Missing car details`:

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/admin/items/ffc748ed-fed5-40a2-bc5c-1242303e8c7f/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** The backend returned `200`. The response showed `status=REJECTED reason=Missing car details`.

## Testing Result

All 8 cases matched their expected results.
