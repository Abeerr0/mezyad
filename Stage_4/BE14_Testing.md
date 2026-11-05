# BE-14 — Bank Commitment with Moyasar Testing Report

**Team member:** Ghadi
**Task code:** BE-14
**Testing dates:** 4–5 November 2026
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

I tested the bank commitment manually using `curl` commands in the VS Code terminal.

PostgreSQL was running through Docker, and the backend was running locally on port `3000`. I enabled `REQUIRE_BANK_COMMITMENT=true` and used Moyasar test keys.

Before testing the cases, I checked that `/health` returned `200 OK` with `status: ok`. I also checked the connection to Moyasar using the test secret key, and the request returned `HTTP 200`.

I created a test item and auction to test the bank commitment using Moyasar.

I created Moyasar payments from the terminal using the test cards published in Moyasar’s documentation. I changed the amount, auction ID, and user ID to match each case.

I used `manual: true` to request a hold without capturing the amount. When Moyasar returned `initiated`, I opened the URL in `source.transaction_url` and completed the test authentication page in the browser.

I used `http://localhost:3000/health` as a temporary return URL after authentication. I did not use the return URL alone as proof that a commitment was accepted. I sent the payment ID to the backend, which checked its details with Moyasar.

For each case, I compared the HTTP status, error code, and saved data with the expected result.

Tokens, keys, and login details are omitted from this report. Placeholders such as `<BIDDER_1_TOKEN>` represent the actual session tokens used during testing.

### Payment Creation Request

I used the following command to request a SAR 2,000 test hold from Moyasar. I then completed authentication using the URL returned by Moyasar and sent the payment ID to the Mezyad backend to verify the payment and register the commitment. I used the same request structure for the other cases, changing the amount, card, or auction and user details.
```bash
curl -i --max-time 30 -X POST https://api.moyasar.com/v1/payments \
  -u "$moyasar_public_key:" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200000,
    "currency": "SAR",
    "callback_url": "http://localhost:3000/health",
    "metadata": {
      "auction_id": "8c22af77-7022-4cd0-8de5-9f4b02db79a1",
      "user_id": "90ac0e14-2879-4690-a878-a1be3adfcd38"
    },
    "source": {
      "type": "creditcard",
      "name": "Email Test",
      "number": "4201320111111010",
      "month": 12,
      "year": 2030,
      "cvc": "123",
      "manual": true
    }
  }'
```

Moyasar amounts are sent in halalas, so `200000` represents SAR 2,000.

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
curl -i -X POST http://localhost:3000/auctions/00000000-0000-4000-8000-000000000001/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{"paymentId":"invalid"}'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT`.

### Test 2 — Missing Moyasar Key

I started a temporary backend instance on port `3001` without a Moyasar key to test the response when the key was unavailable.

```bash
MOYASAR_SECRET_KEY= PORT=3001 npm --prefix backend run dev
```

I then sent the commitment request:

```bash
curl -i -X POST http://localhost:3001/auctions/cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{"paymentId":"00000000-0000-4000-8000-000000000001"}'
```

**Result:** The backend returned `503 Service Unavailable` with the error code `BANK_SANDBOX_UNAVAILABLE` and the message `Moyasar test key is not configured`.

I stopped the temporary instance after this test and continued testing on port `3000`.

### Test 3 — Bid Without a Verified Commitment

Before saving a successful commitment for the first bidder in the test auction, I submitted a bid of SAR 1,000.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{
    "amount": 1000,
    "requestId": "7083722b-6b64-4ca7-87a1-e22f0361ac38"
  }'
```

**Result:** The backend rejected the bid and returned `403 Forbidden` with the error code `COMMITMENT_REQUIRED`.

### Test 4 — Insufficient Funds

I created a SAR 1,000 payment using the test card `4201320000311101`, which simulates insufficient funds. After authentication, the returned result showed `failed` with the message `INSUFFICIENT FUNDS`.

I submitted the payment ID to the backend:

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{"paymentId":"880deafd-69b6-40e3-acf0-2578b728cf87"}'
```

