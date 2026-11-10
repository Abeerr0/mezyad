# BE-04 – Testing Bid Acceptance Rules

**Team member:** Ghadi Alzhrani  
**Week:** 4  
**Report date:** October 31, 2026  
**Retest date:** 10 November 2026  
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

I sent bid requests from the terminal.

I used the auction owner, a bidder with access, and a bidder without access. The private auction started at 1,000 SAR with a 100 SAR minimum increase. For tests 5–9, I registered a 2,000 SAR Moyasar Sandbox hold before the bid checks.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Test Cases and Commands

### Test 1 – Owner bids on their own auction

I used the auction owner’s account to submit a bid of `1000` SAR on their own auction.

```bash
curl -i -X POST 'http://127.0.0.1:52197/api/v1/auctions/2c75da98-2c1b-495d-bac4-b1fee9cdf77b/bids' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"3e99f673-3900-4300-b38c-141bd2421fd8"}'
```

**Result:** The backend returned `403 OWNER`.

### Test 2 – User bids on a private auction without access

I submitted a bid of `1100` SAR from a signed-in account that did not have access to this private auction.

```bash
curl -i -X POST 'http://127.0.0.1:52197/api/v1/auctions/2c75da98-2c1b-495d-bac4-b1fee9cdf77b/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"19d5dd79-91c4-40b5-b403-699b8f9822d8"}'
```

**Result:** The backend returned `404 NOT_FOUND`.

### Test 3 – User sends a duplicate bid request

I prepared a test bid with a known request ID. I then sent a bid request using the same ID to check whether a second bid would be recorded.

```bash
curl -i -X POST 'http://127.0.0.1:52197/api/v1/auctions/2c75da98-2c1b-495d-bac4-b1fee9cdf77b/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"2257abff-2bed-4af3-b15a-3083532c78d6"}'
```

**Result:** The backend returned `409 DUPLICATE_REQUEST`.

**Result:** The backend returned `1`.

### Test 4 – User sends a bid amount without a request ID

I sent a bid of `1100` SAR and left out `requestId`. This ID identifies a bid attempt so the backend can recognize the same request if it is sent again.

```bash
curl -i -X POST 'http://127.0.0.1:52197/api/v1/auctions/2c75da98-2c1b-495d-bac4-b1fee9cdf77b/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 5 – User bids before the auction starts

I selected an auction with the status `SCHEDULED` and submitted a bid of `1100` SAR before its start time.

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

I registered the Sandbox hold for this auction before submitting the bid.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/beabfdcd-e89c-4f04-9602-21cd12789a7e/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"f1c38765-3670-409f-b321-4f20655459d3"}'
```

**Result:** The backend returned `201`. The response showed `status=SUCCESS max_amount=2000.00`.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/beabfdcd-e89c-4f04-9602-21cd12789a7e/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"6c98abb1-1927-4a9f-998f-f50b84b0b2f6"}'
```

**Result:** The backend returned `409 AUCTION_NOT_ACTIVE`.

### Test 6 – User bids after the auction ends

I selected an auction with the status `CLOSED` and submitted a bid of `1100` SAR.

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

I registered the Sandbox hold for this auction before submitting the bid.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/aa28cb45-b299-445c-93dc-a87e83fafa6f/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"f021bb3d-737e-455b-94dc-679eac5dc660"}'
```

**Result:** The backend returned `201`. The response showed `status=SUCCESS max_amount=2000.00`.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/aa28cb45-b299-445c-93dc-a87e83fafa6f/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"fed1a863-5622-4da0-a623-e42481656259"}'
```

**Result:** The backend returned `409 AUCTION_NOT_ACTIVE`.

### Test 7 – First bid is below the starting price

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

I registered the Sandbox hold for this auction before submitting the bid.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/ac58638f-18d8-4e73-8c8d-d833c1d919e2/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"ba2857c0-a5ed-46e4-b2bb-0743b195a7b3"}'
```

**Result:** The backend returned `201`. The response showed `status=SUCCESS max_amount=2000.00`.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/ac58638f-18d8-4e73-8c8d-d833c1d919e2/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":900,"requestId":"4fa5a676-521c-488c-844e-4409671cb560"}'
```

**Result:** The backend returned `409 BID_TOO_LOW`.

### Test 8 – First bid equals the starting price

I used a bidder account with access to the private auction and submitted a bid of `1000` SAR, which matched the starting price.

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/ac58638f-18d8-4e73-8c8d-d833c1d919e2/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"fc37c70a-44ed-4f73-8ff4-45ea749e614d"}'
```

**Result:** The backend returned `201`. The response showed `amount=1000`.

### Test 9 – Increase over the previous bid is too small

```bash
curl -i -X POST 'http://127.0.0.1:51963/api/v1/auctions/ac58638f-18d8-4e73-8c8d-d833c1d919e2/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1050,"requestId":"4de8f4c9-6428-471a-953e-0e65122b5aad"}'
```

**Result:** The backend returned `409 BID_TOO_LOW`.

**Result:** PostgreSQL returned `1/1000.00`.

## Testing Result

All 9 cases matched their expected results. Only the accepted 1,000 SAR bid was stored.
