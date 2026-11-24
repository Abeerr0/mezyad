# BE-15 — Auction Closure and Results Testing Report

**Team member:** Ghadi

**Report date:** 13 November 2026

**Testing method:** Manual testing using the terminal, curl, and PostgreSQL queries.

## Goal

Check that public and private auctions close when their end time is reached, reject later bids and return the correct winner or no winner. Also check repeated and concurrent closure requests.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Active auction stays open | `ACTIVE/null` | `ACTIVE/null` | Passed |
| First bid accepted | `201` | `201` | Passed |
| Higher bid from second account | `201` | `201` | Passed |
| Late bid before any detail visit | `409 AUCTION_NOT_ACTIVE` | `409 AUCTION_NOT_ACTIVE` | Passed |
| Late bid changes no data | `1100.00/2/0` | `1100.00/2/0` | Passed |
| Concurrent close returns stable winner | Return the same winner in all six responses | All six responses matched | Passed |
| One persisted result | `1` | `1` | Passed |
| Repeated close keeps same result | Keep the saved winner, closing time and amount | The result matched the previous response | Passed |
| Winner true and loser false | `true/false` | `true/false` | Passed |
| Closed auction rejects new bid | `409 AUCTION_NOT_ACTIVE` | `409 AUCTION_NOT_ACTIVE` | Passed |
| Moyasar losing hold released winner retained | `voided/authorized` | `voided/authorized` | Passed |
| No bids closes without winner | `CLOSED/null` | `CLOSED/null` | Passed |
| No-bid result stored once | `1` | `1` | Passed |
| Failed closure rolls back | `ACTIVE/0` | `ACTIVE/0` | Passed |
| Closure retries after rollback | `CLOSED/1` | `CLOSED/1` | Passed |
| Private first bid | `201` | `201` | Passed |
| Private second bidder higher bid | `201` | `201` | Passed |
| Private winner and loser results | Return the highest bidder as winner with account-specific flags | Bidder 2 won and bidder 1 lost | Passed |
| Private closure stored once | `1` | `1` | Passed |
| Private losing hold released | `voided` | `voided` | Passed |
| Queued bid rechecks time after row lock | `409 AUCTION_NOT_ACTIVE` | `409 AUCTION_NOT_ACTIVE` | Passed |
| Queued late bid cannot become winner | Return no winner after rejecting the only bid | No winner was returned | Passed |
| Queued race preserves price and bids | `{"status":"CLOSED","current_price":"1000.00","bids":0,"results":1}` | `{"status":"CLOSED","current_price":"1000.00","bids":0,"results":1}` | Passed |
| Bid validated before deadline commits before closure | `201` | `201` | Passed |
| Waiting closure chooses accepted bid | Choose the bid accepted before the deadline | The accepted bid was returned as winner | Passed |
| Accepted race stores one bid and result | `{"status":"CLOSED","current_price":"1100.00","bids":1,"results":1}` | `{"status":"CLOSED","current_price":"1100.00","bids":1,"results":1}` | Passed |

## Testing Method

I tested the routes using curl commands in the VS Code terminal.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

I used `ghadi0alzhrani@gmail.com`, `bidder1mezyad@gmail.com` and `bidder2mezyad@gmail.com`. The auctions used a 1,000 SAR starting price and a 100 SAR minimum increase. Before bidding, I verified each 2,000 SAR Moyasar Sandbox authorization through the backend commitment route.

I used PostgreSQL queries to control the auction end time and check the saved results.

## Test Cases and Commands

### Test 1 — Active auction stays open

I requested an auction before its end time.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000001",
    "item_id": "20261115-0015-4000-b000-000000000001",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T13:31:39.342Z",
    "status": "ACTIVE",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Test Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": null,
    "participation": {
      "bidCount": 0,
      "highestBid": null,
      "latestBidId": null,
      "hasBid": false
    }
  }
}
```

### Test 2 — First bid accepted

I submitted a 1,000 SAR bid from the first bidder.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"bb62623b-3329-480f-8a98-2034fbed6ed9"}'
```

**Result:** The backend returned `201`.

```json
{
  "data": {
    "bidId": "02c81bfd-e597-45a0-a695-60e834627bb1",
    "amount": 1000,
    "currentPrice": 1000
  }
}
```

### Test 3 — Higher bid from second account