**Result:** The backend returned `409 Conflict` with the error code `COMMITMENT_DECLINED`.

I checked the database record:

```bash
docker compose exec -T db psql -U postgres -d mezyad -c "
SELECT status, sandbox_reference
FROM bid_commitments
WHERE auction_id = '8c22af77-7022-4cd0-8de5-9f4b02db79a1'
  AND user_id = '90ac0e14-2879-4690-a878-a1be3adfcd38';"
```

The saved status was `FAILED`, and the payment reference was `880deafd-69b6-40e3-acf0-2578b728cf87`.

### Test 5 — Hold Below the Required Minimum

I created an authorized hold of SAR 500 in Moyasar, while the auction’s starting price was SAR 1,000.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{"paymentId":"7ce6d7da-800d-48be-8c86-3c02961a8c94"}'
```

**Result:** The backend rejected the commitment and returned `409 Conflict` with the error code `COMMITMENT_TOO_LOW`.

I fetched the payment from Moyasar:

```bash
curl -i --max-time 10 \
  -u "$moyasar_test_key:" \
  https://api.moyasar.com/v1/payments/7ce6d7da-800d-48be-8c86-3c02961a8c94
```

Moyasar returned `200 OK` with payment status `voided`, confirming that the hold was released after the commitment was rejected.

### Test 6 — Accept a Valid Hold

I created a SAR 2,000 hold using the approved test card and linked it to the auction and the first bidder. After authentication, I submitted the payment ID to the backend.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{"paymentId":"ee7cf3cd-8978-4d3f-8296-e3c3313709a7"}'
```

**Result:** The backend accepted the commitment and returned `201 Created`. The response included:

```json
{
  "status": "SUCCESS",
  "sandbox_reference": "ee7cf3cd-8978-4d3f-8296-e3c3313709a7",
  "max_amount": "2000.00",
  "released_at": null
}
```

I checked the saved data:

```bash
docker compose exec -T db psql -U postgres -d mezyad -c "
SELECT status, max_amount, sandbox_reference, released_at
FROM bid_commitments
WHERE auction_id = '8c22af77-7022-4cd0-8de5-9f4b02db79a1'
  AND user_id = '90ac0e14-2879-4690-a878-a1be3adfcd38';"
```

The database matched the response: status `SUCCESS`, amount `2000.00`, the same payment reference, and a null `released_at`.

### Test 7 — Bid Above and Within the Held Amount

I submitted a bid of SAR 2,100, which exceeded the SAR 2,000 hold.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{
    "amount": 2100,
    "requestId": "c435e6af-6b5b-4c48-9359-7ce5a4a6a634"
  }'
```

**Result:** The backend rejected the bid and returned `409 Conflict` with the error code `BID_ABOVE_COMMITMENT`.

I then submitted a bid of SAR 1,000, which was within the held amount and matched the starting price.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{
    "amount": 1000,
    "requestId": "4a0e6049-297c-4e45-b5f5-289f9010dd8e"
  }'
```

**Result:** The backend accepted the bid and returned `201 Created` with `amount: 1000` and `currentPrice: 1000`.

### Test 8 — Payment Belonging to Another Account

I used another account’s session token with the first bidder’s payment ID to test user matching.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <OTHER_ACCOUNT_TOKEN>" \
  -d '{"paymentId":"ee7cf3cd-8978-4d3f-8296-e3c3313709a7"}'
```

**Result:** The backend rejected the request and returned `403 Forbidden` with the error code `PAYMENT_MISMATCH`.

### Test 9 — Commitment for an Ended Auction

I created a SAR 1,000 hold linked to the ended auction `cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0`.

After authentication, I submitted the commitment request:

```bash
curl -i -X POST http://localhost:3000/auctions/cb7a57cf-0d6d-4bd1-8ede-194d00a0d1b0/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_1_TOKEN>" \
  -d '{"paymentId":"a2694e30-e7af-498d-85f3-6d25cf4b6c26"}'
