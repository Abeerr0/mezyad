# BE-11 — Auction Creation Testing Report

**Team member:** Ghadi

**Week:** 3 — Backend

**Task date:** 25 October 2026

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

During the initial local setup, after starting PostgreSQL in Docker, I ran the project's schema file using this command:

```bash
docker compose exec -T db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 < database/migrations/001_schema.sql
```

The command passed the SQL instructions from the file to the `mezyad` database. The output displayed `CREATE TABLE` messages, and the project tables were created, including `users`, `items`, and `auctions`.

This step prepared the tables needed to store account, listing, and auction data, allowing the backend to save and read data during testing.

The table definitions came from the SQL file, which I applied to the local database.

## Auction Table Used

I used the `auctions` table for this task.

It stores the linked listing, auction visibility, prices, start and end times, status, and the access code hash for private auctions.

During testing, I added a public auction and a private auction through the API. I then read the private auction's data from this table to check that its access code hash was stored.

## Testing Method

I tested the route manually using curl commands in the VS Code terminal.

PostgreSQL was running in Docker, and the backend was running locally on port `3000`. I kept the backend running and used another terminal to send requests to:

```text
http://localhost:3000/auctions
```

I used the user account `test@example.com` and the admin account `admin@example.com`.

I copied each account's token from `data.token` in its login response and placed it after `Bearer` in requests for that account.

I sent valid and invalid data, then compared the HTTP status and response body with the expected result for each case. When a request was expected to be rejected, receiving the correct rejection counted as a passed test.

I also ran the following JavaScript syntax check:

```bash
node --check backend/src/app.js
```

It finished without displaying errors.

## Test Data

I used listings prepared during the earlier tests:

- `Test Car`: an approved listing owned by the user account.
- `Test Car 2`: a rejected listing owned by the admin account.
- `Approved Car`: an approved listing owned by the admin account.

I used the admin account when testing its listings because it owned them.

Before testing ownership, I checked the ID, owner, and status of `Approved Car`:

```bash
docker compose exec db psql -U postgres -d mezyad -c "SELECT id, title, seller_id, status FROM items WHERE title = 'Approved Car';"
```

The query returned one row with this listing ID:

```text
963b65ce-246f-483c-bebf-c760a82532ff
```

Its status was `APPROVED`, and it belonged to the admin account.

## Test Cases and Commands

### Test 1 — Request Without a Token

I sent an auction creation request without a token to check that auction creation required a valid session.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `401 Unauthorized` with the error code `UNAUTHORIZED` and the message `Sign in required`.

### Test 2 — Empty Body With a Valid Token

I sent an empty JSON object with a valid user token to check that missing auction data was rejected.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `400 Bad Request` with `INVALID_INPUT` and the message `Invalid auction parameters`.

### Test 3 — Create a Public Auction

I sent valid auction data for the approved `Test Car` listing using its owner's token.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"4d5dc010-0fa4-48bd-bdff-810e1cc4703b",
    "visibility":"PUBLIC",
    "startingPrice":1000,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `201 Created`. The response showed:

- Visibility: `PUBLIC`.
- Starting price and current price: `1000.00`.
- Minimum increment: `100.00`.
- Status: `SCHEDULED`.
- The start and end times submitted in the request.

The response did not include `accessCode`.

### Test 4 — Duplicate Auction

I repeated the auction creation request for the same listing to check that another auction could not be created for it.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"4d5dc010-0fa4-48bd-bdff-810e1cc4703b",
    "visibility":"PUBLIC",
    "startingPrice":1000,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `409 Conflict` with `DUPLICATE_AUCTION` and this message:

```text
Item already has auction
```

### Test 5 — Starting Price of Zero

I changed the starting price to `0` and kept the other input valid.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"4d5dc010-0fa4-48bd-bdff-810e1cc4703b",
    "visibility":"PUBLIC",
    "startingPrice":0,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `400 Bad Request` with `INVALID_INPUT`. A starting price of zero was rejected.

### Test 6 — Minimum Increment of Zero

I used a valid starting price and changed the minimum increment to `0`.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"4d5dc010-0fa4-48bd-bdff-810e1cc4703b",
    "visibility":"PUBLIC",
    "startingPrice":1000,
    "minimumIncrement":0,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `400 Bad Request` with `INVALID_INPUT`. A minimum increment of zero was rejected.

### Test 7 — End Time Before Start Time

I set the end time before the start time to check that the incorrect date order was rejected.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"4d5dc010-0fa4-48bd-bdff-810e1cc4703b",
    "visibility":"PUBLIC",
    "startingPrice":1000,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-01T09:00:00Z"
  }'
```

**Result:** The backend returned `400 Bad Request` with `INVALID_INPUT`.

### Test 8 — Another Account's Listing

I tried to create an auction for `Approved Car` using the regular user's token. The listing was approved, but it belonged to the admin account.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"963b65ce-246f-483c-bebf-c760a82532ff",
    "visibility":"PUBLIC",
    "startingPrice":1000,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `403 Forbidden` with `NOT_APPROVED` and this message:

```text
Only approved owned items can be auctioned
```

The request was rejected because the account sending it did not own the listing.

### Test 9 — Rejected Listing Using Its Owner's Account

I tried to create an auction for `Test Car 2` using the admin token. This account owned the listing, but its status was `REJECTED`.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"24a8b097-4ef2-4b17-b362-572fcf496539",
    "visibility":"PUBLIC",
    "startingPrice":1000,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `403 Forbidden` with `NOT_APPROVED` and this message:

```text
Only approved owned items can be auctioned
```

The request was rejected because the listing was not approved, even though its owner sent the request.

### Test 10 — Create a Private Auction

I created a private auction for the approved `Approved Car` listing using its owner's token.

```bash
curl -i -X POST http://localhost:3000/auctions \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "itemId":"963b65ce-246f-483c-bebf-c760a82532ff",
    "visibility":"PRIVATE",
    "startingPrice":1000,
    "minimumIncrement":100,
    "startTime":"2026-11-01T10:00:00Z",
    "endTime":"2026-11-02T10:00:00Z"
  }'
```

**Result:** The backend returned `201 Created`. The auction had visibility `PRIVATE` and status `SCHEDULED`. The response included an access code in `accessCode`.

Both the starting price and current price were `1000.00`, and the minimum increment was `100.00`.

The new auction ID was:

```text
90efaa52-d751-4ad6-8ad5-7cd676e55335
```

### Test 11 — Check the Stored Access Code Hash

I read the auction's visibility and access code hash from the `auctions` table to check the stored data after private auction creation.

```bash
docker compose exec -T db psql -U postgres -d mezyad -c "SELECT visibility, access_code_hash FROM auctions WHERE id = '90efaa52-d751-4ad6-8ad5-7cd676e55335';"
```

**Result:** The query returned one row with visibility `PRIVATE`. The `access_code_hash` field contained a bcrypt hash beginning with `$2a$12$`. Its value was different from the original access code returned when the auction was created.

## Testing Result

All eleven documented test cases matched the expected results.

Public and private auctions were created successfully for approved listings using their owners' accounts.

Invalid input, rejected listings, and attempts to use another account's listing were rejected.

Duplicate auctions for the same listing were prevented. Private auction creation returned an access code, and its hash was stored in the database.