I submitted a 1,100 SAR bid from the second bidder.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"a6e2cb15-a4eb-4db6-a2af-a77fc2aae74c"}'
```

**Result:** The backend returned `201`.

```json
{
  "data": {
    "bidId": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
    "amount": 1100,
    "currentPrice": 1100
  }
}
```

### Test 4 — Late bid before any detail visit

I set the auction end time in the past and submitted another bid before requesting its details.

```sql
UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id='20261115-0015-4000-a000-000000000001';
```

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1200,"requestId":"54ffc918-daeb-49d8-98e8-cdd1552c2128"}'
```

**Result:** The backend returned `409 AUCTION_NOT_ACTIVE`.

```json
{
  "error": {
    "code": "AUCTION_NOT_ACTIVE",
    "message": "Auction not active"
  }
}
```

### Test 5 — Late bid changes no data

I read the stored price, bid count and result count after the late bid was rejected.

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000001';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "ACTIVE",
    "current_price": "1100.00",
    "bids": 2,
    "results": 0
  }
]
```

### Test 6 — Concurrent close returns stable winner

I sent six concurrent detail requests after the end time to check that they returned the same winner and result.

All six requests returned `200` with the following response.

```bash
for attempt in 1 2 3 4 5 6; do
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' &
done
wait
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000001",
    "item_id": "20261115-0015-4000-b000-000000000001",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T07:41:36.924Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Test Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "closed_at": "2026-11-15T07:42:05.801Z",
      "winning_amount": "1100.00",
      "isWinner": true
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1100.00",
      "latestBidId": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "hasBid": true
    }
  }
}
```

### Test 7 — One persisted result

I counted the saved result rows after the concurrent requests.

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000001';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "CLOSED",
    "current_price": "1100.00",
    "bids": 2,
    "results": 1
  }
]
```

### Test 8 — Repeated close keeps same result

I requested the closed auction again and compared its result with the previous response.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000001",
    "item_id": "20261115-0015-4000-b000-000000000001",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T07:41:36.924Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Test Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "closed_at": "2026-11-15T07:42:05.801Z",
      "winning_amount": "1100.00",
      "isWinner": true
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1100.00",
      "latestBidId": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "hasBid": true
    }
  }
}
```

### Test 9 — Winner true and loser false

I requested the same closed auction using the winning account and the losing account.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000001",
    "item_id": "20261115-0015-4000-b000-000000000001",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T07:41:36.924Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Test Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "closed_at": "2026-11-15T07:42:05.801Z",
      "winning_amount": "1100.00",
      "isWinner": true
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1100.00",
      "latestBidId": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "hasBid": true
    }
  }
}
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000001",
    "item_id": "20261115-0015-4000-b000-000000000001",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T07:41:36.924Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Test Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "6d183bd6-ea7d-4dc1-85d1-138ee4474296",
      "closed_at": "2026-11-15T07:42:05.801Z",
      "winning_amount": "1100.00",
      "isWinner": false
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1000.00",
      "latestBidId": "02c81bfd-e597-45a0-a695-60e834627bb1",
      "hasBid": true
    }
  }
}
```

### Test 10 — Closed auction rejects new bid

I submitted another bid using the winning account after the auction had closed.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000001/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1200,"requestId":"2e1f6c8c-9f9e-4496-a144-aea7226e3e8d"}'
```

**Result:** The backend returned `409 AUCTION_NOT_ACTIVE`.

```json
{
  "error": {
    "code": "AUCTION_NOT_ACTIVE",
    "message": "Auction not active"
  }
}
```

### Test 11 — Moyasar losing hold released winner retained

I read both payments from Moyasar after closure to check the losing and winning holds.

```bash
curl -i -X GET 'https://api.moyasar.com/v1/payments/20261115-0015-4000-8000-000000000001' \
  -u "$MOYASAR_SECRET_KEY:"
