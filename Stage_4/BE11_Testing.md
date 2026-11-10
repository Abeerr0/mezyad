# BE-11 — Auction Creation Testing Report

**Team member:** Ghadi

**Week:** 3 — Backend

**Task date:** 25 October 2026

**Retest date:** 10 November 2026

**Testing method:** Manual testing using the terminal, curl, and PostgreSQL queries.

## Goal

Check that users can create public and private auctions for their own approved listings.

Test the starting price, minimum increment, start time, end time, and prevention of duplicate auctions for the same listing.

## Test Results Summary

This table summarizes the tested cases, their expected results, and the actual results.

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Create an auction without a token | Reject the request | `401 UNAUTHORIZED` | Passed |
| Send an empty body with a valid token | Reject the input | `400 INVALID_INPUT` | Passed |
| Create a public auction for an approved listing using its owner's account | Create the auction | `201 Created` | Passed |
| Create another auction for the same listing | Reject the duplicate | `409 DUPLICATE_AUCTION` | Passed |
| Set the starting price to zero | Reject the input | `400 INVALID_INPUT` | Passed |
| Set the minimum increment to zero | Reject the input | `400 INVALID_INPUT` | Passed |
| Set the end time before the start time | Reject the input | `400 INVALID_INPUT` | Passed |
| Create an auction for another account's listing | Reject the request | `403 NOT_APPROVED` | Passed |
| Create an auction for a rejected listing using its owner's account | Reject the request | `403 NOT_APPROVED` | Passed |
| Create a private auction for an approved listing using its owner's account | Create the auction and return an access code | `201 Created` with `accessCode` | Passed |
| Read the access code hash from the database | Find a stored hash | `PRIVATE` and a bcrypt hash were returned | Passed |

## Database Tables Setup

I prepared the temporary PostgreSQL database using the backend setup command.

```bash
npm run db:setup
```

The command completed and reported that the schema and categories were ready.

## Auction Table Used

I used the `auctions` table for this task.

It stores the linked listing, auction visibility, prices, start and end times, status, and the access code hash for private auctions.

During testing, I added a public auction and a private auction through the API. I then read the private auction's data from this table to check that its access code hash was stored.

## Testing Method

I tested the route using curl commands in the VS Code terminal.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Test Data

I used the owner of an approved listing, the owner of a rejected listing, and a separate owner for the ownership check. The valid auction requests used a 1,000 SAR starting price, a 100 SAR minimum increase, and future start and end times.

## Test Cases and Commands

### Test 1 — Request Without a Token

I sent an auction creation request without a token to check that auction creation required a valid session.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"5b1fb21d-8ecc-4a74-92a0-878c02dca04c","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

### Test 2 — Empty Body With a Valid Token

I sent an empty JSON object with a valid user token to check that missing auction data was rejected.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 3 — Create a Public Auction

I sent valid auction data for the approved `Test Car` listing using its owner's token.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"5b1fb21d-8ecc-4a74-92a0-878c02dca04c","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `201`. The response showed `visibility=PUBLIC status=SCHEDULED`.

### Test 4 — Duplicate Auction

I repeated the auction creation request for the same listing to check that another auction could not be created for it.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"5b1fb21d-8ecc-4a74-92a0-878c02dca04c","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `409 DUPLICATE_AUCTION`.

### Test 5 — Starting Price of Zero

I changed the starting price to `0` and kept the other input valid.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"5b1fb21d-8ecc-4a74-92a0-878c02dca04c","visibility":"PUBLIC","startingPrice":0,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 6 — Minimum Increment of Zero

I used a valid starting price and changed the minimum increment to `0`.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"5b1fb21d-8ecc-4a74-92a0-878c02dca04c","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":0,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 7 — End Time Before Start Time

I set the end time before the start time to check that the incorrect date order was rejected.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"5b1fb21d-8ecc-4a74-92a0-878c02dca04c","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T18:57:36.989Z"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 8 — Another Account's Listing

I tried to create an auction for `Approved Car` using the regular user's token. The listing was approved, but it belonged to the admin account.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"f246f53d-9bdb-4df1-8728-92da13f7bd4a","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `403 NOT_APPROVED`.

### Test 9 — Rejected Listing Using Its Owner's Account

I tried to create an auction for `Test Car 2` using the admin token. This account owned the listing, but its status was `REJECTED`.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"15561c6e-6da2-4ee4-9056-ebef2ce1f960","visibility":"PUBLIC","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `403 NOT_APPROVED`.

### Test 10 — Create a Private Auction

I created a private auction for the approved `Approved Car` listing using its owner's token.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"adb89561-ad3b-4e3a-a96a-ad4d0f871c82","visibility":"PRIVATE","startingPrice":1000,"minimumIncrement":100,"startTime":"2026-11-10T19:27:36.849Z","endTime":"2026-11-10T20:27:36.851Z"}'
```

**Result:** The backend returned `201`. The response showed `visibility=PRIVATE code length=24`.

### Test 11 — Check the Stored Access Code Hash

I read the auction's visibility and access code hash from the `auctions` table to check the stored data after private auction creation.

I used the following query in the temporary database.

```sql
SELECT visibility, access_code_hash
FROM auctions
WHERE id = '<PRIVATE_AUCTION_ID>';
```

**Result:** PostgreSQL returned visibility `PRIVATE` and a bcrypt hash.

## Testing Result

All 11 cases matched their expected results.
