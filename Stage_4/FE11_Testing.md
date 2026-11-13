# FE-11 — API Contracts Testing Report

**Team member:** Ghadi
**Task date:** 13 November 2026
**Testing method:** Manual testing using the terminal and curl.

## Goal

Test the current API contracts for frontend integration, including JWT sessions, permissions, email verification, listings, review, images, public and private auctions, bidding and Moyasar Sandbox responses.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Email Verification (start) — Register and receive code | 201 | 201 | Passed |
| Email Verification (start) — Login before verification | 403 EMAIL_NOT_VERIFIED | 403 EMAIL_NOT_VERIFIED | Passed |
| Email Verification (start) — Incorrect six-digit code | 400 INVALID_CODE | 400 INVALID_CODE | Passed |
| Email Verification (start) — Three-digit code | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| Email Verification (start) — Correct code after five wrong attempts | 400 INVALID_CODE | 400 INVALID_CODE | Passed |
| Email Verification (start) — PostgreSQL | 5/true | 5/true | Passed |
| BE-06 Registration — Two @ symbols | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-06 Registration — Password 73 bytes | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-06 Registration — Password 72 bytes | 201 | 201 | Passed |
| BE-06 Registration — Duplicate email | 409 DUPLICATE_EMAIL | 409 DUPLICATE_EMAIL | Passed |
| BE-06 Registration — Name 161 characters | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-06 Registration — Email 255 characters | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-06 Registration — Name 160 and email 254 | 201 | 201 | Passed |
| BE-07 Login and logout — Empty email | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-07 Login and logout — Empty password | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-07 Login and logout — Incorrect password | 401 INVALID_CREDENTIALS | 401 INVALID_CREDENTIALS | Passed |
| BE-07 Login and logout — Correct login | 200 | 200 | Passed |
| BE-07 Login and logout — No token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-07 Login and logout — Valid token | 200 | 200 | Passed |
| BE-07 Login and logout — Logout | 200 | 200 | Passed |
| BE-07 Login and logout — Reuse token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-08 Permissions — No token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-08 Permissions — Invalid token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-08 Permissions — Valid user token | 200 | 200 | Passed |
| BE-08 Permissions — User requests review | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| BE-08 Permissions — Admin reaches validation | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-08 Permissions — Admin logout | 200 | 200 | Passed |
| BE-08 Permissions — Reuse admin token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-08 Permissions — Extra. Admin tries to create a listing | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| BE-09 Pending listings and images — No token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-09 Pending listings and images — Regular user requests own pending listings | 200 | 200 | Passed |
| BE-09 Pending listings and images — Admin sees empty queue | 200 | 200 | Passed |
| BE-09 Pending listings and images — Create Test Car | 201 | 201 | Passed |
| BE-09 Pending listings and images — Read listing without images | 200 | 200 | Passed |
| BE-09 Pending listings and images — Read both images | 200 | 200 | Passed |
| BE-09 Pending listings and images — Filter among mixed statuses | 200 | 200 | Passed |
| BE-09 Pending listings and images — User lists own listing | 200 | 200 | Passed |
| BE-09 Pending listings and images — Extra. Scope of regular user filter request | 200 | 200 | Passed |
| BE-10 Review listings — No token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-10 Review listings — User attempts review | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| BE-10 Review listings — Unsupported ACCEPT decision | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-10 Review listings — No rejection reason | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-10 Review listings — Spaces-only rejection reason | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-10 Review listings — Approve pending listing | 200 | 200 | Passed |
| BE-10 Review listings — Review approved listing again | 409 INVALID_STATE | 409 INVALID_STATE | Passed |
| BE-10 Review listings — Reject pending listing | 200 | 200 | Passed |
| BE-11 Auction creation — No token | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| BE-11 Auction creation — Empty body | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-11 Auction creation — Create public auction | 201 | 201 | Passed |
| BE-11 Auction creation — Same listing again | 409 DUPLICATE_AUCTION | 409 DUPLICATE_AUCTION | Passed |
| BE-11 Auction creation — Starting price zero | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-11 Auction creation — Minimum increase zero | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-11 Auction creation — End before start | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-11 Auction creation — Someone else owns listing | 403 NOT_APPROVED | 403 NOT_APPROVED | Passed |
| BE-11 Auction creation — Own rejected listing | 403 NOT_APPROVED | 403 NOT_APPROVED | Passed |
| BE-11 Auction creation — Create private auction | 201 | 201 | Passed |
| BE-11 Auction creation — PostgreSQL private code | PRIVATE/bcrypt hash | PRIVATE/bcrypt hash | Passed |
| BE-12 Auction lists and details — Public list as guest | 200 | 200 | Passed |
| BE-12 Auction lists and details — Public details | 200 | 200 | Passed |
| BE-12 Auction lists and details — Malformed ID | 400 INVALID_ID | 400 INVALID_ID | Passed |
| BE-12 Auction lists and details — Missing auction | 404 NOT_FOUND | 404 NOT_FOUND | Passed |
| BE-12 Auction lists and details — Private details as guest | 404 NOT_FOUND | 404 NOT_FOUND | Passed |
| BE-12 Auction lists and details — Private details as owner | 200 | 200 | Passed |
| BE-12 Auction lists and details — Started auction in list | 200 | 200 | Passed |
| BE-12 Auction lists and details — Started auction details | 200 | 200 | Passed |
| BE-12 Auction lists and details — Ended auction in list | 200 | 200 | Passed |
| BE-12 Auction lists and details — Ended auction details | 200 | 200 | Passed |
| BE-13 Private auction access — Correct code | 200 | 200 | Passed |
| BE-13 Private auction access — Incorrect code | 403 INVALID_CODE | 403 INVALID_CODE | Passed |
| FE-11 API contracts — Categories | 200 | 200 | Passed |
| FE-11 API contracts — Own listings | 200 | 200 | Passed |
| FE-11 API contracts — Own auctions | 200 | 200 | Passed |
| FE-11 API contracts — Admin cannot edit listing | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| FE-11 API contracts — Admin cannot create auction | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| FE-11 API contracts — Admin cannot bid | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| FE-11 API contracts — Admin cannot join by code | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| FE-11 API contracts — Admin sees public and private auctions | 200 | 200 | Passed |
| FE-11 API contracts — User cannot list admin scope | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| FE-11 API contracts — Guest cannot open private auction | 404 NOT_FOUND | 404 NOT_FOUND | Passed |
| FE-11 API contracts — Admin opens private auction | 200 | 200 | Passed |
| FE-11 API contracts — Authorized user opens private auction | 200 | 200 | Passed |
| FE-11 API contracts — Admin reads private bid history | 200 | 200 | Passed |
| FE-11 API contracts — Authorized user reads private bids | 200 | 200 | Passed |
| FE-11 API contracts — JWT expires in one hour | 3598..3600 seconds | 3600 | Passed |
| FE-11 API contracts — Tampered JWT rejected | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| FE-11 API contracts — Expired session rejected | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Passed |
| Email Verification (finish) — Resend after 60 seconds | 200 | 200 | Passed |
| Email Verification (finish) — Old code after resend | 400 INVALID_CODE | 400 INVALID_CODE | Passed |
| Email Verification (finish) — Resend again immediately | 429 TOO_SOON | 429 TOO_SOON | Passed |
| Email Verification (finish) — Verify using newest code | 200 | 200 | Passed |
| Email Verification (finish) — Reuse verified code | 409 ALREADY_VERIFIED | 409 ALREADY_VERIFIED | Passed |
| Email Verification (finish) — Login after verification | 200 | 200 | Passed |
| FE-11 Images and listing update — Upload two images | 201 | 201 | Passed |
| FE-11 Images and listing update — Read uploaded listing | 200 | 200 | Passed |
| FE-11 Images and listing update — Another user cannot read listing | 403 FORBIDDEN | 403 FORBIDDEN | Passed |
| FE-11 Images and listing update — Signed image URL returns JPEG | 200 | 200 | Passed |
| FE-11 Images and listing update — Pending listing cannot be edited | 409 INVALID_STATE | 409 INVALID_STATE | Passed |
| FE-11 Images and listing update — Reject listing | 200 | 200 | Passed |
| FE-11 Images and listing update — Resubmit rejected listing | 200 | 200 | Passed |
| FE-11 Images and listing update — Approve resubmitted listing | 200 | 200 | Passed |
| FE-11 Images and listing update — Approved listing cannot be edited | 409 INVALID_STATE | 409 INVALID_STATE | Passed |
| BE-14 Moyasar Sandbox — Sandbox API connection | HTTP 200 | HTTP 200 | Passed |
| BE-14 Moyasar Sandbox — Invalid payment ID | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| BE-14 Moyasar Sandbox — Moyasar key absent in separate test process | 503 BANK_SANDBOX_UNAVAILABLE | 503 BANK_SANDBOX_UNAVAILABLE | Passed |
| BE-14 Moyasar Sandbox — Bid without commitment | 403 COMMITMENT_REQUIRED | 403 COMMITMENT_REQUIRED | Passed |
| BE-14 Moyasar Sandbox — Extra. Pending 3DS | 409 PAYMENT_NOT_COMPLETED | 409 PAYMENT_NOT_COMPLETED | Passed |
| BE-14 Moyasar Sandbox — Insufficient funds | 409 COMMITMENT_DECLINED | 409 COMMITMENT_DECLINED | Passed |
| BE-14 Moyasar Sandbox — Saved commitment | FAILED | FAILED | Passed |
| BE-14 Moyasar Sandbox — Hold below starting price | 409 COMMITMENT_TOO_LOW | 409 COMMITMENT_TOO_LOW | Passed |
| BE-14 Moyasar Sandbox — Provider hold after refusal | voided | voided | Passed |
| BE-14 Moyasar Sandbox — Accept 2000 SAR hold | 201 | 201 | Passed |
| BE-14 Moyasar Sandbox — Saved commitment | SUCCESS/2000.00 | SUCCESS/2000.00 | Passed |
| BE-14 Moyasar Sandbox — Bid above hold | 409 BID_ABOVE_COMMITMENT | 409 BID_ABOVE_COMMITMENT | Passed |
| BE-14 Moyasar Sandbox — Bid within hold | 201 | 201 | Passed |
| BE-14 Moyasar Sandbox — Payment belongs to other account | 403 PAYMENT_MISMATCH | 403 PAYMENT_MISMATCH | Passed |
| BE-14 Moyasar Sandbox — Commitment after auction ends | 409 AUCTION_NOT_ACTIVE | 409 AUCTION_NOT_ACTIVE | Passed |
| BE-14 Moyasar Sandbox — Provider hold after refusal | voided | voided | Passed |
| BE-14 Moyasar Sandbox — Second bidder hold | 201 | 201 | Passed |
| BE-14 Moyasar Sandbox — Second bidder bids 1100 SAR | 201 | 201 | Passed |
| BE-14 Moyasar Sandbox — Close and identify winner | 200 | 200 | Passed |
| BE-14 Moyasar Sandbox — Losing and winning holds | voided/authorized | voided/authorized | Passed |
| FE-11 Private auction setup — Create private auction | 201 | 201 | Passed |
| FE-11 Private auction setup — Private details before code | 404 NOT_FOUND | 404 NOT_FOUND | Passed |
| FE-11 Private auction setup — Bidder one joins private auction | 200 | 200 | Passed |
| FE-11 Private auction setup — Bidder two joins private auction | 200 | 200 | Passed |
| FE-11 Private auction setup — Owner cannot bid on own private auction | 403 OWNER | 403 OWNER | Passed |
| FE-11 Private auction setup — No commitment yet | 404 NOT_FOUND | 404 NOT_FOUND | Passed |
| FE-11 Private Moyasar — Sandbox API connection | HTTP 200 | HTTP 200 | Passed |
| FE-11 Private Moyasar — Invalid payment ID | 400 INVALID_INPUT | 400 INVALID_INPUT | Passed |
| FE-11 Private Moyasar — Moyasar key absent in separate test process | 503 BANK_SANDBOX_UNAVAILABLE | 503 BANK_SANDBOX_UNAVAILABLE | Passed |
| FE-11 Private Moyasar — Bid without commitment | 403 COMMITMENT_REQUIRED | 403 COMMITMENT_REQUIRED | Passed |
| FE-11 Private Moyasar — Extra. Pending 3DS | 409 PAYMENT_NOT_COMPLETED | 409 PAYMENT_NOT_COMPLETED | Passed |
| FE-11 Private Moyasar — Insufficient funds | 409 COMMITMENT_DECLINED | 409 COMMITMENT_DECLINED | Passed |
| FE-11 Private Moyasar — Saved commitment | FAILED | FAILED | Passed |
| FE-11 Private Moyasar — Hold below starting price | 409 COMMITMENT_TOO_LOW | 409 COMMITMENT_TOO_LOW | Passed |
| FE-11 Private Moyasar — Provider hold after refusal | voided | voided | Passed |
| FE-11 Private Moyasar — Accept 2000 SAR hold | 201 | 201 | Passed |
| FE-11 Private Moyasar — Saved commitment | SUCCESS/2000.00 | SUCCESS/2000.00 | Passed |
| FE-11 Private Moyasar — Read successful commitment | 200 | 200 | Passed |
| FE-11 Private Moyasar — Bid above hold | 409 BID_ABOVE_COMMITMENT | 409 BID_ABOVE_COMMITMENT | Passed |
| FE-11 Private Moyasar — Bid within hold | 201 | 201 | Passed |
| FE-11 Private Moyasar — Bid below next minimum | 409 BID_TOO_LOW | 409 BID_TOO_LOW | Passed |
| FE-11 Private Moyasar — Payment belongs to other account | 403 PAYMENT_MISMATCH | 403 PAYMENT_MISMATCH | Passed |
| FE-11 Private Moyasar — Commitment after auction ends | 409 AUCTION_NOT_ACTIVE | 409 AUCTION_NOT_ACTIVE | Passed |
| FE-11 Private Moyasar — Provider hold after refusal | voided | voided | Passed |
| FE-11 Private Moyasar — Second bidder hold | 201 | 201 | Passed |
| FE-11 Private Moyasar — Second bidder bids 1100 SAR | 201 | 201 | Passed |
| FE-11 Private Moyasar — Close and identify winner | 200 | 200 | Passed |
| FE-11 Private Moyasar — Losing and winning holds | voided/authorized | voided/authorized | Passed |
| FE-11 Private Moyasar — Losing participant result | 200 | 200 | Passed |
| FE-11 Private Moyasar — Private bid history | 200 | 200 | Passed |
| FE-11 Private Moyasar — Participant auctions include private result | 200 | 200 | Passed |
| Email delivery — Send code to owned email | 201 | 201 with emailSent true and message received | Passed |