```

**Result:** Moyasar returned `200` with status `voided`.

```json
{
  "id": "20261115-0015-4000-8000-000000000001",
  "status": "voided",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-15T07:42:06.084Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "188.53.195.198",
  "callback_url": "http://127.0.0.1:49692/api/v1/health",
  "created_at": "2026-11-15T07:32:21.644Z",
  "updated_at": "2026-11-15T07:42:06.085Z",
  "metadata": {
    "user_id": "37037b2a-2ea5-4a6d-9d54-d9df3bf7ac14",
    "auction_id": "20261115-0015-4000-a000-000000000001"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_d83SWYLrd3agQeFmHf83Czd",
    "reference_number": "992631918474",
    "token": null,
    "message": "APPROVED",
    "transaction_url": null,
    "response_code": "00",
    "authorization_code": "007221",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

```bash
curl -i -X GET 'https://api.moyasar.com/v1/payments/20261115-0015-4000-8000-000000000002' \
  -u "$MOYASAR_SECRET_KEY:"
```

**Result:** Moyasar returned `200` with status `authorized`.

```json
{
  "id": "20261115-0015-4000-8000-000000000002",
  "status": "authorized",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": null,
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "188.53.195.198",
  "callback_url": "http://127.0.0.1:49692/api/v1/health",
  "created_at": "2026-11-15T07:38:24.528Z",
  "updated_at": "2026-11-15T07:39:45.062Z",
  "metadata": {
    "user_id": "87465e0a-2bf6-42a1-b887-eeed64f62f23",
    "auction_id": "20261115-0015-4000-a000-000000000001"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_uha2vuv8XyQ3aBUuALzpLQq",
    "reference_number": "992631940202",
    "token": null,
    "message": "APPROVED",
    "transaction_url": null,
    "response_code": "00",
    "authorization_code": "003473",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 12 — No bids closes without winner

I ended an auction that had no bids and requested its details.

```sql
UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id='20261115-0015-4000-a000-000000000012';
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000012'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000012",
    "item_id": "20261115-0015-4000-b000-000000000012",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T07:52:45.921Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Test Car 2",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": null,
      "closed_at": "2026-11-15T07:52:46.067Z",
      "winning_amount": null,
      "isWinner": null
    },
    "participation": null
  }
}
```

### Test 13 — No-bid result stored once

I checked the stored result count for the auction without bids.

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000012';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "CLOSED",
    "current_price": "1000.00",
    "bids": 0,
    "results": 1
  }
]
```

### Test 14 — Failed closure rolls back

I used a test database trigger to reject the result insert, then checked whether the closure transaction rolled back.

```sql
CREATE FUNCTION test_fail_close() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.auction_id='20261115-0015-4000-a000-000000000014'::uuid THEN RAISE EXCEPTION 'PRIVATE_TEST_DATABASE_DETAIL'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_fail_close BEFORE INSERT ON auction_results FOR EACH ROW EXECUTE FUNCTION test_fail_close();
UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id='20261115-0015-4000-a000-000000000014';
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000014'
```

**Result:** The backend returned `500 INTERNAL_ERROR`.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected server error"
  }
}
```

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000014';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "ACTIVE",
    "current_price": "1000.00",
    "bids": 0,
    "results": 0
  }
]
```

### Test 15 — Closure retries after rollback

I removed the test database trigger and requested the same auction again.

```sql
DROP TRIGGER test_fail_close ON auction_results; DROP FUNCTION test_fail_close();
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000014'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000014",
    "item_id": "20261115-0015-4000-b000-000000000014",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T07:53:55.987Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Rejected Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": null,
      "closed_at": "2026-11-15T07:54:43.911Z",
      "winning_amount": null,
      "isWinner": null
    },
    "participation": null
  }
}
```

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000014';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "CLOSED",
    "current_price": "1000.00",
    "bids": 0,
    "results": 1
  }
]
```

### Test 16 — Private first bid

I submitted a 1,000 SAR bid from the first account after it entered the private auction code.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/f06d80a9-7d13-4b17-af87-360e3b4d98d9/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"81c2b99a-3b35-497c-b6b9-664d622b8201"}'
```

**Result:** The backend returned `201`.

```json
{
  "data": {
    "bidId": "b03eba05-2472-4dc5-b7c0-7bdff33202e8",
    "amount": 1000,
    "currentPrice": 1000
  }
}
```

### Test 17 — Private second bidder higher bid

