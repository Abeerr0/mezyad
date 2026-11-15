# BE-14 — Bank Commitment with Moyasar Testing Report

**Team member:** Ghadi
**Task code:** BE-14
**Testing dates:** 4–5 November 2026
**Retest date:** 15 November 2026
**Testing method:** Manual testing using the terminal, curl, PostgreSQL through Docker, and Moyasar test mode.

## Goal

Test verification of a Moyasar hold before accepting a bid, check that invalid commitments and bids above the held amount are rejected, and confirm that closing an auction releases the losing bidder’s hold while keeping the winner’s hold.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Invalid payment ID format | Reject the request | `400 INVALID_INPUT` | Passed |
| Commitment request without a configured Moyasar key | Reject the request because the service is unavailable | `503 BANK_SANDBOX_UNAVAILABLE` | Passed |
| Bid without a verified commitment | Reject the bid | `403 COMMITMENT_REQUIRED` | Passed |
| Test card simulating insufficient funds | Reject the commitment and save it as failed | `409 COMMITMENT_DECLINED` and database status `FAILED` | Passed |
| Hold below the required minimum | Reject the commitment and release the hold | `409 COMMITMENT_TOO_LOW` and Moyasar status `voided` | Passed |
| Valid hold of SAR 2,000 | Accept the commitment and save the held amount | `201 Created`, status `SUCCESS`, and `max_amount: 2000.00` | Passed |
| Bid above the hold, followed by a bid within it | Reject the higher bid and accept the bid within the hold | `409 BID_ABOVE_COMMITMENT`, followed by `201 Created` | Passed |
| Payment belonging to another account | Reject the request | `403 PAYMENT_MISMATCH` | Passed |
| Commitment for an ended auction | Reject the commitment and release the hold | `409 AUCTION_NOT_ACTIVE` and Moyasar status `voided` | Passed |
| Close the auction and check both holds | Release the losing bidder’s hold and keep the winner’s hold | Losing hold `voided`, winning hold `authorized`, with matching database release records | Passed |

## Testing Method

I tested the bank commitment using `curl` commands in the VS Code terminal.

I used Moyasar Sandbox test cards for approval and insufficient funds. The holds used 500, 1,000, and 2,000 SAR as applicable. I completed the Sandbox authentication page and checked the status through Moyasar and the saved commitment through the backend.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

I checked the backend health at `/api/v1/health` and the connection to Moyasar before running the cases. Both checks returned `200 OK`.

### Payment Creation Request

I requested a 2,000 SAR Sandbox hold using `manual: true`. I completed test authentication with the URL returned by Moyasar and sent the payment ID to Mezyad to verify the commitment.

```bash
curl -i -X POST 'https://api.moyasar.com/v1/payments' \
  -u "$MOYASAR_SECRET_KEY:" \
  -H 'Content-Type: application/json' \
  -d '{
    "given_id": "<PAYMENT_UUID>",
    "amount": 200000,
    "currency": "SAR",
    "description": "Mezyad QA sandbox authorization",
    "callback_url": "http://127.0.0.1:49692/api/v1/health",
    "metadata": {"auction_id": "<AUCTION_ID>", "user_id": "<USER_ID>"},
    "source": {
      "type": "creditcard",
      "name": "Mezyad Test",
      "number": "<OFFICIAL_TEST_CARD>",
      "month": 12,
      "year": 2030,
      "cvc": "<TEST_CVC>",
      "manual": true
    }
  }'
```

Moyasar amounts are sent in halalas, so `200000` represents 2,000 SAR.

| Purpose | Amount in halalas | Test card number |
|---|---:|---|
| Insufficient funds | 100000 | `4201320000311101` |
| Hold below the required minimum | 50000 | `4201320111111010` |
| Valid bidder hold | 200000 | `4201320111111010` |
| Hold for an ended auction | 100000 | `4201320111111010` |
| Second bidder’s hold | 200000 | `4201320111111010` |

## Test Cases and Commands

### Test 1 — Invalid Payment ID Format

I sent `invalid` instead of a valid payment ID to check input validation.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"invalid"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 2 — Missing Moyasar Key

I started a temporary backend instance on port `53540` without a Moyasar key to test the response when the key was unavailable.

```bash
curl -i -X POST 'http://127.0.0.1:53540/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"7ae3fcde-739f-4e3e-87fb-0df42331a970"}'
```

