# G-08 — API Error Responses Testing Report

**Team member:** Ghadi

**Report date:** 13 November 2026

**Testing method:** Manual testing using the terminal, curl, and PostgreSQL queries.

## Goal

Check that invalid requests, authentication failures, permission errors and internal errors return the correct HTTP status and a consistent JSON error response.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Missing login fields | `400 INVALID_INPUT` | `400 INVALID_INPUT` | Passed |
| Malformed JSON | `400 INVALID_JSON` | `400 INVALID_JSON` | Passed |
| JSON over 100kb | `413 PAYLOAD_TOO_LARGE` | `413 PAYLOAD_TOO_LARGE` | Passed |
| Invalid UUID | `400 INVALID_ID` | `400 INVALID_ID` | Passed |
| Malformed encoded path | `400 INVALID_INPUT` | `400 INVALID_INPUT` | Passed |
| No token | `401 UNAUTHORIZED` | `401 UNAUTHORIZED` | Passed |
| Invalid token | `401 UNAUTHORIZED` | `401 UNAUTHORIZED` | Passed |
| Modified JWT | `401 UNAUTHORIZED` | `401 UNAUTHORIZED` | Passed |
| Expired JWT with live DB session | `401 UNAUTHORIZED` | `401 UNAUTHORIZED` | Passed |
| User cannot review | `403 FORBIDDEN` | `403 FORBIDDEN` | Passed |
| Admin cannot create listing | `403 FORBIDDEN` | `403 FORBIDDEN` | Passed |
| Unknown route | `404 NOT_FOUND` | `404 NOT_FOUND` | Passed |
| Missing auction UUID | `404 NOT_FOUND` | `404 NOT_FOUND` | Passed |
| Private auction not disclosed | `404 NOT_FOUND` | `404 NOT_FOUND` | Passed |
| Duplicate email | `409 DUPLICATE_EMAIL` | `409 DUPLICATE_EMAIL` | Passed |
| Review already approved listing | `409 INVALID_STATE` | `409 INVALID_STATE` | Passed |
| Oversized image | `413 PAYLOAD_TOO_LARGE` | `413 PAYLOAD_TOO_LARGE` | Passed |
| Corrupt image | `400 INVALID_IMAGE` | `400 INVALID_IMAGE` | Passed |
| Rate limit | `429 TOO_MANY_REQUESTS` | `429 TOO_MANY_REQUESTS` | Passed |
| Rate limit Retry-After header | Return a numeric retry interval | `Retry-After: 60` | Passed |
| Provider configuration error | `503 BANK_SANDBOX_UNAVAILABLE` | `503 BANK_SANDBOX_UNAVAILABLE` | Passed |
| Duplicate bid request | `409 DUPLICATE_REQUEST` | `409 DUPLICATE_REQUEST` | Passed |
| Bid below next minimum | `409 BID_TOO_LOW` | `409 BID_TOO_LOW` | Passed |
| Internal database error is safe | `500 INTERNAL_ERROR` | `500 INTERNAL_ERROR` | Passed |
| Internal error hides database details | Do not expose the database exception | Database exception text was not returned | Passed |
| All error responses share safe JSON envelope | Return an error object with code and message | All tested error responses matched | Passed |

## Testing Method

I tested the routes using curl commands in the VS Code terminal.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

I used `admin@mezyad.test`, `seller@mezyad.test`, `bidder1@mezyad.test` and `bidder2@mezyad.test` for the account and permission checks.

## Test Cases and Commands

### Test 1 — Missing login fields

I sent an empty login body to check that the required fields were validated.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Valid email and password required"
  }
}
```

### Test 2 — Malformed JSON

I sent an incomplete JSON body to check the response when JSON could not be parsed.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  --data-binary '{"email":'
```

**Result:** The backend returned `400 INVALID_JSON`.

```json
{
  "error": {
    "code": "INVALID_JSON",
    "message": "Invalid JSON body"
  }
}
```

### Test 3 — JSON over 100kb

I sent a JSON body larger than the 100 KB limit.

```bash
python3 -c 'import json; print(json.dumps({"x":"x"*102500}, separators=(",",":")), end="")' | \
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  --data-binary @-
```

**Result:** The backend returned `413 PAYLOAD_TOO_LARGE`.

```json
{
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "Request body too large"
  }
}
```

### Test 4 — Invalid UUID

I sent an auction ID that was not a UUID.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auctions/no-id'
```

**Result:** The backend returned `400 INVALID_ID`.

```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid ID"
  }
}
```

### Test 5 — Malformed encoded path

I sent %ZZ as the auction ID to check invalid URL encoding.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auctions/%ZZ'
```

