# BE-12 — Auction List and Details Testing Report

**Team member:** Ghadi

**Week:** 3 — Backend

**Task date:** 25 October 2026

**Testing method:** Manual testing using the terminal and curl.

## Goal

Check that public auctions and their details return listing data, images, prices, and status. Check invalid IDs, missing auctions, and access to private auction details.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Request the public list without signing in | Return the public auction and its images | `200 OK` | Passed |
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

I tested the routes manually using curl commands in the VS Code terminal. PostgreSQL was running in Docker, and the backend was running locally on port 3000.

I used the existing project tables: items for listings, auctions for auctions, and item_images for image URLs. These tables had been prepared during the earlier local setup using database/migrations/001_schema.sql.

I reused the public auction for Test Car and the private auction for Approved Car from earlier tests.

Test Car had two test image URLs stored in the local database:

```text
https://example.com/car1.jpg
https://example.com/car2.jpg
```

The image checks covered returning these stored URLs in the API response.

For the private owner request, I used the session token for admin@example.com, which owns that auction. The token came from data.token in its earlier login response. I placed it after Bearer in the Authorization header.

For each request, I compared the HTTP status and response data with the expected result.

## File Syntax Check

I ran:

```bash
node --check backend/src/app.js
```

The terminal returned to the prompt without an error message. The file syntax check passed.

## Test Cases and Commands

### Test 1 — Public Auction List

```bash
curl -i http://localhost:3000/auctions
```

**Result:** The backend returned 200 OK. Test Car appeared with SCHEDULED status and both image URLs. The private auction did not appear in the list.

### Test 2 — Public Auction Details

```bash
curl -i http://localhost:3000/auctions/16545322-438b-4da8-9359-23832b681f0c
```

**Result:** The backend returned 200 OK with the listing title, description, category ID, category fields, both images, prices, minimum increment, auction times, and status.

The category_fields value was {} because the test listing had no additional specifications. The response did not include access_code_hash. The result value was null because the auction had not closed.

### Test 3 — Incorrectly Formatted ID

```bash
curl -i http://localhost:3000/auctions/abc
```

**Result:** The backend returned 400 Bad Request with INVALID_ID and the message Invalid ID.

### Test 4 — Auction Not Found

```bash
curl -i http://localhost:3000/auctions/00000000-0000-4000-8000-000000000000
```

**Result:** The backend returned 404 Not Found with NOT_FOUND and the message Auction not found.

### Test 5 — Private Auction Without Signing In

```bash
curl -i http://localhost:3000/auctions/90efaa52-d751-4ad6-8ad5-7cd676e55335
```

**Result:** The backend returned 404 Not Found with NOT_FOUND. It did not return the private auction details for this request.

### Test 6 — Private Auction Requested by Its Owner

```bash
curl -i http://localhost:3000/auctions/90efaa52-d751-4ad6-8ad5-7cd676e55335 \
  -H 'Authorization: Bearer (I placed the auction owner session token here)'
```

**Result:** The backend returned 200 OK with the private auction details. The response contained images: [] because the listing had no images. It did not include the access code hash.

## Status Test Data Preparation

I added a separate test listing to the existing items table:

```bash
docker compose exec -T db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 -c "
INSERT INTO items (seller_id, category_id, title, description, status)
VALUES (
  '55fc8774-d30a-41d1-a467-ffe6bb5ee819',
  'cc19d435-c42a-4479-89a1-54a1079b35fb',
  'Test Status Car',
  'Car for testing auction status',
  'APPROVED'
)
RETURNING id, title, status;"
```

The command returned INSERT 0 1 and this listing ID:

```text
96c6a66b-5603-4de9-87d0-731821fd4f59
```

I used the existing test user and vehicle category. I set the listing to APPROVED to prepare data for testing the displayed auction status.

I then added an auction for this listing. Its start time was one hour before the database time, and its end time was one hour after it:

```bash
docker compose exec -T db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 -c "
INSERT INTO auctions (
  item_id, visibility, starting_price, current_price,
  minimum_increment, start_time, end_time
)
VALUES (
  '96c6a66b-5603-4de9-87d0-731821fd4f59',
  'PUBLIC',
  1000,
  1000,
  100,
  now() - interval '1 hour',
  now() + interval '1 hour'
)
RETURNING id, status, start_time, end_time;"
```

The command returned INSERT 0 1 and this auction ID:

```text
cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0
```

The stored status at insertion was SCHEDULED. I used this auction to check that the API displayed its status using the auction times and database time, without any bids.

### Test 7 — Active Auction in the Public List

```bash
curl -i http://localhost:3000/auctions
```

**Result:** The backend returned 200 OK. Test Status Car appeared with ACTIVE status and images: []. Test Car remained SCHEDULED.

### Test 8 — Active Auction Details

```bash
curl -i http://localhost:3000/auctions/cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0
```

**Result:** The backend returned 200 OK with ACTIVE status, images: [], and result: null.

## End-Time Test Preparation

I changed only the test auction's end time to one minute before the database time:

```bash
docker compose exec -T db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 -c "
UPDATE auctions
SET end_time = now() - interval '1 minute'
WHERE id = 'cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0'
RETURNING id, start_time, end_time;"
```

The command returned UPDATE 1. This prepared the auction for checking its displayed status after its end time had passed.

### Test 9 — Ended Auction in the Public List

```bash
curl -i http://localhost:3000/auctions
```

**Result:** The backend returned 200 OK. Test Status Car appeared with CLOSED status. Test Car remained SCHEDULED.

### Test 10 — Ended Auction Details

```bash
curl -i http://localhost:3000/auctions/cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0
```

**Result:** The backend returned 200 OK with CLOSED status. The result contained closed_at and winner_bid_id: null because the test auction had no bids.

## Testing Result

All ten documented test cases matched the expected results.

The routes returned auction data and images, and displayed SCHEDULED, ACTIVE, and CLOSED in the tested cases. They handled invalid and missing IDs and preserved access checks for private auction details.