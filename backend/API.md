# Backend contracts for Stage 4

Base URL: `/api/v1`. Authenticated calls send `Authorization: Bearer <token>`.
Responses keep `{data: ...}` or `{error: {code,message}}`. Existing legacy URLs
remain compatible. This change does not modify Frontend source.

## Listings and category details

| Method/path | Access | Contract |
|---|---|---|
| POST /items | Signed in | Multipart creation with images; returns 201 PENDING_REVIEW |
| PATCH /items/:id | Owner of REJECTED item | Correct fields/photos; returns 200 PENDING_REVIEW |
| GET /items/:id | Owner or ADMIN | Listing, categoryFields and images |
| GET /items | Owner; ADMIN with status filter | Own listings or filtered admin review queue |
| GET /me/items | Owner | Own listings with fields and images |
| POST /admin/items/:id/review | ADMIN | APPROVED or REJECTED with nonblank reason; returns fields/photos |

Multipart names: `categoryId`, `title`, `description`, `categoryFields` (JSON
object string), repeated `images` files. `category` remains an alias for the
category ID from the Stage 3 table. `category_fields` remains an accepted legacy
alias for category details. Supplying conflicting aliases returns 400. Null,
arrays, invalid JSON and scalar details are rejected. In PostgreSQL the object
is stored in the existing `items.category_fields` JSONB column. Responses include
canonical `categoryFields` and the unchanged `category_fields` compatibility key.

```json
{"categoryFields":{"make":"Porsche","model":"Carrera GT","year":2005}}
```

Photos: JPG/PNG/WebP, six max, 5 MiB each, 20 million decoded pixels. The server
checks extension, declared MIME and actual decoded format. It rejects animated,
corrupt or oversized images and rewrites metadata-free JPEGs with random names.
Multipart creation requires a photo; legacy JSON clients remain compatible.
New photos replace all previous photos on resubmission. Omitting photos on edit
preserves the old photos. The owner/category cannot be changed by the request.
A failed transaction removes newly written files. Old files are removed only
after successful commit. Persistent upload storage and a matching database
backup are deployment requirements; this is a single-process MVP.

`images` contains temporary signed paths such as `/api/v1/images/...jpg?...`,
valid for ten minutes. Use the API origin when constructing browser image URLs.
Only an authorized listing/detail response supplies those paths. Direct unsigned
requests are rejected. Never include the account bearer token in image URLs.

### Coordination required with Frontend owners

The active `frontend/src/api.js` currently JSON-stringifies request bodies. Its
owner must add FormData support without manually setting Content-Type, and use
`categoryFields` for new requests. Older `Stage_4/ListingForm.jsx` sends
`category_fields`, which this backend accepts. Listing/admin screens must render
`images` and resolve image paths against the API origin. No Frontend file is
changed in this branch.

## Admin monitoring

| Endpoint | Access | Data |
|---|---|---|
| GET /admin/dashboard | ADMIN | Listing counts by review status, auction counts by current state, bid count |
| GET /admin/auctions | ADMIN | Public/private auctions with counts, photo and stable closing result |
| GET /items?status=... | ADMIN | PENDING_REVIEW, APPROVED or REJECTED listings including photos |

Monitoring filters: `status=SCHEDULED|ACTIVE|CLOSED`,
`visibility=PUBLIC|PRIVATE`, `limit=1..100` (default 50), `offset>=0` (default 0).
The list returns `{data:[...],meta:{limit,offset}}`; it never exposes code hashes
or raw invitation codes. Monitoring finalizes ended auctions in the selected
page using the same transaction and row lock as normal auction details. No
scheduled worker or separate closing mechanism is introduced.

```json
{"data":{"listings":{"pendingReview":2,"approved":3,"rejected":1},"auctions":{"scheduled":1,"active":2,"closed":1},"bids":{"count":8}}}
```

The above numbers are a response-shape example, not actual project metrics.

## Results and participation after reload

`GET /auctions/:id` retains the existing result and adds:

```json
{
  "result":{"winner_bid_id":"uuid","winning_amount":"1100.00","closed_at":"ISO timestamp","isWinner":true},
  "participation":{"bidCount":2,"highestBid":"1100.00","latestBidId":"uuid","hasBid":true}
}
```

`result` is null until finalized. A closed auction without bids has null winner
and amount. `isWinner` is null for guests and a boolean for authenticated viewers.
`participation` contains only the caller's bids, or null for guests. A screen can
show win/loss after reload using these persisted values; it should show a loss
only if `participation.hasBid` is true. Other bidders' IDs, names and emails are
not returned. Private details still require ownership, a grant or ADMIN.

## Access, state and banking

Wrong invitation targets and wrong codes return the same 403 INVALID_CODE.
Private bid requests without a grant use the same 404 response as missing
auctions. Ten invitation attempts per minute per user/auction then return 429
with Retry-After; passwords/codes/tokens are never logged. Counters and image
signatures are process-local. SCHEDULED/ACTIVE/CLOSED reads use database time;
late bids are independently rejected and details/monitoring finalize ended rows.

Commitment is still blocked: `POST /auctions/:id/commitment` returns 503
BANK_SANDBOX_UNAVAILABLE, creates no false approval and ignores client SUCCESS.
Stage 2 names SABB as primary candidate and Al Rajhi as backup; Stage 3 has no
verified provider operation, consent/callback contract or authorized credentials.
The mentor escalation draft and remaining gates are in `docs/`.
