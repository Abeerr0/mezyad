# BE-04 – Testing Bid Acceptance Rules

**Team member:** Ghadi Alzhrani  
**Week:** 4  
**Report date:** October 31, 2026  
**Testing method:** Manual API testing with `curl` in the terminal.

## Goal

I tested when the backend accepts or rejects a bid. The cases covered who can bid, duplicate and incomplete requests, auction timing, the starting price for the first bid, and the minimum increase for the next bid.

## Test Results Summary

| Test | Expected result | Actual result | Status |
|---|---|---|---|
| 1. Owner bids on their own auction | Reject the bid | `403 OWNER` | Passed |
| 2. User bids on a private auction without access | Return “Auction not found” | `404 NOT_FOUND` | Passed |
| 3. User sends a duplicate bid request | Reject the request and keep one bid with that request ID | `409 DUPLICATE_REQUEST`, one bid recorded | Passed |
| 4. User sends a bid amount without a request ID | Reject the incomplete request | `400 INVALID_INPUT` | Passed |
| 5. User bids before the auction starts | Reject the bid | `409 AUCTION_NOT_ACTIVE` | Passed |
| 6. User bids after the auction ends | Reject the bid | `409 AUCTION_NOT_ACTIVE` | Passed |
| 7. First bid is below the starting price | Reject the bid of `900` SAR | `409 BID_TOO_LOW` | Passed |
| 8. First bid equals the starting price | Accept and record the bid of `1000` SAR | `201`, bid recorded | Passed |
| 9. Increase over the previous bid is too small | Reject the bid of `1050` SAR | `409 BID_TOO_LOW` | Passed |

## Testing Method and Existing Data

I sent bid requests from the terminal and compared each response with the expected result. I used the auction owner’s account, a bidder with access to the private auction, and a user without access. For the timing tests, I used one scheduled public auction and one closed public auction.

The private auction had a starting price of `1000` SAR and a minimum increase of `100` SAR. **The bank commitment check was disabled for Tests 5–9** so I could test auction timing, bid amounts, and bid acceptance without requiring a successful bank commitment.

## Test Cases and Commands

### Test 1 – Owner bids on their own auction

I used the auction owner’s account to submit a bid of `1000` SAR on their own auction.

```bash
curl -i -X POST 'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"00000000-0000-4000-8000-000000000001"}'
```

**Result:** The backend rejected the bid and returned `403 OWNER` with the message `Cannot bid on own auction`.

### Test 2 – User bids on a private auction without access

I submitted a bid of `1100` SAR from a signed-in account that did not have access to this private auction.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $TEST2_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"00000000-0000-4000-8000-000000000002"}'
```

**Result:** The backend returned `404 NOT_FOUND` with the message `Auction not found`. This keeps the private auction hidden from users without access.

### Test 3 – User sends a duplicate bid request

I prepared a test bid with a known request ID. I then sent a bid request using the same ID to check whether a second bid would be recorded.

```bash
curl -i 'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"00000000-0000-4000-8000-000000000003"}'
```

**Result:** The backend rejected the duplicate request and returned `409 DUPLICATE_REQUEST`. I confirmed that only one bid was recorded with that ID.

### Test 4 – User sends a bid amount without a request ID

I sent a bid of `1100` SAR and left out `requestId`. This ID identifies a bid attempt so the backend can recognize the same request if it is sent again.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $TEST2_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100}'
```

**Result:** The backend rejected the incomplete request and returned `400 INVALID_INPUT` with the message `Valid amount and UUID requestId required`.

### Test 5 – User bids before the auction starts

I selected an auction with the status `SCHEDULED` and submitted a bid of `1100` SAR before its start time.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/16545322-438b-4da8-9359-23832b681f0c/bids' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"00000000-0000-4000-8000-000000000005"}'
```

**Result:** The backend rejected the bid and returned `409 AUCTION_NOT_ACTIVE` because the auction had not started.

### Test 6 – User bids after the auction ends

I selected an auction with the status `CLOSED` and submitted a bid of `1100` SAR.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0/bids' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"00000000-0000-4000-8000-000000000006"}'
```

**Result:** The backend rejected the bid and returned `409 AUCTION_NOT_ACTIVE` because the auction had ended.

### Test 7 – First bid is below the starting price

The private auction had a starting price of `1000` SAR and no recorded bids at the time of this test. I submitted an opening bid of `900` SAR.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":900,"requestId":"00000000-0000-4000-8000-000000000007"}'
```

**Result:** The backend rejected the bid and returned `409 BID_TOO_LOW` because the amount was below the starting price.

### Test 8 – First bid equals the starting price

I used a bidder account with access to the private auction and submitted a bid of `1000` SAR, which matched the starting price.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"00000000-0000-4000-8000-000000000008"}'
```

**Result:** The backend returned `HTTP 201` and recorded the first bid at `1000` SAR.

### Test 9 – Increase over the previous bid is too small

After the first bid of `1000` SAR was accepted, the next bid had to be at least `1100` SAR because the auction’s minimum increase was `100` SAR. I submitted `1050` SAR, an increase of only `50` SAR.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/auctions/b8502413-3794-49cd-af2c-ccc07db599bd/bids' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1050,"requestId":"00000000-0000-4000-8000-000000000009"}'
```

**Result:** The backend rejected the bid and returned `409 BID_TOO_LOW`. The amount was higher than the previous bid, but the increase was below the required `100` SAR.

## Testing Result

All nine manual tests for `BE-04` passed. Testing bank commitment confirmation remains part of `BE-14`, pending access to the provider’s sandbox.