I submitted a 1,100 SAR bid from the second account in the same private auction.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/f06d80a9-7d13-4b17-af87-360e3b4d98d9/bids' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"518dc997-544e-4fa1-81c3-fe9772db5363"}'
```

**Result:** The backend returned `201`.

```json
{
  "data": {
    "bidId": "6f69e91c-d9a9-49bb-bb64-475a022318bc",
    "amount": 1100,
    "currentPrice": 1100
  }
}
```

### Test 18 — Private winner and loser results

I ended the private auction and requested its details using both bidder accounts.

```sql
UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id='f06d80a9-7d13-4b17-af87-360e3b4d98d9';
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/f06d80a9-7d13-4b17-af87-360e3b4d98d9' \
  -H 'Authorization: Bearer <BIDDER_2_JWT>'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "f06d80a9-7d13-4b17-af87-360e3b4d98d9",
    "item_id": "20261115-0015-4000-b000-000000000016",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:55:13.001Z",
    "end_time": "2026-11-15T08:20:09.581Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Private Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "6f69e91c-d9a9-49bb-bb64-475a022318bc",
      "closed_at": "2026-11-15T08:20:09.783Z",
      "winning_amount": "1100.00",
      "isWinner": true
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1100.00",
      "latestBidId": "6f69e91c-d9a9-49bb-bb64-475a022318bc",
      "hasBid": true
    }
  }
}
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/f06d80a9-7d13-4b17-af87-360e3b4d98d9' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>'
```

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "f06d80a9-7d13-4b17-af87-360e3b4d98d9",
    "item_id": "20261115-0015-4000-b000-000000000016",
    "visibility": "PRIVATE",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:55:13.001Z",
    "end_time": "2026-11-15T08:20:09.581Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Private Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "6f69e91c-d9a9-49bb-bb64-475a022318bc",
      "closed_at": "2026-11-15T08:20:09.783Z",
      "winning_amount": "1100.00",
      "isWinner": false
    },
    "participation": {
      "bidCount": 1,
      "highestBid": "1000.00",
      "latestBidId": "b03eba05-2472-4dc5-b7c0-7bdff33202e8",
      "hasBid": true
    }
  }
}
```

### Test 19 — Private closure stored once

I checked that the private auction had one saved result.

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='f06d80a9-7d13-4b17-af87-360e3b4d98d9';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "CLOSED",
    "current_price": "1100.00",
    "bids": 2,
    "results": 1
  }
]
```

### Test 20 — Private losing hold released

I read the losing private auction payment from Moyasar after closure.

```bash
curl -i -X GET 'https://api.moyasar.com/v1/payments/20261115-0011-4000-8000-000000000106' \
  -u "$MOYASAR_SECRET_KEY:"
```

**Result:** Moyasar returned `200` with status `voided`.

```json
{
  "id": "20261115-0011-4000-8000-000000000106",
  "status": "voided",
  "amount": 200000,
  "fee": 0,
  "currency": "SAR",
  "refunded": 0,
  "refunded_at": null,
  "captured": 0,
  "captured_at": null,
  "voided_at": "2026-11-15T08:20:10.804Z",
  "description": "Mezyad QA sandbox authorization",
  "amount_format": "2,000.00 SAR",
  "fee_format": "0.00 SAR",
  "refunded_format": "0.00 SAR",
  "captured_format": "0.00 SAR",
  "invoice_id": null,
  "ip": "188.53.195.198",
  "callback_url": "http://127.0.0.1:49692/api/v1/health",
  "created_at": "2026-11-15T08:13:35.082Z",
  "updated_at": "2026-11-15T08:20:10.804Z",
  "metadata": {
    "user_id": "37037b2a-2ea5-4a6d-9d54-d9df3bf7ac14",
    "auction_id": "f06d80a9-7d13-4b17-af87-360e3b4d98d9"
  },
  "source": {
    "type": "creditcard",
    "company": "mada",
    "parent_scheme": "visa",
    "name": "Mezyad Test",
    "number": "4201-32XX-XXXX-1010",
    "gateway_id": "moyasar_cc_sG9CQLQ1c7EhXgqqMHEpitp",
    "reference_number": "992631913857",
    "token": null,
    "message": "APPROVED",
    "transaction_url": null,
    "response_code": "00",
    "authorization_code": "005512",
    "issuer_name": "MOYASAR PAY SANDBOX",
    "issuer_country": "SA",
    "issuer_card_type": "credit",
    "issuer_card_category": "PREPAID"
  },
  "splits": []
}
```

### Test 21 — Queued bid rechecks time after row lock

I held the auction row lock in one PostgreSQL transaction.

```sql
BEGIN;
SELECT id FROM auctions WHERE id='20261115-0015-4000-a000-000000000021' FOR UPDATE;
```

From another terminal, I sent the bid while that transaction remained open.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000021/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000,"requestId":"8837754d-ac9d-41f8-bcdb-a68cd5087392"}' &
```

I set the end time in the past inside the transaction, then queued the detail request while the lock was still held.

