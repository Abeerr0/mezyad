# BE-12 — Auction List and Details Testing Report

**Team member:** Ghadi

**Week:** 3 — Backend

**Task date:** 25 October 2026

**Retest date:** 10 November 2026

**Testing method:** Manual testing using the terminal and curl.

## Goal

Check that public auctions and their details return listing data, images, prices, and status. Check invalid IDs, missing auctions, and access to private auction details.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Request the public list without signing in | Return the public auction with its cover image and exclude private auctions | `200 OK` with the public auction and its cover image in `image_url`; the private auction was excluded | Passed |
| Request public auction details | Return auction data, images, and status | `200 OK` | Passed |
| Send an incorrectly formatted ID | Reject the ID | `400 INVALID_ID` | Passed |
| Send a valid-format ID that does not exist | Return not found | `404 NOT_FOUND` | Passed |
| Request private details without signing in | Hide the private auction details | `404 NOT_FOUND` | Passed |
| Request private details as the owner | Return details with an empty images list | `200 OK` | Passed |
| List an auction that has started but not ended | Display `ACTIVE` | `200 OK` and `ACTIVE` | Passed |
| Request active auction details | Display `ACTIVE` | `200 OK` and `ACTIVE` | Passed |
| List an auction whose end time has passed | Display `CLOSED` | `200 OK` and `CLOSED` | Passed |
| Request ended auction details | Return `CLOSED` and closure data | `200 OK` and `CLOSED` | Passed |

## Testing Method and Existing Data

I tested the routes using curl commands in the VS Code terminal.

I used public and private auctions plus a separate auction for the status checks. Its times were changed in the temporary database to check the active and closed responses.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

The public listing `Test Car` used `https://example.com/car1.jpg` and `https://example.com/car2.jpg`.

## File Syntax Check

I ran:

```bash
node --check backend/src/app.js
```

The terminal returned to the prompt without an error message. The file syntax check passed.

## Test Cases and Commands

### Test 1 — Public Auction List

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions'
```

**Result:** The backend returned `200 OK`. Test Car appeared with `SCHEDULED` status and its cover image in `image_url`. The private auction did not appear in the list.

### Test 2 — Public Auction Details

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/cedc7b3c-7d9d-4eb5-8d5f-658b756f7b90'
```

**Result:** The backend returned `200`. The response showed `status=SCHEDULED images=2`.

### Test 3 — Incorrectly Formatted ID

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/abc'
```

**Result:** The backend returned `400 INVALID_ID`.

### Test 4 — Auction Not Found

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/00000000-0000-4000-8000-000000000000'
```

**Result:** The backend returned `404 NOT_FOUND`.

### Test 5 — Private Auction Without Signing In

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/8dbeaca7-14a4-4022-b672-63f11c30fb19'
```

**Result:** The backend returned `404 NOT_FOUND`.

### Test 6 — Private Auction Requested by Its Owner

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/8dbeaca7-14a4-4022-b672-63f11c30fb19' \
  -H 'Authorization: Bearer <SELLER_JWT>'
```

**Result:** The backend returned `200`. The response showed `visibility=PRIVATE images=0`.

## Status Test Data Preparation

I created `Test Status Car` and a public auction in the temporary database. The stored status was `SCHEDULED`. The start and end times were set to 30 minutes before and after the test time. I checked the status returned by the API before placing any bids.

### Test 7 — Active Auction in the Public List

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions'
```

**Result:** The backend returned `200`. The response showed `status=ACTIVE`.

### Test 8 — Active Auction Details

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/19ebe2ea-1c57-4532-ac05-c8633545220b'
```

**Result:** The backend returned `200`. The response showed `status=ACTIVE result=null`.

## End-Time Test Preparation

I moved the end time of the same test auction to one minute before the database time.

```sql
UPDATE auctions
SET end_time = now() - interval '1 minute'
WHERE id = '<STATUS_TEST_AUCTION_ID>';
```

### Test 9 — Ended Auction in the Public List

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions'
```

**Result:** The backend returned `200`. The response showed `status=CLOSED`.

### Test 10 — Ended Auction Details

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auctions/19ebe2ea-1c57-4532-ac05-c8633545220b'
```

**Result:** The backend returned `200`. The response showed `status=CLOSED closure timestamp saved`.

## Testing Result

All 10 cases passed. The public auction list returned the cover image, and the auction details returned both images. The private auction, auction timing, and closure checks matched the expected results.