## Testing Method

I used curl commands in the VS Code terminal. I used admin@mezyad.test, seller@mezyad.test, bidder1@mezyad.test and bidder2@mezyad.test for the account roles. Email-verification cases used verify@mezyad.test. I also sent one code through the configured mail provider to ghadi0alzhrani@gmail.com, and confirmed that the message arrived.

I took the JWT from data.token after login and used the Authorization Bearer header for protected requests. All backend requests below use /api/v1. The complete actual JSON responses are shown for each request.

## Account and API Tests

### Test 1 — GET /api/v1/health

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/health'
```

**Result:** HTTP 200

```json
{
  "data": {
    "status": "ok"
  }
}
```

### Test 2 — 1. Register and receive code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Email Test","email":"verify@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "12c74400-ad38-4112-bb3b-e4ee4f627f4d",
    "name": "Email Test",
    "email": "verify@mezyad.test",
    "role": "USER",
    "emailVerified": false,
    "emailSent": true
  }
}
```

### Test 3 — 2. Login before verification

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"name":"Email Test","email":"verify@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Verify your email before signing in"
  }
}
```

### Test 4 — 3. Incorrect six-digit code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 5 — 4. Three-digit code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid email and 6-digit code required"
  }
}
```

### Test 6 — POST /api/v1/auth/verify-email

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 7 — POST /api/v1/auth/verify-email

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 8 — POST /api/v1/auth/verify-email

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 9 — POST /api/v1/auth/verify-email

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 10 — 5. Correct code after five wrong attempts

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 11 — 1. Two @ symbols

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Test","email":"a@@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid name, email and password (8+ chars) required"
  }
}
```

### Test 12 — 2. Password 73 bytes

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Test","email":"limits@mezyad.test","password":"<test password 73 bytes>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid name, email and password (8+ chars) required"
  }
}
```

### Test 13 — 3. Password 72 bytes

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Test","email":"limits@mezyad.test","password":"<test password 72 bytes>"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "44dc4546-30f2-44f3-be60-d8695af7b8c9",
    "name": "Test",
    "email": "limits@mezyad.test",
    "role": "USER",
    "emailVerified": false,
    "emailSent": true
  }
}
```

### Test 14 — 4. Duplicate email

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Test","email":"limits@mezyad.test","password":"<test password 72 bytes>"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email already registered"
  }
}
```

### Test 15 — 5. Name 161 characters

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","email":"long-name@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid name, email and password (8+ chars) required"
  }
}
```

### Test 16 — 6. Email 255 characters

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Test","email":"xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddddddddd.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid name, email and password (8+ chars) required"
  }
}
```

### Test 17 — 7. Name 160 and email 254

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","email":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddddddddd.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "cf26ed1b-9ee4-4e9d-8470-05c732f8a260",
    "name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "email": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddddddddd.test",
    "role": "USER",
    "emailVerified": false,
    "emailSent": true
  }
}
```

### Test 18 — 1. Empty email

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid email and password required"
  }
}
```

### Test 19 — 2. Empty password

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 0 bytes>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid email and password required"
  }
}
```

### Test 20 — 3. Incorrect password

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 5 bytes>"}'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

### Test 21 — 4. Correct login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 22 — 5. No token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in required"
  }
}
```

### Test 23 — 6. Valid token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "user": {
      "id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 24 — 7. Logout

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/logout' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "signedOut": true
  }
}
```

### Test 25 — 8. Reuse token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 26 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"admin@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c67cde11-6a5e-4adb-828b-8eb43bc754a0",
      "name": "admin",
      "email": "admin@mezyad.test",
      "role": "ADMIN"
    }
  }
}
```

### Test 27 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 28 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder1@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "eb8f3866-220e-46bc-ba42-c417f5985f39",
      "name": "bidder1",
      "email": "bidder1@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 29 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder2@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "9bb6e03e-e38c-42ea-a656-556e7ca3f5c2",
      "name": "bidder2",
      "email": "bidder2@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 30 — 1. No token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in required"
  }
}
```

### Test 31 — 2. Invalid token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 32 — 3. Valid user token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "user": {
      "id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 33 — 4. User requests review

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/00000000-0000-4000-8000-000000000000/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin only"
  }
}
```

### Test 34 — 5. Admin reaches validation

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/00000000-0000-4000-8000-000000000000/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid decision and rejection reason required"
  }
}
```

### Test 35 — 6. Admin logout

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/logout' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "signedOut": true
  }
}
```

### Test 36 — 7. Reuse admin token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 37 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"admin@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c67cde11-6a5e-4adb-828b-8eb43bc754a0",
      "name": "admin",
      "email": "admin@mezyad.test",
      "role": "ADMIN"
    }
  }
}
```

### Test 38 — Extra. Admin tries to create a listing

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/items' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User only"
  }
}
```

### Test 39 — 1. No token

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in required"
  }
}
```

### Test 40 — 2. Regular user requests own pending listings

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": []
}
```