**Result:** The backend returned `503 BANK_SANDBOX_UNAVAILABLE`.

### Test 3 — Bid Without a Verified Commitment

Before saving a successful commitment for the first bidder in the test auction, I submitted a bid of SAR 1,000.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"36f0edf0-7055-46c7-8c5b-446eac5efea6"}'
```

**Result:** The backend returned `403 COMMITMENT_REQUIRED`.

### Test 4 — Insufficient Funds

I created a SAR 1,000 payment using the test card `4201320000311101`, which simulates insufficient funds. After authentication, the returned result showed `failed` with the message `INSUFFICIENT FUNDS`.

Moyasar returned `HTTP 200` with status `failed` after test authentication and message `INSUFFICIENT FUNDS`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"20261115-0014-4000-8000-000000000004"}'
```

**Result:** The backend returned `409 COMMITMENT_DECLINED`.

**Result:** PostgreSQL returned `FAILED`.

### Test 5 — Hold Below the Required Minimum

I created an authorized hold of SAR 500 in Moyasar, while the auction’s starting price was SAR 1,000.

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"20261115-0014-4000-8000-000000000005"}'
```

**Result:** The backend returned `409 COMMITMENT_TOO_LOW`.

**Result:** The backend returned `voided`. Verification: `HTTP 200 voided APPROVED`.

### Test 6 — Accept a Valid Hold

I created a SAR 2,000 hold using the approved test card and linked it to the auction and the first bidder. After authentication, I submitted the payment ID to the backend.

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"20261115-0014-4000-8000-000000000006"}'
```

**Result:** The backend returned `201`. The response showed `status=SUCCESS max_amount=2000.00`.

```json
{
  "data": {
    "id": "30329eba-98b0-43bc-aab3-19ea26ca15d5",
    "status": "SUCCESS",
    "sandbox_reference": "20261115-0014-4000-8000-000000000006",
    "max_amount": "2000.00",
    "released_at": null,
    "created_at": "2026-11-15T06:35:00.100Z"
  }
}
```

**Result:** PostgreSQL returned `SUCCESS/2000.00`.

### Test 7 — Bid Above and Within the Held Amount

I submitted a bid of SAR 2,100, which exceeded the SAR 2,000 hold.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":2100,"requestId":"bf4f6bc3-4e03-40e1-9e18-6d9a1d9f25b2"}'
```

**Result:** The backend returned `409 BID_ABOVE_COMMITMENT`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"abdc43ac-0e3d-4fb0-bdf0-f0c60b2dc5f2"}'
```

**Result:** The backend returned `201`. The response showed `amount=1000`.

### Test 8 — Payment Belonging to Another Account

I used another account’s JWT with the first bidder’s payment ID to test user matching.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"20261115-0014-4000-8000-000000000006"}'
```

**Result:** The backend returned `403 PAYMENT_MISMATCH`.

### Test 9 — Commitment for an Ended Auction

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/823afd60-51b6-4d0c-9fa8-48be7453f3a0/commitment' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"20261115-0014-4000-8000-000000000009"}'
```

**Result:** The backend returned `409 AUCTION_NOT_ACTIVE`.

**Result:** The backend returned `voided`. Verification: `HTTP 200 voided APPROVED`.

### Test 10 — Close the Auction and Release the Losing Bidder’s Hold

Moyasar returned `HTTP 200` with status `authorized` after test authentication and message `APPROVED`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/commitment' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"20261115-0014-4000-8000-000000000010"}'
```

**Result:** The backend returned `201`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"9e15e277-3d90-4398-88eb-a1a02dafa232"}'
```

**Result:** The backend returned `201`.

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/auctions/0f8d74e6-c764-4535-9f4f-f55a75a06996' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>'
```

**Result:** The backend returned `200`. The response showed `status=CLOSED winning_amount=1100.00 isWinner=true`.

**Result:** The backend returned `voided/authorized`. Verification: `PostgreSQL released loser=true winner still held=true`.

## Testing Result

All 10 cases matched their expected results. The Sandbox run completed 20 checks. The losing bidder's hold was released at closure, and the winning hold stayed authorized.

## References

- [Moyasar — Create Payment](https://docs.moyasar.com/api/payments/01-create-payment)
- [Moyasar — Test Cards](https://docs.moyasar.com/guides/card-payments/test-cards)