**Result:** The backend returned `400 INVALID_INPUT`.

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid URL encoding"
  }
}
```

### Test 6 — No token

I requested the current account without an Authorization header.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auth/me'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in required"
  }
}
```

### Test 7 — Invalid token

I sent an invalid token instead of a JWT.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auth/me' \
  -H 'Authorization: Bearer invalid'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 8 — Modified JWT

I changed is_admin in the JWT payload without creating a new signature.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auth/me' \
  -H 'Authorization: Bearer <MODIFIED_JWT>'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 9 — Expired JWT with live DB session

I sent an expired JWT while its database session still had a future expiry time.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auth/me' \
  -H 'Authorization: Bearer <EXPIRED_JWT>'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session expired"
  }
}
```

### Test 10 — User cannot review

I tried to review an advertisement using a regular user account.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/admin/items/e600491e-ad7d-49c3-940f-2bf913c98777/review' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"APPROVED"}'
```

**Result:** The backend returned `403 FORBIDDEN`.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin only"
  }
}
```

### Test 11 — Admin cannot create listing

I tried to create an advertisement using the admin account.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/items' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `403 FORBIDDEN`.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User only"
  }
}
```

### Test 12 — Unknown route

I requested a route that did not exist.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/not-a-route'
```

**Result:** The backend returned `404 NOT_FOUND`.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found"
  }
}
```

### Test 13 — Missing auction UUID

I requested an auction using a valid UUID that was not in the database.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auctions/00000000-0000-4000-8000-000000000000'
```

**Result:** The backend returned `404 NOT_FOUND`.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Auction not found"
  }
}
```

### Test 14 — Private auction not disclosed

I requested a private auction using a bidder account that had not entered its access code.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auctions/5691be7d-f25d-4bd8-9246-c1d48a3ef8ef' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>'
```

**Result:** The backend returned `404 NOT_FOUND`.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Auction not found"
  }
}
```

### Test 15 — Duplicate email

I tried to register an email that was already in the database.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"seller","email":"seller@mezyad.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `409 DUPLICATE_EMAIL`.

```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email already registered"
  }
}
```

### Test 16 — Review already approved listing

I tried to approve an advertisement that was already approved.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/admin/items/e600491e-ad7d-49c3-940f-2bf913c98777/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"decision":"APPROVED"}'
```

**Result:** The backend returned `409 INVALID_STATE`.

```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "Listing not pending review"
  }
}
```

### Test 17 — Oversized image

I uploaded a file with an image content type and a size larger than the 5 MiB limit.

```bash
mkdir -p /private/tmp/test-backend-reports.45tu179w
node --input-type=module -e 'import {writeFileSync} from "node:fs"; writeFileSync("/private/tmp/test-backend-reports.45tu179w/too-large.png",Buffer.alloc(5*1024*1024+1));'
```

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/items' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -F 'title=Test Car' \
  -F 'description=Car for testing' \
  -F categoryId=824a35d4-b0ff-498f-88f4-f47fde0fff16 \
  -F 'categoryFields={}' \
  -F 'images=@/private/tmp/test-backend-reports.45tu179w/too-large.png;type=image/png'
```

**Result:** The backend returned `413 PAYLOAD_TOO_LARGE`.

```json
{
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "Up to six JPG, PNG or WebP images, 5 MiB each"
  }
}
```

### Test 18 — Corrupt image

I uploaded a file that did not contain valid image data.

```bash
mkdir -p /private/tmp/test-backend-reports.45tu179w
node --input-type=module -e 'import {writeFileSync} from "node:fs"; writeFileSync("/private/tmp/test-backend-reports.45tu179w/invalid.png","not an image");'
```

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/items' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -F 'title=Test Car' \
  -F 'description=Car for testing' \
  -F categoryId=824a35d4-b0ff-498f-88f4-f47fde0fff16 \
  -F 'categoryFields={}' \
  -F 'images=@/private/tmp/test-backend-reports.45tu179w/invalid.png;type=image/png'
```

**Result:** The backend returned `400 INVALID_IMAGE`.

```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Use a valid JPG, PNG or WebP image"
  }
}
```

### Test 19 — Rate limit

I sent ten incorrect private auction codes and then sent the correct code to check the request limit.

```bash
for attempt in 1 2 3 4 5 6 7 8 9 10; do
curl -i --path-as-is -X POST 'http://127.0.0.1:59343/api/v1/auctions/access' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"accessCode":"000000000000000000000000"}'
done
```

All ten incorrect-code requests returned `403 INVALID_CODE`.

```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid access code"
  }
}
```

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59343/api/v1/auctions/access' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"accessCode":"1a74b5fb4938c670cc9a43cb"}'
```