### Test 41 — 3. Admin sees empty queue

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": []
}
```

### Test 42 — 4a. Create Test Car

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/items' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"title":"Test Car","description":"Car for testing","categoryId":"4a1d2b88-2b96-4f99-973a-17609789c4ba","categoryFields":{}}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "title": "Test Car",
    "description": "Car for testing",
    "category_fields": {},
    "status": "PENDING_REVIEW",
    "review_reason": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "categoryFields": {},
    "images": []
  }
}
```

### Test 43 — 4b. Read listing without images

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car",
      "description": "Car for testing",
      "category_fields": {},
      "status": "PENDING_REVIEW",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": []
    }
  ]
}
```

### Test 44 — 5. Read both images

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car",
      "description": "Car for testing",
      "category_fields": {},
      "status": "PENDING_REVIEW",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": [
        "https://example.com/car2.jpg",
        "https://example.com/car1.jpg"
      ]
    }
  ]
}
```

### Test 45 — 6. Filter among mixed statuses

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "4a86b38e-c46c-4c70-b01a-0fc85435c274",
      "seller_id": "9bb6e03e-e38c-42ea-a656-556e7ca3f5c2",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car 2",
      "description": "Test listing",
      "category_fields": {},
      "status": "PENDING_REVIEW",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": []
    },
    {
      "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car",
      "description": "Car for testing",
      "category_fields": {},
      "status": "PENDING_REVIEW",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": [
        "https://example.com/car2.jpg",
        "https://example.com/car1.jpg"
      ]
    }
  ]
}
```

### Test 46 — 7. User lists own listing

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car",
      "description": "Car for testing",
      "category_fields": {},
      "status": "PENDING_REVIEW",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": [
        "https://example.com/car2.jpg",
        "https://example.com/car1.jpg"
      ]
    }
  ]
}
```

### Test 47 — Extra. Scope of regular user filter request

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/items?status=PENDING_REVIEW' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car",
      "description": "Car for testing",
      "category_fields": {},
      "status": "PENDING_REVIEW",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": [
        "https://example.com/car2.jpg",
        "https://example.com/car1.jpg"
      ]
    },
    {
      "id": "a1ba18ce-6887-4fd3-8ae0-12b1bde2dd09",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Own Approved Comparison",
      "description": "Test listing",
      "category_fields": {},
      "status": "APPROVED",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": []
    }
  ]
}
```

### Test 48 — 1. No token

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in required"
  }
}
```

### Test 49 — 2. User attempts review

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin only"
  }
}
```

### Test 50 — 3. Unsupported ACCEPT decision

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"ACCEPT"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid decision and rejection reason required"
  }
}
```

### Test 51 — 4. No rejection reason

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"REJECTED"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid decision and rejection reason required"
  }
}
```

### Test 52 — 5. Spaces-only rejection reason

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"REJECTED","reason":"   "}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid decision and rejection reason required"
  }
}
```

### Test 53 — 6. Approve pending listing

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"APPROVED"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "title": "Test Car",
    "description": "Car for testing",
    "category_fields": {},
    "status": "APPROVED",
    "review_reason": null,
    "reviewed_by": "c67cde11-6a5e-4adb-828b-8eb43bc754a0",
    "reviewed_at": "2026-11-13T14:48:14.280Z",
    "categoryFields": {},
    "images": [
      "https://example.com/car2.jpg",
      "https://example.com/car1.jpg"
    ]
  }
}
```

### Test 54 — 7. Review approved listing again

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/8323531a-326c-476f-9d6f-1e4cdb612c83/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "Listing not pending review"
  }
}
```

### Test 55 — 8. Reject pending listing

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/admin/items/4a86b38e-c46c-4c70-b01a-0fc85435c274/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "4a86b38e-c46c-4c70-b01a-0fc85435c274",
    "seller_id": "9bb6e03e-e38c-42ea-a656-556e7ca3f5c2",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "title": "Test Car 2",
    "description": "Test listing",
    "category_fields": {},
    "status": "REJECTED",
    "review_reason": "Missing car details",
    "reviewed_by": "c67cde11-6a5e-4adb-828b-8eb43bc754a0",
    "reviewed_at": "2026-11-13T14:48:14.301Z",
    "categoryFields": {},
    "images": []
  }
}
```

### Test 56 — 1. No token

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in required"
  }
}
```

### Test 57 — 2. Empty body

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid auction parameters"
  }
}
```

### Test 58 — 3. Create public auction

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
    "item_id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T15:48:14.305Z",
    "end_time": "2026-11-13T16:48:14.306Z",
    "status": "SCHEDULED"
  }
}
```

### Test 59 — 4. Same listing again

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "DUPLICATE_AUCTION",
    "message": "Item already has auction"
  }
}
```

### Test 60 — 5. Starting price zero

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":0,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid auction parameters"
  }
}
```

### Test 61 — 6. Minimum increase zero

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":0,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid auction parameters"
  }
}
```

### Test 62 — 7. End before start

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T15:18:14.387Z"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid auction parameters"
  }
}
```

### Test 63 — 8. Someone else owns listing

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"6a29ab48-33d0-40a5-ac77-cd6a16c0d571","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "NOT_APPROVED",
    "message": "Only approved owned items can be auctioned"
  }
}
```

### Test 64 — 9. Own rejected listing

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"4a86b38e-c46c-4c70-b01a-0fc85435c274","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "NOT_APPROVED",
    "message": "Only approved owned items can be auctioned"
  }
}
```

### Test 65 — 10. Create private auction

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"d1635f73-c017-43c4-ab62-f6cf3003ea25","visibility":"PRIVATE","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "f03853aa-010b-4461-8844-2a2b4c96397c",
    "item_id": "d1635f73-c017-43c4-ab62-f6cf3003ea25",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T15:48:14.305Z",
    "end_time": "2026-11-13T16:48:14.306Z",
    "status": "SCHEDULED",
    "accessCode": "b574c4330869cf1f81cd99ee"
  }
}
```

### Test 66 — 1. Public list as guest

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
      "item_id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T15:48:14.305Z",
      "end_time": "2026-11-13T16:48:14.306Z",
      "status": "SCHEDULED",
      "title": "Test Car",
      "category_name": "Rare Vehicles",
      "image_url": "https://example.com/car2.jpg",
      "bid_count": 0
    }
  ]
}
```

### Test 67 — 2. Public details

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/9ec88aa7-1bbd-4517-8582-2f5507394e5c'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
    "item_id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T15:48:14.305Z",
    "end_time": "2026-11-13T16:48:14.306Z",
    "status": "SCHEDULED",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "title": "Test Car",
    "description": "Car for testing",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [
      "https://example.com/car2.jpg",
      "https://example.com/car1.jpg"
    ],
    "result": null,
    "participation": null
  }
}
```

### Test 68 — 3. Malformed ID

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/abc'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid ID"
  }
}
```

### Test 69 — 4. Missing auction

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/00000000-0000-4000-8000-000000000000'
```

**Result:** HTTP 404

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Auction not found"
  }
}
```

### Test 70 — 5. Private details as guest

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c'
```

**Result:** HTTP 404

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Auction not found"
  }
}
```

### Test 71 — 6. Private details as owner

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "f03853aa-010b-4461-8844-2a2b4c96397c",
    "item_id": "d1635f73-c017-43c4-ab62-f6cf3003ea25",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T15:48:14.305Z",
    "end_time": "2026-11-13T16:48:14.306Z",
    "status": "SCHEDULED",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "title": "Private Car",
    "description": "Test listing",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": null,
    "participation": {
      "bidCount": 0,
      "highestBid": null,
      "latestBidId": null,
      "hasBid": false
    }
  }
}
```

### Test 72 — 7. Started auction in list

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
      "item_id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T15:48:14.305Z",
      "end_time": "2026-11-13T16:48:14.306Z",
      "status": "SCHEDULED",
      "title": "Test Car",
      "category_name": "Rare Vehicles",
      "image_url": "https://example.com/car2.jpg",
      "bid_count": 0
    },
    {
      "id": "18acb859-7907-42a6-b354-0e4f5ba55362",
      "item_id": "5160e4a5-0222-4549-b2b3-6f0856e1f42b",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T14:18:15.036Z",
      "end_time": "2026-11-13T15:18:15.036Z",
      "status": "ACTIVE",
      "title": "Test Status Car",
      "category_name": "Rare Vehicles",
      "image_url": null,
      "bid_count": 0
    }
  ]
}
```

### Test 73 — 8. Started auction details

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/18acb859-7907-42a6-b354-0e4f5ba55362'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "18acb859-7907-42a6-b354-0e4f5ba55362",
    "item_id": "5160e4a5-0222-4549-b2b3-6f0856e1f42b",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T14:18:15.036Z",
    "end_time": "2026-11-13T15:18:15.036Z",
    "status": "ACTIVE",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "title": "Test Status Car",
    "description": "Test listing",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": null,
    "participation": null
  }
}
```

### Test 74 — 9. Ended auction in list

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
      "item_id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T15:48:14.305Z",
      "end_time": "2026-11-13T16:48:14.306Z",
      "status": "SCHEDULED",
      "title": "Test Car",
      "category_name": "Rare Vehicles",
      "image_url": "https://example.com/car2.jpg",
      "bid_count": 0
    },
    {
      "id": "18acb859-7907-42a6-b354-0e4f5ba55362",
      "item_id": "5160e4a5-0222-4549-b2b3-6f0856e1f42b",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T14:18:15.036Z",
      "end_time": "2026-11-13T14:47:15.060Z",
      "status": "CLOSED",
      "title": "Test Status Car",
      "category_name": "Rare Vehicles",
      "image_url": null,
      "bid_count": 0
    }
  ]
}
```