```

**Result:** The backend returned `409 Conflict` with the error code `AUCTION_NOT_ACTIVE`.

I checked the payment with Moyasar:

```bash
curl -i --max-time 10 \
  -u "$moyasar_test_key:" \
  https://api.moyasar.com/v1/payments/a2694e30-e7af-498d-85f3-6d25cf4b6c26
```

The payment status was `voided`, confirming that the hold was released after the commitment for the ended auction was rejected.

### Test 10 — Close the Auction and Release the Losing Bidder’s Hold

I prepared a valid SAR 2,000 hold for the second bidder, using their ID `ab3bc7d6-0333-4112-8bb1-5d5b07a084ab` in the payment metadata.

I registered the commitment:

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/commitment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_2_TOKEN>" \
  -d '{"paymentId":"bb44b616-505a-4547-8ac1-d4ccd6a25232"}'
```

The backend returned `201 Created` with status `SUCCESS` and amount `2000.00`.

I then submitted a SAR 1,100 bid from the second bidder, making it higher than the first bidder’s SAR 1,000 bid.

```bash
curl -i -X POST http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BIDDER_2_TOKEN>" \
  -d '{
    "amount": 1100,
    "requestId": "df92290c-6b6e-414a-a1e7-392da0b36a63"
  }'
```

The backend returned `201 Created` with `currentPrice: 1100`.

To test closing without waiting, I changed the test auction’s end time to the past:

```bash
docker compose exec -T db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 -c "
UPDATE auctions
SET end_time = now() - interval '1 minute'
WHERE id = '8c22af77-7022-4cd0-8de5-9f4b02db79a1'
RETURNING id, end_time;"
```

I then used `curl` in the terminal to send a `GET` request to the auction details endpoint in the Mezyad backend on port `3000`. This endpoint checks the auction’s end time. Since the end time was now in the past, the backend closed the auction and recorded the winner.

```bash
curl -i http://localhost:3000/auctions/8c22af77-7022-4cd0-8de5-9f4b02db79a1 \
  -H "Authorization: Bearer <BIDDER_2_TOKEN>"
```

**Result:** The backend returned `200 OK`, and the auction status was `CLOSED`. The winning amount was `1100.00`, and `isWinner: true` was returned for the second bidder.

I fetched both payments from Moyasar:

```bash
curl -i --max-time 10 \
  -u "$moyasar_test_key:" \
  https://api.moyasar.com/v1/payments/ee7cf3cd-8978-4d3f-8296-e3c3313709a7
```

```bash
curl -i --max-time 10 \
  -u "$moyasar_test_key:" \
  https://api.moyasar.com/v1/payments/bb44b616-505a-4547-8ac1-d4ccd6a25232
```

I then checked the database:

```bash
docker compose exec -T db psql -U postgres -d mezyad -c "
SELECT sandbox_reference, released_at
FROM bid_commitments
WHERE auction_id = '8c22af77-7022-4cd0-8de5-9f4b02db79a1';"
```

| Bidder | Moyasar payment status | Database `released_at` |
|---|---|---|
| First bidder — losing bidder | `voided` | `2026-11-04 22:24:55.57046+00` |
| Second bidder — winner | `authorized` | `NULL` |

The results confirmed that the losing bidder’s hold was released and its release time was saved, while the winner’s hold remained authorized.

## Testing Result

All ten documented test cases matched the expected results.

The backend accepted a valid commitment and rejected invalid input, a declined payment, an insufficient hold amount, another account’s payment, and a commitment for an ended auction.

It also rejected a bid without a verified commitment and a bid above the held amount, while accepting a bid that met the tested conditions.

After the auction closed, the losing bidder’s hold was voided in Moyasar and its release time was saved in the database. The winner’s hold remained `authorized`.

Testing used Moyasar test mode and test cards. Capturing the winner’s payment was not performed as part of these tests.

## References

- [Moyasar — Create Payment](https://docs.moyasar.com/api/payments/01-create-payment)
- [Moyasar — Test Cards](https://docs.moyasar.com/guides/card-payments/test-cards)