```sql
UPDATE auctions SET end_time=clock_timestamp()-interval '1 millisecond' WHERE id='20261115-0015-4000-a000-000000000021';
```

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000021' &
```

I committed the transaction to release the row lock.

```sql
COMMIT;
```

**Result:** The queued bid checked the time after acquiring the lock and returned `409 AUCTION_NOT_ACTIVE`.

```json
{
  "error": {
    "code": "AUCTION_NOT_ACTIVE",
    "message": "Auction not active"
  }
}
```

### Test 22 — Queued late bid cannot become winner

I checked the queued detail response from Test 21 after the bid was rejected.

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000021",
    "item_id": "20261115-0015-4000-b000-000000000021",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1000.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T08:31:34.934Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Approved Car",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": null,
      "closed_at": "2026-11-15T08:31:38.363Z",
      "winning_amount": null,
      "isWinner": null
    },
    "participation": null
  }
}
```

### Test 23 — Queued race preserves price and bids

I checked the stored auction state after the queued bid and closure requests completed.

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000021';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "CLOSED",
    "current_price": "1000.00",
    "bids": 0,
    "results": 1
  }
]
```

### Test 24 — Bid validated before deadline commits before closure

I set the end time twenty seconds ahead, held advisory lock 714315 in one database connection, and created a test trigger that paused the bid update.

```sql
UPDATE auctions SET end_time=clock_timestamp()+interval '20 seconds' WHERE id='20261115-0015-4000-a000-000000000024';
SELECT pg_advisory_lock(714315);
CREATE FUNCTION test_pause_bid() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id='20261115-0015-4000-a000-000000000024'::uuid THEN PERFORM pg_advisory_xact_lock(714315); END IF; RETURN NEW; END $$; CREATE TRIGGER test_pause_bid BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION test_pause_bid();
```

I sent the bid from another terminal. It passed validation before the deadline and then waited on the test trigger while holding the auction row lock.

```bash
curl -i --path-as-is -X POST 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000024/bids' \
  -H 'Authorization: Bearer <BIDDER_1_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1100,"requestId":"221b6acb-7bac-46f3-a809-fca72425124b"}' &
```

After the end time passed, I queued the detail request.

```bash
curl -i --path-as-is -X GET 'http://127.0.0.1:49692/api/v1/auctions/20261115-0015-4000-a000-000000000024' &
```

I released the advisory lock so the accepted bid could commit before the waiting closure acquired the auction row lock.

```sql
SELECT pg_advisory_unlock(714315);
```

**Result:** The bid returned `201`.

```json
{
  "data": {
    "bidId": "0c01fa1d-1129-4b39-b1e8-7755fa21e0fc",
    "amount": 1100,
    "currentPrice": 1100
  }
}
```

### Test 25 — Waiting closure chooses accepted bid

I checked the queued detail response from Test 24 after releasing the paused bid.

**Result:** The backend returned `200`.

```json
{
  "data": {
    "id": "20261115-0015-4000-a000-000000000024",
    "item_id": "20261115-0015-4000-b000-000000000024",
    "visibility": "PUBLIC",
    "starting_price": "1000.00",
    "current_price": "1100.00",
    "minimum_increment": "100.00",
    "start_time": "2026-11-15T07:21:39.342Z",
    "end_time": "2026-11-15T08:34:00.505Z",
    "status": "CLOSED",
    "seller_id": "f9703b91-1d3a-4acb-8bc8-45591a55bdc1",
    "title": "Approved Car 2",
    "description": "Car for testing",
    "category_id": "217fc62a-ddf7-4a89-a557-c11c04363412",
    "category_fields": {},
    "category_name": "Rare Vehicles",
    "images": [],
    "result": {
      "winner_bid_id": "0c01fa1d-1129-4b39-b1e8-7755fa21e0fc",
      "closed_at": "2026-11-15T08:34:07.912Z",
      "winning_amount": "1100.00",
      "isWinner": null
    },
    "participation": null
  }
}
```

### Test 26 — Accepted race stores one bid and result

I checked the stored price, bid count and result count after both requests completed.

```sql
SELECT a.status,a.current_price,(SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bids,(SELECT count(*)::int FROM auction_results WHERE auction_id=a.id) AS results FROM auctions a WHERE a.id='20261115-0015-4000-a000-000000000024';
```

**Result:** PostgreSQL returned:

```json
[
  {
    "status": "CLOSED",
    "current_price": "1100.00",
    "bids": 1,
    "results": 1
  }
]
```

```sql
DROP TRIGGER test_pause_bid ON auctions;
DROP FUNCTION test_pause_bid();
```

## Testing Result

All 26 checks matched their expected results.