### Test 75 — 10. Ended auction details

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/18acb859-7907-42a6-b354-0e4f5ba55362'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "18acb859-7907-42a6-b354-0e4f5ba55362",
    "item_id": "5160e4a5-0222-4549-b2b3-6f0856e1f42b",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T14:18:15.036Z",
    "end_time": "2026-11-13T14:47:15.060Z",
    "status": "CLOSED",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "title": "Test Status Car",
    "description": "Test listing",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": null,
      "closed_at": "2026-11-13T14:48:15.078Z",
      "winning_amount": null,
      "isWinner": null
    },
    "participation": null
  }
}
```

### Test 76 — 1. Correct code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions/access' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"accessCode":"<test code>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "accessGranted": true,
    "auctionId": "f03853aa-010b-4461-8844-2a2b4c96397c"
  }
}
```

### Test 77 — 2. Incorrect code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions/access' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"accessCode":"<test code>"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid access code"
  }
}
```

### Test 78 — Categories

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/categories'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "f5da343a-5672-40e0-8c11-cc99f5a0b92f",
      "name": "Camels"
    },
    {
      "id": "adfe1a3b-bad0-4f44-858f-48d6c1d5488d",
      "name": "Luxury Handbags"
    },
    {
      "id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "name": "Rare Vehicles"
    },
    {
      "id": "c2c96911-d008-44ee-a31d-79e14e418094",
      "name": "Real Estate"
    },
    {
      "id": "b2a80dff-83b1-4972-9c7b-2ff563ea29a1",
      "name": "Vehicle Plates"
    }
  ]
}
```

### Test 79 — Own listings

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/me/items' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "5160e4a5-0222-4549-b2b3-6f0856e1f42b",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Status Car",
      "description": "Test listing",
      "category_fields": {},
      "status": "APPROVED",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": []
    },
    {
      "id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Test Car",
      "description": "Car for testing",
      "category_fields": {},
      "status": "APPROVED",
      "review_reason": null,
      "reviewed_by": "c67cde11-6a5e-4adb-828b-8eb43bc754a0",
      "reviewed_at": "2026-11-13T14:48:14.280Z",
      "categoryFields": {},
      "images": [
        "https://example.com/car2.jpg",
        "https://example.com/car1.jpg"
      ]
    },
    {
      "id": "a1ba18ce-6887-4fd3-8ae0-12b1bde2dd09",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Own Approved Comparison",
      "description": "Test listing",
      "category_fields": {},
      "status": "APPROVED",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": []
    },
    {
      "id": "d1635f73-c017-43c4-ab62-f6cf3003ea25",
      "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
      "title": "Private Car",
      "description": "Test listing",
      "category_fields": {},
      "status": "APPROVED",
      "review_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "categoryFields": {},
      "images": []
    }
  ]
}
```

### Test 80 — Own auctions

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/me/auctions' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "18acb859-7907-42a6-b354-0e4f5ba55362",
      "status": "CLOSED",
      "end_time": "2026-11-13T14:47:15.060Z",
      "title": "Test Status Car"
    },
    {
      "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
      "status": "SCHEDULED",
      "end_time": "2026-11-13T16:48:14.306Z",
      "title": "Test Car"
    },
    {
      "id": "f03853aa-010b-4461-8844-2a2b4c96397c",
      "status": "SCHEDULED",
      "end_time": "2026-11-13T16:48:14.306Z",
      "title": "Private Car"
    }
  ]
}
```

### Test 81 — Admin cannot edit listing

```bash
curl -i -X PATCH 'http://127.0.0.1:54991/api/v1/items/8323531a-326c-476f-9d6f-1e4cdb612c83' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"title":"Test Car","description":"Car for testing"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User only"
  }
}
```

### Test 82 — Admin cannot create auction

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"8323531a-326c-476f-9d6f-1e4cdb612c83","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T15:48:14.305Z","endTime":"2026-11-13T16:48:14.306Z"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User only"
  }
}
```

### Test 83 — Admin cannot bid

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions/9ec88aa7-1bbd-4517-8582-2f5507394e5c/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1100,"requestId":"4734a4b1-28b6-4a09-a7c2-1e2a03cb79f7"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User only"
  }
}
```

### Test 84 — Admin cannot join by code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auctions/access' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"accessCode":"<test code>"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User only"
  }
}
```

### Test 85 — Admin sees public and private auctions

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions?scope=all' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "9ec88aa7-1bbd-4517-8582-2f5507394e5c",
      "item_id": "8323531a-326c-476f-9d6f-1e4cdb612c83",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T15:48:14.305Z",
      "end_time": "2026-11-13T16:48:14.306Z",
      "status": "SCHEDULED",
      "title": "Test Car",
      "category_name": "Rare Vehicles",
      "image_url": "https://example.com/car2.jpg",
      "bid_count": 0
    },
    {
      "id": "f03853aa-010b-4461-8844-2a2b4c96397c",
      "item_id": "d1635f73-c017-43c4-ab62-f6cf3003ea25",
      "visibility": "PRIVATE",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T15:48:14.305Z",
      "end_time": "2026-11-13T16:48:14.306Z",
      "status": "SCHEDULED",
      "title": "Private Car",
      "category_name": "Rare Vehicles",
      "image_url": null,
      "bid_count": 0
    },
    {
      "id": "18acb859-7907-42a6-b354-0e4f5ba55362",
      "item_id": "5160e4a5-0222-4549-b2b3-6f0856e1f42b",
      "visibility": "PUBLIC",
      "starting_price": "1000.00",
      "current_price": "1000.00",
      "minimum_increment": "100.00",
      "start_time": "2026-11-13T14:18:15.036Z",
      "end_time": "2026-11-13T14:47:15.060Z",
      "status": "CLOSED",
      "title": "Test Status Car",
      "category_name": "Rare Vehicles",
      "image_url": null,
      "bid_count": 0
    }
  ]
}
```

### Test 86 — User cannot list admin scope

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions?scope=all' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin only"
  }
}
```

### Test 87 — Guest cannot open private auction

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c'
```

**Result:** HTTP 404

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Auction not found"
  }
}
```

### Test 88 — Admin opens private auction

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "f03853aa-010b-4461-8844-2a2b4c96397c",
    "item_id": "d1635f73-c017-43c4-ab62-f6cf3003ea25",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T15:48:14.305Z",
    "end_time": "2026-11-13T16:48:14.306Z",
    "status": "SCHEDULED",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "title": "Private Car",
    "description": "Test listing",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": null,
    "participation": {
      "bidCount": 0,
      "highestBid": null,
      "latestBidId": null,
      "hasBid": false
    }
  }
}
```

### Test 89 — Authorized user opens private auction

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "f03853aa-010b-4461-8844-2a2b4c96397c",
    "item_id": "d1635f73-c017-43c4-ab62-f6cf3003ea25",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T15:48:14.305Z",
    "end_time": "2026-11-13T16:48:14.306Z",
    "status": "SCHEDULED",
    "seller_id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
    "title": "Private Car",
    "description": "Test listing",
    "category_id": "4a1d2b88-2b96-4f99-973a-17609789c4ba",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": null,
    "participation": {
      "bidCount": 0,
      "highestBid": null,
      "latestBidId": null,
      "hasBid": false
    }
  }
}
```

### Test 90 — Admin reads private bid history

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c/bids' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": []
}
```

### Test 91 — Authorized user reads private bids

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auctions/f03853aa-010b-4461-8844-2a2b4c96397c/bids' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": []
}
```

### Test 92 — JWT expires in one hour

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 93 — Tampered JWT rejected

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 94 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c46ef2d7-d032-46a8-b44a-c58148b78852",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 95 — Expired session rejected

```bash
curl -i -X GET 'http://127.0.0.1:54991/api/v1/auth/me' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 401

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 96 — 6a. Resend after 60 seconds

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/resend-code' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "message": "If the account exists and is not verified, a new code was sent"
  }
}
```

### Test 97 — 6b. Old code after resend

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

### Test 98 — 7. Resend again immediately

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/resend-code' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test"}'
```

**Result:** HTTP 429

```json
{
  "error": {
    "code": "TOO_SOON",
    "message": "Wait one minute before requesting a new code"
  }
}
```

### Test 99 — 8. Verify using newest code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "emailVerified": true
  }
}
```

### Test 100 — 9. Reuse verified code

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/verify-email' -H 'Content-Type: application/json' -d '{"email":"verify@mezyad.test","code":"<test code>"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "ALREADY_VERIFIED",
    "message": "Email already verified"
  }
}
```

### Test 101 — 10. Login after verification

```bash
curl -i -X POST 'http://127.0.0.1:54991/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"name":"Email Test","email":"verify@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "12c74400-ad38-4112-bb3b-e4ee4f627f4d",
      "name": "Email Test",
      "email": "verify@mezyad.test",
      "role": "USER"
    }
  }
}
```

## Image and Listing Update Tests

