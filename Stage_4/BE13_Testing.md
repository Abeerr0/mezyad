# BE-13 – Testing Private Auction Access Codes

**Team member:** Ghadi Alzhrani  
**Week:** 4  
**Report date:** October 31, 2026  
**Testing method:** Manual API testing with `curl` in the terminal.

## Goal

I tested whether the backend grants access to a private auction when a bidder sends the correct code and rejects the request when the code is incorrect.

## Test Results Summary

| Test | Expected result | Actual result | Status |
|---|---|---|---|
| 1. Send the correct access code | Grant access to the bidder | `200` with `accessGranted: true` | Passed |
| 2. Send an incorrect access code | Reject the code | `403 INVALID_CODE` | Passed |

## Testing Method and Existing Data

I used the same bidder account for both tests. First, I sent the code I received when I created the private auction. Then, I sent an incorrect code.

## Test Cases and Commands

### Test 1 – Send the correct access code

I sent the private auction’s access code from the bidder’s account.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/api/v1/auctions/access' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"accessCode\":\"$MAIN_CODE\"}"
```

**Result:** The backend returned `HTTP 200` with `accessGranted: true`, confirming that the bidder could access the auction.

### Test 2 – Send an incorrect access code

I sent a code made up of 24 zeros. I chose a code with the correct length to check whether the backend would still reject it.

```bash
curl -sS -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/api/v1/auctions/access' \
  -H "Authorization: Bearer $BIDDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"accessCode":"000000000000000000000000"}'
```

**Result:** The backend rejected the code and returned `403 INVALID_CODE` with the message `Invalid access code`.

## Testing Result

Both tests passed. The backend granted access with the correct code and rejected the incorrect code.