**Result:** The backend returned `429 TOO_MANY_REQUESTS`.

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many attempts. Try again later."
  }
}
```

### Test 20 — Rate limit Retry-After header

I checked the Retry-After header on the rate-limited response.

```text
Retry-After: 60
```

**Result:** The response included a numeric `Retry-After` header.

### Test 21 — Provider configuration error

I sent a commitment request to a temporary backend instance without a Moyasar key.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59356/api/v1/auctions/b58893be-9ea9-4426-8bb7-e7efa41ccb1d/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"265a5a94-6177-4179-93c2-129ac5b8db76"}'
```

**Result:** The backend returned `503 BANK_SANDBOX_UNAVAILABLE`.

```json
{
  "error": {
    "code": "BANK_SANDBOX_UNAVAILABLE",
    "message": "Moyasar test key is not configured"
  }
}
```

### Test 22 — Duplicate bid request

I first sent the bid and received a successful response before repeating the same requestId.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auctions/b58893be-9ea9-4426-8bb7-e7efa41ccb1d/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"bb62623b-3329-480f-8a98-2034fbed6ed9"}'
```

**Result:** The backend returned `201`.

```json
{
  "data": {
    "bidId": "d4ddb43e-a043-4966-8289-67fa105e8eef",
    "amount": 1000,
    "currentPrice": 1000
  }
}
```

I repeated a bid using the same requestId.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auctions/b58893be-9ea9-4426-8bb7-e7efa41ccb1d/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"bb62623b-3329-480f-8a98-2034fbed6ed9"}'
```

**Result:** The backend returned `409 DUPLICATE_REQUEST`.

```json
{
  "error": {
    "code": "DUPLICATE_REQUEST",
    "message": "Bid request already processed"
  }
}
```

### Test 23 — Bid below next minimum

The second bidder first raised the current price to 1,100 SAR so the next minimum bid was 1,200 SAR.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auctions/b58893be-9ea9-4426-8bb7-e7efa41ccb1d/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"a6e2cb15-a4eb-4db6-a2af-a77fc2aae74c"}'
```

**Result:** The backend returned `201`.

```json
{
  "data": {
    "bidId": "e3de775d-c2d8-4e28-b80a-cb1cd81a4f11",
    "amount": 1100,
    "currentPrice": 1100
  }
}
```

I sent a bid below the next allowed price.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:59311/api/v1/auctions/b58893be-9ea9-4426-8bb7-e7efa41ccb1d/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"d3873d1c-1529-49d9-89f4-4ca58fc12a83"}'
```

**Result:** The backend returned `409 BID_TOO_LOW`.

```json
{
  "error": {
    "code": "BID_TOO_LOW",
    "message": "Bid below minimum"
  }
}
```

### Test 24 — Internal database error is safe

I made the test database reject an auction result insert to check the internal error response.

```sql
CREATE FUNCTION test_fail_close() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.auction_id='d55afc63-cc82-413f-beba-e61d92bcb73c'::uuid THEN RAISE EXCEPTION 'PRIVATE_TEST_DATABASE_DETAIL'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_fail_close BEFORE INSERT ON auction_results FOR EACH ROW EXECUTE FUNCTION test_fail_close();
```

```sql
UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id='d55afc63-cc82-413f-beba-e61d92bcb73c';
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:59311/api/v1/auctions/d55afc63-cc82-413f-beba-e61d92bcb73c'
```

**Result:** The backend returned `500 INTERNAL_ERROR`.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected server error"
  }
}
```

### Test 25 — Internal error hides database details

I checked the response from Test 24 to confirm that it did not include the database exception text.

**Result:** The backend returned `500 INTERNAL_ERROR`.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected server error"
  }
}
```

**Result:** The response did not contain `PRIVATE_TEST_DATABASE_DETAIL`.

```sql
DROP TRIGGER test_fail_close ON auction_results;
DROP FUNCTION test_fail_close();
```

### Test 26 — All error responses share safe JSON envelope

I checked the Content-Type and JSON structure of all the error responses in this report.

**Result:** All tested error responses had `Content-Type: application/json` and an `error` object containing `code` and `message`. They did not include `data`, stack traces, stored password or token hashes, or the injected database exception text.

## Testing Result

All 26 checks matched their expected results.