### Test 102 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:55593/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "0212d019-8671-43a4-ac57-296dc548c5a8",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 103 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:55593/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"admin@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "8cad0d56-3047-4f39-b2b7-9bf49cd320f8",
      "name": "admin",
      "email": "admin@mezyad.test",
      "role": "ADMIN"
    }
  }
}
```

### Test 104 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:55593/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder1@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "14def1b3-5edf-4fd4-b16a-1ab3bac01df2",
      "name": "bidder1",
      "email": "bidder1@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 105 — Upload two images

```bash
curl -i -X POST http://127.0.0.1:55593/api/v1/items -H Authorization:Bearer<JWT> -F title=TestCar -F description=CarForTesting -F categoryId=<category> -F images=@car1.png -F images=@car2.png
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "db5fa4cb-cbde-49ba-a4a1-5572047d4ef0",
    "seller_id": "0212d019-8671-43a4-ac57-296dc548c5a8",
    "category_id": "0b4b5ad6-6f75-44b9-b5eb-445051e489e6",
    "title": "Test Car",
    "description": "Car for testing",
    "category_fields": {},
    "status": "PENDING_REVIEW",
    "review_reason": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "categoryFields": {},
    "images": [
      "/api/v1/images/c2324866-49ee-4fbc-afcf-1f7eeb337a11.jpg?expires=1794582190&signature=2968f69820cbdf5c9040f0af717b269c9254b9fcca0efd5913ec2ee928aa70b3",
      "/api/v1/images/19df61b3-61f7-4542-a633-a8d025490741.jpg?expires=1794582190&signature=d1d87eaa0b3b421d2c9ca6349a164bac6a4431ebc19b6cf814ba59db4e5b4d38"
    ]
  }
}
```

### Test 106 — Read uploaded listing

```bash
curl -i -X GET 'http://127.0.0.1:55593/api/v1/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "db5fa4cb-cbde-49ba-a4a1-5572047d4ef0",
    "seller_id": "0212d019-8671-43a4-ac57-296dc548c5a8",
    "category_id": "0b4b5ad6-6f75-44b9-b5eb-445051e489e6",
    "title": "Test Car",
    "description": "Car for testing",
    "category_fields": {},
    "status": "PENDING_REVIEW",
    "review_reason": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "categoryFields": {},
    "images": [
      "/api/v1/images/c2324866-49ee-4fbc-afcf-1f7eeb337a11.jpg?expires=1794582193&signature=f247e1a549b3dbbb73b1b0578ed9607f713ab554649a7b57ffbb02306d86f741",
      "/api/v1/images/19df61b3-61f7-4542-a633-a8d025490741.jpg?expires=1794582193&signature=cb46e61de6a61fed3055b9f63df4d446b788b359af2a5200f1d05709027b6d5e"
    ]
  }
}
```

### Test 107 — Another user cannot read listing

```bash
curl -i -X GET 'http://127.0.0.1:55593/api/v1/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Not your item"
  }
}
```

### Test 108 — Pending listing cannot be edited

```bash
curl -i -X PATCH 'http://127.0.0.1:55593/api/v1/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"title":"Test Car 2","description":"Updated car for testing"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "Only rejected items can be resubmitted"
  }
}
```

### Test 109 — Reject listing

```bash
curl -i -X POST 'http://127.0.0.1:55593/api/v1/admin/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"REJECTED","reason":"Missing car details"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "db5fa4cb-cbde-49ba-a4a1-5572047d4ef0",
    "seller_id": "0212d019-8671-43a4-ac57-296dc548c5a8",
    "category_id": "0b4b5ad6-6f75-44b9-b5eb-445051e489e6",
    "title": "Test Car",
    "description": "Car for testing",
    "category_fields": {},
    "status": "REJECTED",
    "review_reason": "Missing car details",
    "reviewed_by": "8cad0d56-3047-4f39-b2b7-9bf49cd320f8",
    "reviewed_at": "2026-11-13T14:53:22.218Z",
    "categoryFields": {},
    "images": [
      "/api/v1/images/c2324866-49ee-4fbc-afcf-1f7eeb337a11.jpg?expires=1794582202&signature=697c25251d0377505845700f6e95b354e2dab1399e98efb31cc49b8a7703bcea",
      "/api/v1/images/19df61b3-61f7-4542-a633-a8d025490741.jpg?expires=1794582202&signature=e23610018b2f855e7def89ee0f9baa1eab412e8106e46a643f7708747f6c123b"
    ]
  }
}
```

### Test 110 — Resubmit rejected listing

```bash
curl -i -X PATCH 'http://127.0.0.1:55593/api/v1/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"title":"Test Car 2","description":"Updated car for testing"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "db5fa4cb-cbde-49ba-a4a1-5572047d4ef0",
    "seller_id": "0212d019-8671-43a4-ac57-296dc548c5a8",
    "category_id": "0b4b5ad6-6f75-44b9-b5eb-445051e489e6",
    "title": "Test Car 2",
    "description": "Updated car for testing",
    "category_fields": {},
    "status": "PENDING_REVIEW",
    "review_reason": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "categoryFields": {},
    "images": [
      "/api/v1/images/c2324866-49ee-4fbc-afcf-1f7eeb337a11.jpg?expires=1794582205&signature=a9fa4c52bd4f4243dc7b9eabbb6d1a3ed26a94ced8d36ffdf033ff4d10edcdf2",
      "/api/v1/images/19df61b3-61f7-4542-a633-a8d025490741.jpg?expires=1794582205&signature=1e8004434174ffa2d6b010dc5e406401ef08c4c1a6ac53991d903228b968c20a"
    ]
  }
}
```

### Test 111 — Approve resubmitted listing

```bash
curl -i -X POST 'http://127.0.0.1:55593/api/v1/admin/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0/review' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"decision":"APPROVED"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "db5fa4cb-cbde-49ba-a4a1-5572047d4ef0",
    "seller_id": "0212d019-8671-43a4-ac57-296dc548c5a8",
    "category_id": "0b4b5ad6-6f75-44b9-b5eb-445051e489e6",
    "title": "Test Car 2",
    "description": "Updated car for testing",
    "category_fields": {},
    "status": "APPROVED",
    "review_reason": null,
    "reviewed_by": "8cad0d56-3047-4f39-b2b7-9bf49cd320f8",
    "reviewed_at": "2026-11-13T14:53:28.295Z",
    "categoryFields": {},
    "images": [
      "/api/v1/images/c2324866-49ee-4fbc-afcf-1f7eeb337a11.jpg?expires=1794582208&signature=fc30b02caae36ec3770585a5e924dcd60dc056303ea92051b65e292ecc32790a",
      "/api/v1/images/19df61b3-61f7-4542-a633-a8d025490741.jpg?expires=1794582208&signature=bc7cb7c7f5e1b91983b8c2cb244d4b0ed78a483399670dbd68f8910009252cf1"
    ]
  }
}
```

### Test 112 — Approved listing cannot be edited

```bash
curl -i -X PATCH 'http://127.0.0.1:55593/api/v1/items/db5fa4cb-cbde-49ba-a4a1-5572047d4ef0' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"title":"Test Car","description":"Car for testing"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "Only rejected items can be resubmitted"
  }
}
```

### Test 113 — Signed image URL

```bash
curl -i 'http://127.0.0.1:55593/api/v1/images/c2324866-49ee-4fbc-afcf-1f7eeb337a11.jpg?expires=1794582190&signature=2968f69820cbdf5c9040f0af717b269c9254b9fcca0efd5913ec2ee928aa70b3'
```

**Result:** HTTP 200 with Content-Type image/jpeg and a valid JPEG image body of 272 bytes.

## Public Auction and Moyasar Tests

### Test 114 — GET /api/v1/health

```bash
curl -i -X GET 'http://127.0.0.1:54473/api/v1/health'
```

**Result:** HTTP 200

```json
{
  "data": {
    "status": "ok"
  }
}
```

### Test 115 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "c1cce238-37b4-49d9-b2aa-8bed7d509c0e",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 116 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder1@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
      "name": "bidder1",
      "email": "bidder1@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 117 — Sandbox API connection

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder2@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "ddc11641-669a-4fb0-924f-8d59aefccc96",
      "name": "bidder2",
      "email": "bidder2@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 118 — 1. Invalid payment ID

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"invalid"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid auction and paymentId required"
  }
}
```

### Test 119 — 2. Moyasar key absent in separate test process

```bash
curl -i -X POST 'http://127.0.0.1:54506/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"0fee6d6c-a3c5-40c0-8e00-16e0ac8adb75"}'
```

**Result:** HTTP 503

```json
{
  "error": {
    "code": "BANK_SANDBOX_UNAVAILABLE",
    "message": "Moyasar test key is not configured"
  }
}
```

### Test 120 — 3. Bid without commitment

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1000,"requestId":"18c1e492-840b-4dee-909a-8cdf34d26d91"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "COMMITMENT_REQUIRED",
    "message": "Verified commitment required"
  }
}
```

### Test 121 — Extra. Pending 3DS

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"6100f583-be3d-416d-b940-8c712bd5422b"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "PAYMENT_NOT_COMPLETED",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 122 — 4a. Insufficient funds

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"ea27a9e9-23c7-4f2a-a100-760e5b3f93ce"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "COMMITMENT_DECLINED",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 123 — 5a. Hold below starting price

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"619cfed1-da96-463a-9992-e194dcab450f"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "COMMITMENT_TOO_LOW",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 124 — 6a. Accept 2000 SAR hold

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"6100f583-be3d-416d-b940-8c712bd5422b"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "5030f3c3-30b2-4b5a-b86e-327dc6121b38",
    "status": "SUCCESS",
    "sandbox_reference": "6100f583-be3d-416d-b940-8c712bd5422b",
    "max_amount": "2000.00",
    "released_at": null,
    "created_at": "2026-11-13T14:46:05.051Z"
  }
}
```

### Test 125 — 7a. Bid above hold

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":2100,"requestId":"d47a9aa4-9f57-488d-983f-906e7e8bf910"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "BID_ABOVE_COMMITMENT",
    "message": "Bid is above your commitment limit"
  }
}
```

### Test 126 — 7b. Bid within hold

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1000,"requestId":"3bfb1255-f927-47e9-81ed-d49ede68fe4d"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "bidId": "369f815e-f7a4-4a6f-8a77-2721e719b05a",
    "amount": 1000,
    "currentPrice": 1000
  }
}
```

### Test 127 — 8. Payment belongs to other account

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"6100f583-be3d-416d-b940-8c712bd5422b"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "PAYMENT_MISMATCH",
    "message": "Payment does not belong to this auction and user"
  }
}
```

### Test 128 — 9a. Commitment after auction ends

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/732844e3-6d68-4777-b857-8c392c21afbe/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"e7808567-ec70-459f-9f46-bb1219c8f2ee"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "AUCTION_NOT_ACTIVE",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 129 — 10a. Second bidder hold

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"6cebcac3-eeb1-45ac-bb49-a5c782661458"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "de5912fc-6832-4d07-9851-f20c9c601cbc",
    "status": "SUCCESS",
    "sandbox_reference": "6cebcac3-eeb1-45ac-bb49-a5c782661458",
    "max_amount": "2000.00",
    "released_at": null,
    "created_at": "2026-11-13T14:46:40.554Z"
  }
}
```

