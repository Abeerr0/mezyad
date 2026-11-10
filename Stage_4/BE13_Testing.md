# BE-13 – Testing Private Auction Access Codes

**Team member:** Ghadi Alzhrani  
**Week:** 4  
**Report date:** October 31, 2026  
**Retest date:** 10 November 2026  
**Testing method:** Manual API testing with `curl` in the terminal.

## Goal

I tested whether the backend grants access to a private auction when a bidder sends the correct code and rejects the request when the code is incorrect.

## Test Results Summary

| Test | Expected result | Actual result | Status |
|---|---|---|---|
| 1. Send the correct access code | Grant access to the bidder | `200` with `accessGranted: true` | Passed |
| 2. Send an incorrect access code | Reject the code | `403 INVALID_CODE` | Passed |

## Testing Method and Existing Data

I used a private auction's generated access code with one bidder and a different code with the other bidder.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Test Cases and Commands

### Test 1 – Send the correct access code

I sent the private auction’s access code from the bidder’s account.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions/access' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"accessCode":"<PRIVATE_AUCTION_CODE>"}'
```

**Result:** The backend returned `200`. The response showed `accessGranted=true`.

### Test 2 – Send an incorrect access code

I sent a code made up of 24 zeros. I chose a code with the correct length to check whether the backend would still reject it.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auctions/access' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"accessCode":"000000000000000000000000"}'
```

**Result:** The backend returned `403 INVALID_CODE`.

## Testing Result

All 2 cases matched their expected results.