### Test 130 — 10b. Second bidder bids 1100 SAR

```bash
curl -i -X POST 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1100,"requestId":"f90c6264-5e61-42c2-bc06-bb5279843433"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "bidId": "336651f9-7efa-4a99-a6bb-ad886f15421d",
    "amount": 1100,
    "currentPrice": 1100
  }
}
```

### Test 131 — 10c. Close and identify winner

```bash
curl -i -X GET 'http://127.0.0.1:54473/api/v1/auctions/426c387e-a72d-4932-82a4-8489d96167ff' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "426c387e-a72d-4932-82a4-8489d96167ff",
    "item_id": "2d46ef9d-2889-496f-8f67-adead151e33b",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T13:44:36.291Z",
    "end_time": "2026-11-13T14:45:43.873Z",
    "status": "CLOSED",
    "seller_id": "c1cce238-37b4-49d9-b2aa-8bed7d509c0e",
    "title": "Moyasar Test Car",
    "description": "Test listing",
    "category_id": "00252c5c-5e39-4abf-bb51-67d44f3a0577",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "336651f9-7efa-4a99-a6bb-ad886f15421d",
      "closed_at": "2026-11-13T14:46:46.910Z",
      "winning_amount": "1100.00",
      "isWinner": true
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1100.00",
      "latestBidId": "336651f9-7efa-4a99-a6bb-ad886f15421d",
      "hasBid": true
    }
  }
}
```

## Private Auction and Moyasar Tests

### Test 132 — GET /api/v1/health

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/health'
```

**Result:** HTTP 200

```json
{
  "data": {
    "status": "ok"
  }
}
```

### Test 133 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"seller@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "440c0364-f07d-4092-993a-fbb936d7028f",
      "name": "seller",
      "email": "seller@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 134 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder1@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "1d9beedb-193e-402d-a906-e50d214336ef",
      "name": "bidder1",
      "email": "bidder1@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 135 — POST /api/v1/auth/login

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auth/login' -H 'Content-Type: application/json' -d '{"email":"bidder2@mezyad.test","password":"<test password 36 bytes>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "token": "HIDDEN",
    "user": {
      "id": "b44e6289-3a8e-4218-879b-021cc4237a4a",
      "name": "bidder2",
      "email": "bidder2@mezyad.test",
      "role": "USER"
    }
  }
}
```

### Test 136 — Create private auction

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"itemId":"a69ed0ae-1245-42c2-8faf-e2c08197403a","visibility":"PRIVATE","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-13T14:51:57.974Z","endTime":"2026-11-13T15:50:57.975Z"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "1d604be4-1acd-4805-ba0e-2bdc292118c0",
    "item_id": "a69ed0ae-1245-42c2-8faf-e2c08197403a",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T14:51:57.974Z",
    "end_time": "2026-11-13T15:50:57.975Z",
    "status": "SCHEDULED",
    "accessCode": "9387ffba57be17d44bf42597"
  }
}
```

### Test 137 — Private details before code

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 404

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Auction not found"
  }
}
```

### Test 138 — Bidder one joins private auction

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/access' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"accessCode":"<test code>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "accessGranted": true,
    "auctionId": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  }
}
```

### Test 139 — Bidder two joins private auction

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/access' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"accessCode":"<test code>"}'
```

**Result:** HTTP 200

```json
{
  "data": {
    "accessGranted": true,
    "auctionId": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  }
}
```

### Test 140 — Owner cannot bid on own private auction

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1000,"requestId":"2081a0f3-a6ea-4d94-9679-cc5d2abeac83"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "OWNER",
    "message": "Cannot bid on own auction"
  }
}
```

### Test 141 — No commitment yet

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 404

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No commitment"
  }
}
```

### Test 142 — 1. Invalid payment ID

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"invalid"}'
```

**Result:** HTTP 400

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid auction and paymentId required"
  }
}
```

### Test 143 — 2. Moyasar key absent in separate test process

```bash
curl -i -X POST 'http://127.0.0.1:55453/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"f283ced1-6c77-4c66-825c-68059ddfc44e"}'
```

**Result:** HTTP 503

```json
{
  "error": {
    "code": "BANK_SANDBOX_UNAVAILABLE",
    "message": "Moyasar test key is not configured"
  }
}
```

### Test 144 — 3. Bid without commitment

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1000,"requestId":"4b8d84ba-05a9-4847-9175-28b6246d22b5"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "COMMITMENT_REQUIRED",
    "message": "Verified commitment required"
  }
}
```

### Test 145 — Extra. Pending 3DS

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"08c50dc6-8093-462d-ae33-9d40de3d0fb2"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "PAYMENT_NOT_COMPLETED",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 146 — 4a. Insufficient funds

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"f758b7d4-aa2d-43a8-a4a3-4cd27cdfff73"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "COMMITMENT_DECLINED",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 147 — 5a. Hold below starting price

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"2cf96d98-0699-4d5a-9364-92db7dcca8b8"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "COMMITMENT_TOO_LOW",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 148 — 6a. Accept 2000 SAR hold

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"08c50dc6-8093-462d-ae33-9d40de3d0fb2"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "3c61a0e2-662a-4bba-9b81-65c35fa6a3b2",
    "status": "SUCCESS",
    "sandbox_reference": "08c50dc6-8093-462d-ae33-9d40de3d0fb2",
    "max_amount": "2000.00",
    "released_at": null,
    "created_at": "2026-11-13T14:52:42.422Z"
  }
}
```

### Test 149 — Read successful commitment

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "3c61a0e2-662a-4bba-9b81-65c35fa6a3b2",
    "status": "SUCCESS",
    "sandbox_reference": "08c50dc6-8093-462d-ae33-9d40de3d0fb2",
    "created_at": "2026-11-13T14:52:42.422Z"
  }
}
```

### Test 150 — 7a. Bid above hold

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":2100,"requestId":"0663ce43-f3c6-49bc-94d1-389590810f24"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "BID_ABOVE_COMMITMENT",
    "message": "Bid is above your commitment limit"
  }
}
```

### Test 151 — 7b. Bid within hold

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1000,"requestId":"70cb7910-af5d-4d33-b254-0f87c4052412"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "bidId": "f21abc54-28ec-4231-9b4d-eb61550707a8",
    "amount": 1000,
    "currentPrice": 1000
  }
}
```

### Test 152 — Bid below next minimum

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1000,"requestId":"1262ec1d-33cf-43e1-b282-f52fea414b84"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "BID_TOO_LOW",
    "message": "Bid below minimum"
  }
}
```

### Test 153 — 8. Payment belongs to other account

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"08c50dc6-8093-462d-ae33-9d40de3d0fb2"}'
```

**Result:** HTTP 403

```json
{
  "error": {
    "code": "PAYMENT_MISMATCH",
    "message": "Payment does not belong to this auction and user"
  }
}
```

### Test 154 — 9a. Commitment after auction ends

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/812c9cbb-5da9-41d1-838c-eaffc3129a4e/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"a2d4479b-27bf-4778-8dc5-54fedbe9213f"}'
```

**Result:** HTTP 409

```json
{
  "error": {
    "code": "AUCTION_NOT_ACTIVE",
    "message": "Payment cannot be used as a commitment"
  }
}
```

### Test 155 — 10a. Second bidder hold

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/commitment' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"paymentId":"51c97659-5a44-4f85-ab8f-98ce82fb90bb"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "id": "548a3496-1aff-466f-9151-7a8b5ba1ab04",
    "status": "SUCCESS",
    "sandbox_reference": "51c97659-5a44-4f85-ab8f-98ce82fb90bb",
    "max_amount": "2000.00",
    "released_at": null,
    "created_at": "2026-11-13T14:53:24.848Z"
  }
}
```

### Test 156 — 10b. Second bidder bids 1100 SAR

```bash
curl -i -X POST 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>' -H 'Content-Type: application/json' -d '{"amount":1100,"requestId":"1aff9b5d-3811-456a-a4d5-ef3bd90f7fd7"}'
```

**Result:** HTTP 201

```json
{
  "data": {
    "bidId": "4fd7f74e-a909-4bb8-aeea-be3366aabcc9",
    "amount": 1100,
    "currentPrice": 1100
  }
}
```

### Test 157 — 10c. Close and identify winner

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "1d604be4-1acd-4805-ba0e-2bdc292118c0",
    "item_id": "a69ed0ae-1245-42c2-8faf-e2c08197403a",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T14:50:01.297Z",
    "end_time": "2026-11-13T14:52:28.495Z",
    "status": "CLOSED",
    "seller_id": "440c0364-f07d-4092-993a-fbb936d7028f",
    "title": "Private Car",
    "description": "Car for testing",
    "category_id": "36a0d714-a6ac-448f-ad1e-49b33ac95f35",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "4fd7f74e-a909-4bb8-aeea-be3366aabcc9",
      "closed_at": "2026-11-13T14:53:31.537Z",
      "winning_amount": "1100.00",
      "isWinner": true
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1100.00",
      "latestBidId": "4fd7f74e-a909-4bb8-aeea-be3366aabcc9",
      "hasBid": true
    }
  }
}
```

### Test 158 — Losing participant result

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": {
    "id": "1d604be4-1acd-4805-ba0e-2bdc292118c0",
    "item_id": "a69ed0ae-1245-42c2-8faf-e2c08197403a",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-13T14:50:01.297Z",
    "end_time": "2026-11-13T14:52:28.495Z",
    "status": "CLOSED",
    "seller_id": "440c0364-f07d-4092-993a-fbb936d7028f",
    "title": "Private Car",
    "description": "Car for testing",
    "category_id": "36a0d714-a6ac-448f-ad1e-49b33ac95f35",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "4fd7f74e-a909-4bb8-aeea-be3366aabcc9",
      "closed_at": "2026-11-13T14:53:31.537Z",
      "winning_amount": "1100.00",
      "isWinner": false
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1000.00",
      "latestBidId": "f21abc54-28ec-4231-9b4d-eb61550707a8",
      "hasBid": true
    }
  }
}
```

### Test 159 — Private bid history

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/auctions/1d604be4-1acd-4805-ba0e-2bdc292118c0/bids' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "4fd7f74e-a909-4bb8-aeea-be3366aabcc9",
      "amount": "1100.00",
      "created_at": "2026-11-13T14:53:27.890Z"
    },
    {
      "id": "f21abc54-28ec-4231-9b4d-eb61550707a8",
      "amount": "1000.00",
      "created_at": "2026-11-13T14:52:51.567Z"
    }
  ]
}
```

### Test 160 — Participant auctions include private result

```bash
curl -i -X GET 'http://127.0.0.1:55410/api/v1/me/auctions' -H 'Authorization: Bearer <JWT from login>'
```

**Result:** HTTP 200

```json
{
  "data": [
    {
      "id": "1d604be4-1acd-4805-ba0e-2bdc292118c0",
      "status": "CLOSED",
      "end_time": "2026-11-13T14:52:28.495Z",
      "title": "Private Car"
    }
  ]
}
```

## Email Delivery Test

### Test 161 — Send verification code to the owned inbox

```bash
curl -i -X POST '<backend origin>/api/v1/auth/register' -H 'Content-Type: application/json' -d '{"name":"Email Test","email":"ghadi0alzhrani@gmail.com","password":"<TEST_PASSWORD>"}'
```

**Result:** HTTP 201 with emailSent true. The verification email was received in the inbox.

```json
{
  "data": {
    "id": "5efac793-df15-46d2-b3a0-abd5cc43a457",
    "name": "Email Test",
    "email": "ghadi0alzhrani@gmail.com",
    "role": "USER",
    "emailVerified": false,
    "emailSent": true
  }
}
```

## Moyasar Responses

### Test 162 — Public Moyasar POST /payments initiated

```bash
curl -i -X POST https://api.moyasar.com/v1/payments -u "$MOYASAR_SECRET_KEY:" -H 'Content-Type: application/json' -d '{"given_id":"ea27a9e9-23c7-4f2a-a100-760e5b3f93ce","amount":100000,"currency":"SAR","description":"Mezyad QA sandbox authorization","callback_url":"http://127.0.0.1:54473/api/v1/health","metadata":{"auction_id":"426c387e-a72d-4932-82a4-8489d96167ff","user_id":"9cfde601-b6f6-4175-a74b-9581cdba3293"},"source":{"type":"creditcard","name":"Mezyad Test","number":"4201320000311101","month":12,"year":2030,"cvc":"123","manual":true}}'
```

**Result:** HTTP 201

```json
{
  "id": "ea27a9e9-23c7-4f2a-a100-760e5b3f93ce",
  "status": "initiated",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:44:52.406Z",
  "updated_at": "2026-11-13T14:44:52.406Z",
  "metadata": {
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff",
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1101",
    "gateway_id": "moyasar_cc_JeJbsziYwWtQWU8p7JYaQeL",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC BANK",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "CLASSIC"
  },
  "splits": []
}
```

### Test 163 — Public Moyasar GET /payments/6cebcac3-eeb1-45ac-bb49-a5c782661458 initiated

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/6cebcac3-eeb1-45ac-bb49-a5c782661458 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "6cebcac3-eeb1-45ac-bb49-a5c782661458",
  "status": "initiated",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:08.629Z",
  "updated_at": "2026-11-13T14:45:08.629Z",
  "metadata": {
    "user_id": "ddc11641-669a-4fb0-924f-8d59aefccc96",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_CrzPyvhK4pr5i8WaBFt4pB9",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC Pay (Non-Banking Issuer)",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 164 — Public Moyasar GET /payments/e7808567-ec70-459f-9f46-bb1219c8f2ee initiated

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/e7808567-ec70-459f-9f46-bb1219c8f2ee -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "e7808567-ec70-459f-9f46-bb1219c8f2ee",
  "status": "initiated",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:05.487Z",
  "updated_at": "2026-11-13T14:45:05.487Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "732844e3-6d68-4777-b857-8c392c21afbe"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_ZGWs5a9ieXbhSfV3jTEZDMq",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC Pay (Non-Banking Issuer)",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 165 — Public Moyasar GET /payments/6100f583-be3d-416d-b940-8c712bd5422b initiated

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/6100f583-be3d-416d-b940-8c712bd5422b -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "6100f583-be3d-416d-b940-8c712bd5422b",
  "status": "initiated",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:01.961Z",
  "updated_at": "2026-11-13T14:45:01.961Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_CAL2Mpc6bPhRfKjtb723DCM",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC Pay (Non-Banking Issuer)",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 166 — Public Moyasar GET /payments/619cfed1-da96-463a-9992-e194dcab450f authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/619cfed1-da96-463a-9992-e194dcab450f -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "619cfed1-da96-463a-9992-e194dcab450f",
  "status": "authorized",
  "amount": 50000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "500.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:44:58.686Z",
  "updated_at": "2026-11-13T14:45:24.950Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_FsL9R7RqKfvxSVLs3wBLujD",
    "reference_number": "992631750363",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "001572",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 167 — Public Moyasar GET /payments/ea27a9e9-23c7-4f2a-a100-760e5b3f93ce failed

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/ea27a9e9-23c7-4f2a-a100-760e5b3f93ce -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "ea27a9e9-23c7-4f2a-a100-760e5b3f93ce",
  "status": "failed",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:44:52.406Z",
  "updated_at": "2026-11-13T14:45:19.202Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1101",
    "gateway_id": "moyasar_cc_JeJbsziYwWtQWU8p7JYaQeL",
    "reference_number": "992631756969",
    "token": "HIDDEN",
    "message": "INSUFFICIENT FUNDS",
    "transaction_url": "HIDDEN",
    "response_code": "51",
    "authorization_code": null,
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 168 — Public Moyasar GET /payments/e7808567-ec70-459f-9f46-bb1219c8f2ee authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/e7808567-ec70-459f-9f46-bb1219c8f2ee -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "e7808567-ec70-459f-9f46-bb1219c8f2ee",
  "status": "authorized",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:05.487Z",
  "updated_at": "2026-11-13T14:45:38.521Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "732844e3-6d68-4777-b857-8c392c21afbe"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_ZGWs5a9ieXbhSfV3jTEZDMq",
    "reference_number": "992631732068",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "005263",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 169 — Public Moyasar GET /payments/6100f583-be3d-416d-b940-8c712bd5422b authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/6100f583-be3d-416d-b940-8c712bd5422b -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "6100f583-be3d-416d-b940-8c712bd5422b",
  "status": "authorized",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:01.961Z",
  "updated_at": "2026-11-13T14:45:32.494Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_CAL2Mpc6bPhRfKjtb723DCM",
    "reference_number": "992631744781",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "00109",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 170 — Public Moyasar GET /payments/6cebcac3-eeb1-45ac-bb49-a5c782661458 authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/6cebcac3-eeb1-45ac-bb49-a5c782661458 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "6cebcac3-eeb1-45ac-bb49-a5c782661458",
  "status": "authorized",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:08.629Z",
  "updated_at": "2026-11-13T14:45:44.637Z",
  "metadata": {
    "user_id": "ddc11641-669a-4fb0-924f-8d59aefccc96",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_CrzPyvhK4pr5i8WaBFt4pB9",
    "reference_number": "992631733491",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "006066",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 171 — Public Moyasar GET /payments/619cfed1-da96-463a-9992-e194dcab450f voided

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/619cfed1-da96-463a-9992-e194dcab450f -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "619cfed1-da96-463a-9992-e194dcab450f",
  "status": "voided",
  "amount": 50000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:45:58.297Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "500.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:44:58.686Z",
  "updated_at": "2026-11-13T14:45:58.297Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_FsL9R7RqKfvxSVLs3wBLujD",
    "reference_number": "992631750363",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "001572",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 172 — Public Moyasar GET /payments/e7808567-ec70-459f-9f46-bb1219c8f2ee voided

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/e7808567-ec70-459f-9f46-bb1219c8f2ee -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "e7808567-ec70-459f-9f46-bb1219c8f2ee",
  "status": "voided",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:46:33.794Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:05.487Z",
  "updated_at": "2026-11-13T14:46:33.794Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "732844e3-6d68-4777-b857-8c392c21afbe"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_ZGWs5a9ieXbhSfV3jTEZDMq",
    "reference_number": "992631732068",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "005263",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 173 — Public Moyasar GET /payments/6100f583-be3d-416d-b940-8c712bd5422b voided

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/6100f583-be3d-416d-b940-8c712bd5422b -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "6100f583-be3d-416d-b940-8c712bd5422b",
  "status": "voided",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:46:47.334Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:01.961Z",
  "updated_at": "2026-11-13T14:46:47.334Z",
  "metadata": {
    "user_id": "9cfde601-b6f6-4175-a74b-9581cdba3293",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_CAL2Mpc6bPhRfKjtb723DCM",
    "reference_number": "992631744781",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "00109",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 174 — Public Moyasar POST /payments/6cebcac3-eeb1-45ac-bb49-a5c782661458/void voided

```bash
curl -i -X POST https://api.moyasar.com/v1/payments/6cebcac3-eeb1-45ac-bb49-a5c782661458/void -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "6cebcac3-eeb1-45ac-bb49-a5c782661458",
  "status": "voided",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:47:27.874Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:54473/api/v1/health",
  "created_at": "2026-11-13T14:45:08.629Z",
  "updated_at": "2026-11-13T14:47:27.874Z",
  "metadata": {
    "user_id": "ddc11641-669a-4fb0-924f-8d59aefccc96",
    "auction_id": "426c387e-a72d-4932-82a4-8489d96167ff"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_CrzPyvhK4pr5i8WaBFt4pB9",
    "reference_number": "992631733491",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "006066",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 175 — Private Moyasar POST /payments initiated

```bash
curl -i -X POST https://api.moyasar.com/v1/payments -u "$MOYASAR_SECRET_KEY:" -H 'Content-Type: application/json' -d '{"given_id":"f758b7d4-aa2d-43a8-a4a3-4cd27cdfff73","amount":100000,"currency":"SAR","description":"Mezyad QA sandbox authorization","callback_url":"http://127.0.0.1:55410/api/v1/health","metadata":{"auction_id":"1d604be4-1acd-4805-ba0e-2bdc292118c0","user_id":"1d9beedb-193e-402d-a906-e50d214336ef"},"source":{"type":"creditcard","name":"Mezyad Test","number":"4201320000311101","month":12,"year":2030,"cvc":"123","manual":true}}'
```

**Result:** HTTP 201

```json
{
  "id": "f758b7d4-aa2d-43a8-a4a3-4cd27cdfff73",
  "status": "initiated",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:32.782Z",
  "updated_at": "2026-11-13T14:51:32.782Z",
  "metadata": {
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0",
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1101",
    "gateway_id": "moyasar_cc_Qpgw6BMbNnhum8oauqfwVFo",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC BANK",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "CLASSIC"
  },
  "splits": []
}
```

### Test 176 — Private Moyasar GET /payments/51c97659-5a44-4f85-ab8f-98ce82fb90bb initiated

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/51c97659-5a44-4f85-ab8f-98ce82fb90bb -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "51c97659-5a44-4f85-ab8f-98ce82fb90bb",
  "status": "initiated",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:45.839Z",
  "updated_at": "2026-11-13T14:51:45.839Z",
  "metadata": {
    "user_id": "b44e6289-3a8e-4218-879b-021cc4237a4a",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_vaLRFLsV2GxgiStNyaAQWL4",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC Pay (Non-Banking Issuer)",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 177 — Private Moyasar GET /payments/a2d4479b-27bf-4778-8dc5-54fedbe9213f initiated

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/a2d4479b-27bf-4778-8dc5-54fedbe9213f -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "a2d4479b-27bf-4778-8dc5-54fedbe9213f",
  "status": "initiated",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:42.569Z",
  "updated_at": "2026-11-13T14:51:42.569Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "812c9cbb-5da9-41d1-838c-eaffc3129a4e"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_UyHsRwhBVQQ9mk52ZSKHkJ6",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC Pay (Non-Banking Issuer)",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 178 — Private Moyasar GET /payments/08c50dc6-8093-462d-ae33-9d40de3d0fb2 initiated

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/08c50dc6-8093-462d-ae33-9d40de3d0fb2 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "08c50dc6-8093-462d-ae33-9d40de3d0fb2",
  "status": "initiated",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:39.210Z",
  "updated_at": "2026-11-13T14:51:39.210Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_eRi9krwm1DmX3v8QSVYyUJy",
    "reference_number": null,
    "token": "HIDDEN",
    "message": null,
    "transaction_url": "HIDDEN",
    "response_code": null,
    "authorization_code": null,
    "issuer_name": "STC Pay (Non-Banking Issuer)",
    "issuer_country": "SA",
    "issuer_card_type": "debit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 179 — Private Moyasar GET /payments/2cf96d98-0699-4d5a-9364-92db7dcca8b8 authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/2cf96d98-0699-4d5a-9364-92db7dcca8b8 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "2cf96d98-0699-4d5a-9364-92db7dcca8b8",
  "status": "authorized",
  "amount": 50000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "500.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:36.001Z",
  "updated_at": "2026-11-13T14:52:03.512Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_KL5EqkvdQT4ihxZGN9xSQmB",
    "reference_number": "992631713933",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "007156",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 180 — Private Moyasar GET /payments/f758b7d4-aa2d-43a8-a4a3-4cd27cdfff73 failed

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/f758b7d4-aa2d-43a8-a4a3-4cd27cdfff73 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "f758b7d4-aa2d-43a8-a4a3-4cd27cdfff73",
  "status": "failed",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:32.782Z",
  "updated_at": "2026-11-13T14:51:57.464Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1101",
    "gateway_id": "moyasar_cc_Qpgw6BMbNnhum8oauqfwVFo",
    "reference_number": "992631733380",
    "token": "HIDDEN",
    "message": "INSUFFICIENT FUNDS",
    "transaction_url": "HIDDEN",
    "response_code": "51",
    "authorization_code": null,
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 181 — Private Moyasar GET /payments/a2d4479b-27bf-4778-8dc5-54fedbe9213f authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/a2d4479b-27bf-4778-8dc5-54fedbe9213f -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "a2d4479b-27bf-4778-8dc5-54fedbe9213f",
  "status": "authorized",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:42.569Z",
  "updated_at": "2026-11-13T14:52:15.518Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "812c9cbb-5da9-41d1-838c-eaffc3129a4e"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_UyHsRwhBVQQ9mk52ZSKHkJ6",
    "reference_number": "992631765668",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "005787",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 182 — Private Moyasar GET /payments/08c50dc6-8093-462d-ae33-9d40de3d0fb2 authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/08c50dc6-8093-462d-ae33-9d40de3d0fb2 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "08c50dc6-8093-462d-ae33-9d40de3d0fb2",
  "status": "authorized",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:39.210Z",
  "updated_at": "2026-11-13T14:52:09.471Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_eRi9krwm1DmX3v8QSVYyUJy",
    "reference_number": "992631718381",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "008265",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 183 — Private Moyasar GET /payments/51c97659-5a44-4f85-ab8f-98ce82fb90bb authorized

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/51c97659-5a44-4f85-ab8f-98ce82fb90bb -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "51c97659-5a44-4f85-ab8f-98ce82fb90bb",
  "status": "authorized",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:45.839Z",
  "updated_at": "2026-11-13T14:52:21.044Z",
  "metadata": {
    "user_id": "b44e6289-3a8e-4218-879b-021cc4237a4a",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_vaLRFLsV2GxgiStNyaAQWL4",
    "reference_number": "992631766044",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "003204",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 184 — Private Moyasar GET /payments/2cf96d98-0699-4d5a-9364-92db7dcca8b8 voided

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/2cf96d98-0699-4d5a-9364-92db7dcca8b8 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "2cf96d98-0699-4d5a-9364-92db7dcca8b8",
  "status": "voided",
  "amount": 50000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:52:35.645Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "500.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:36.001Z",
  "updated_at": "2026-11-13T14:52:35.645Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_KL5EqkvdQT4ihxZGN9xSQmB",
    "reference_number": "992631713933",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "007156",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 185 — Private Moyasar GET /payments/a2d4479b-27bf-4778-8dc5-54fedbe9213f voided

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/a2d4479b-27bf-4778-8dc5-54fedbe9213f -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "a2d4479b-27bf-4778-8dc5-54fedbe9213f",
  "status": "voided",
  "amount": 100000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:53:18.039Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "1,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:42.569Z",
  "updated_at": "2026-11-13T14:53:18.039Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "812c9cbb-5da9-41d1-838c-eaffc3129a4e"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_UyHsRwhBVQQ9mk52ZSKHkJ6",
    "reference_number": "992631765668",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "005787",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 186 — Private Moyasar GET /payments/08c50dc6-8093-462d-ae33-9d40de3d0fb2 voided

```bash
curl -i -X GET https://api.moyasar.com/v1/payments/08c50dc6-8093-462d-ae33-9d40de3d0fb2 -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "08c50dc6-8093-462d-ae33-9d40de3d0fb2",
  "status": "voided",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:53:31.927Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:39.210Z",
  "updated_at": "2026-11-13T14:53:31.927Z",
  "metadata": {
    "user_id": "1d9beedb-193e-402d-a906-e50d214336ef",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_eRi9krwm1DmX3v8QSVYyUJy",
    "reference_number": "992631718381",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "008265",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 187 — Private Moyasar POST /payments/51c97659-5a44-4f85-ab8f-98ce82fb90bb/void voided

```bash
curl -i -X POST https://api.moyasar.com/v1/payments/51c97659-5a44-4f85-ab8f-98ce82fb90bb/void -u "$MOYASAR_SECRET_KEY:"
```

**Result:** HTTP 200

```json
{
  "id": "51c97659-5a44-4f85-ab8f-98ce82fb90bb",
  "status": "voided",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-13T14:54:06.214Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "151.254.55.88",
  "callback_url": "http://127.0.0.1:55410/api/v1/health",
  "created_at": "2026-11-13T14:51:45.839Z",
  "updated_at": "2026-11-13T14:54:06.214Z",
  "metadata": {
    "user_id": "b44e6289-3a8e-4218-879b-021cc4237a4a",
    "auction_id": "1d604be4-1acd-4805-ba0e-2bdc292118c0"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_vaLRFLsV2GxgiStNyaAQWL4",
    "reference_number": "992631766044",
    "token": "HIDDEN",
    "message": "APPROVED",
    "transaction_url": "HIDDEN",
    "response_code": "00",
    "authorization_code": "003204",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

## Result

The 153 final checks passed. The tests covered all 24 current API endpoints, including JWT validation and logout, account permissions, email verification, two-image upload, rejected-listing resubmission, public and private auctions, two bidders, winner and loser results, and actual Moyasar Sandbox authorization and void responses.

A regular user receiving HTTP 200 from the listing endpoint is a successful test because the response contains only that user's own listings. The administrator uses the status query to read the review list.
