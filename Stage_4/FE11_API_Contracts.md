# FE-11 — API Contracts for Frontend Integration

**Team member:** Ghadi
**Task date:** 13 November 2026

## Goal

Document the current backend endpoints, request fields, authentication, permissions and responses used to connect the frontend.

## API Base

The API base is `<backend origin>/api/v1`. Every endpoint below is relative to that base. IDs are UUID strings. Date fields use ISO 8601.

JSON requests use `Content-Type: application/json`. Protected requests use `Authorization: Bearer <JWT>`. Success responses contain `data`. Error responses contain `error.code` and `error.message`. Complete responses from the tests are in [FE11_Testing.md](FE11_Testing.md).

## Endpoint List

| Method | Endpoint | Access | Success |
|---|---|---|---|
| GET | /health | Public | 200 |
| GET | /categories | Public | 200 |
| POST | /auth/register | Public | 201 |
| POST | /auth/verify-email | Public | 200 |
| POST | /auth/resend-code | Public | 200 |
| POST | /auth/login | Public | 200 |
| GET | /auth/me | Signed-in account | 200 |
| POST | /auth/logout | Signed-in account | 200 |
| POST | /items | USER | 201 |
| GET | /items | Signed-in account | 200 |
| GET | /items/:id | Owner or ADMIN | 200 |
| PATCH | /items/:id | USER who owns a rejected listing | 200 |
| GET | /images/:filename | Valid signed image URL | 200 JPEG |
| POST | /admin/items/:id/review | ADMIN | 200 |
| POST | /auctions | USER who owns an approved listing | 201 |
| GET | /auctions | Public; ADMIN for scope=all | 200 |
| GET | /auctions/:id | Public auction; private owner, ADMIN or admitted user | 200 |
| POST | /auctions/access | USER | 200 |
| POST | /auctions/:id/commitment | Signed-in account and payment validation | 201 |
| GET | /auctions/:id/commitment | Signed-in account, own commitment | 200 |
| POST | /auctions/:id/bids | USER with auction access and verified commitment | 201 |
| GET | /auctions/:id/bids | Signed-in account with auction access | 200 |
| GET | /me/items | Signed-in account, own listings | 200 |
| GET | /me/auctions | Signed-in account, own or participated auctions | 200 |

## Registration and Email Verification

### POST /auth/register

Body fields are `name`, `email` and `password`. The name is required and limited to 160 characters. A valid email is required and limited to 254 characters. The password must contain at least 8 characters and must not exceed 72 UTF-8 bytes.

The account is created as `USER`. The response contains `id`, `name`, `email`, `role`, `emailVerified` and `emailSent`. A successful creation is `201`. `emailSent: true` means the mail server accepted the message. A duplicate email returns `409 DUPLICATE_EMAIL`. Invalid fields return `400 INVALID_INPUT`.

### POST /auth/verify-email

The body contains `email` and the six-digit string `code`. A successful response is `200` with `data.emailVerified: true`. Codes expire after ten minutes. Five incorrect attempts prevent the existing code from being used. Invalid input returns `400 INVALID_INPUT`. An incorrect or expired code returns `400 INVALID_CODE`. An already verified account returns `409 ALREADY_VERIFIED`.

### POST /auth/resend-code

The body contains `email`. The success response is `200` with a generic `data.message`. An immediate repeat returns `429 TOO_SOON`. Wait at least one minute before requesting another code. The newest code replaces the previous code. Delivery failure can return `502 EMAIL_SEND_FAILED`.

## Login and Session

### POST /auth/login

The body contains `email` and `password`. A successful response contains `data.token` and `data.user` with `id`, `name`, `email` and `role`. Incorrect credentials return `401 INVALID_CREDENTIALS`. An unverified email returns `403 EMAIL_NOT_VERIFIED`.

The JWT expires one hour after login. It contains the account ID in `sub` and a Boolean `is_admin` claim. The backend verifies the JWT signature and expiry, checks the stored session and reads the account role from the database before applying permissions. The role returned by login is `ADMIN` or `USER`.

### GET /auth/me

Send the JWT in the Authorization header. The response contains `data.user`. A missing, modified, expired or logged-out token returns `401 UNAUTHORIZED`.

### POST /auth/logout

Send the JWT in the Authorization header. The response contains `data.signedOut: true`. The stored session is deleted, so reusing the same token returns `401 UNAUTHORIZED`.

## Listings and Review

### POST /items

Use multipart form data when sending images. Fields are `title`, `description`, `categoryId` and `categoryFields`. In multipart requests, `categoryFields` is a JSON object encoded as a string. The image field is `images` and can be repeated for each file. JPEG, PNG and WebP files are accepted, with up to six files and a 5 MiB limit per file.

A multipart creation requires images. JSON creation without image files is also accepted by the current backend. The title and description are required. The title is limited to 240 characters and the description to 20000 characters. `categoryId` must identify an existing category.

A successful response returns the listing with `status: PENDING_REVIEW` and its `images`. ADMIN requests are rejected with `403 FORBIDDEN` before images are saved.

### GET /items

An ordinary USER receives their own listings. This remains a successful `200` response when the user supplies a status filter. The status filter is applied to the ADMIN review list; for a USER, this endpoint returns that account's own listings across statuses. It does not expose other users' listings.

For the administrator's review lists, use `/items?status=PENDING_REVIEW`, `/items?status=APPROVED` or `/items?status=REJECTED` with an ADMIN token. The response is a `data` array containing listing details, review fields and all listing images. An empty result is `data: []`.

### GET /items/:id

The owner or an administrator can read listing details and all images. Another ordinary user receives `403 FORBIDDEN`.

### PATCH /items/:id

Only the USER who owns a `REJECTED` listing can resubmit it. Send `title` and `description`, with `categoryId` and `categoryFields` when needed. Multipart can also include images. Existing images are retained when no replacement images are submitted.

Success returns `200` with `status: PENDING_REVIEW`. The previous review reason, reviewer and review time are cleared. Pending and approved listings return `409 INVALID_STATE`. ADMIN requests return `403 FORBIDDEN`.

### GET /images/:filename

Use each image URL returned by the API, including its `expires` and `signature` query parameters. The response is the image itself, not JSON. The upload test returned `200` with `Content-Type: image/jpeg` and a valid JPEG body.

### POST /admin/items/:id/review

Use an ADMIN token. The body contains `decision`, either `APPROVED` or `REJECTED`. For rejection, `reason` must contain a nonblank explanation, up to 2000 characters.

Only a `PENDING_REVIEW` listing can be reviewed. Success returns `200` with the updated listing, `review_reason`, `reviewed_by`, `reviewed_at` and images. Unsupported decisions and missing rejection reasons return `400 INVALID_INPUT`. Reviewing an already processed listing returns `409 INVALID_STATE`. USER requests return `403 FORBIDDEN`.

## Auctions

### POST /auctions

Body fields are `itemId`, `visibility`, `startingPrice`, `minimumIncrement`, `startTime` and `endTime`. Visibility is `PUBLIC` or `PRIVATE`. Prices must be valid positive amounts and the end must follow the start.

The listing must belong to the USER and be approved. An item already used for an auction returns `409 DUPLICATE_AUCTION`. An unapproved or someone else's item returns `403 NOT_APPROVED`. ADMIN requests return `403 FORBIDDEN`.

Success returns `201` with the auction ID, item ID, visibility, prices, dates and status. A private auction creation also returns a 24-character `accessCode`. The detail and list responses do not return this code.

### GET /auctions

The default response lists public auctions. Optional filters are `categoryId` and `status`. Status is `SCHEDULED`, `ACTIVE` or `CLOSED`. Invalid filters return `400 INVALID_INPUT`.

An ADMIN token with `scope=all` returns public and private auctions. A USER token with `scope=all` returns `403 FORBIDDEN`. Each row contains the auction fields, title, category name, one cover `image_url` and `bid_count`. Full image lists are returned by the detail endpoint.

### GET /auctions/:id

Public auction details are readable without a token. For private auctions, send an owner, ADMIN or admitted USER token. Without access, the response is `404 NOT_FOUND`.

Details include the auction and listing fields, `images`, `result` and `participation`. Before closing, `result` is null. After closing, it contains the winning bid, closing time and winning amount. With a participant token, `result.isWinner` identifies whether that account won. `participation` contains `bidCount`, `highestBid`, `latestBidId` and `hasBid`.

### POST /auctions/access

Use a USER token. The body contains `accessCode`. A valid code returns `200` with `data.accessGranted: true` and `data.auctionId`. Reuse that account's token to open the private details and submit bids. An incorrect code returns `403 INVALID_CODE`. ADMIN requests return `403 FORBIDDEN`.

## Moyasar and Bidding

### POST /auctions/:id/commitment

The body contains the UUID `paymentId` returned by Moyasar. The backend fetches the payment from Moyasar and verifies its status, currency, amount and metadata. The payment must be an authorized SAR hold with matching `metadata.auction_id` and `metadata.user_id`. Moyasar amounts use the smallest currency unit, so 2000 SAR is `200000` in a Moyasar payment. Backend bid amounts use SAR.

Success is `201` with `id`, `status`, `sandbox_reference`, `max_amount`, `released_at` and `created_at`. The current integration uses Moyasar test keys. Secret keys stay in the backend environment.

The tested errors are `400 INVALID_INPUT`, `409 PAYMENT_NOT_COMPLETED`, `409 COMMITMENT_DECLINED`, `409 COMMITMENT_TOO_LOW`, `403 PAYMENT_MISMATCH`, `409 AUCTION_NOT_ACTIVE` and `503 BANK_SANDBOX_UNAVAILABLE`.

### GET /auctions/:id/commitment

The current response contains the requesting account's commitment fields `id`, `status`, `sandbox_reference` and `created_at`. It does not include `max_amount` or `released_at`. No saved commitment returns `404 NOT_FOUND`.

### POST /auctions/:id/bids

Use a USER token. The body contains numeric `amount` and a UUID `requestId`. Use one request ID for one intended bid, including a retry of that bid. The backend validates the auction, access, owner, commitment and minimum permitted amount.

Success is `201` with `data.bidId`, `data.amount` and `data.currentPrice`. The owner cannot bid on their own auction and receives `403 OWNER`. Other tested rejections include `403 COMMITMENT_REQUIRED`, `409 BID_ABOVE_COMMITMENT` and `409 BID_TOO_LOW`. ADMIN requests return `403 FORBIDDEN`.

After closing, the highest accepted bid identifies the winner. The losing participant's hold is voided at Moyasar. The winner's hold remains authorized at that stage.

### GET /auctions/:id/bids

Use a token with access to the auction. Optional pagination fields are `limit` from 1 to 100 and `offset` from zero. The response is a `data` array with each bid's `id`, `amount` and `created_at`.

## Account Lists

### GET /me/items

Returns the requesting account's listings with their statuses, review data and images.

### GET /me/auctions

Returns auctions owned by the requesting account or auctions in which that account placed a bid. The current rows contain `id`, `status`, `end_time` and `title`. Use the auction detail endpoint with the same token for the account's participation and winning result.

## Response Types

Database decimal fields such as `current_price`, `starting_price` and saved bid `amount` can be JSON strings such as `"1100.00"`. The bid-creation response returns numeric `amount` and `currentPrice`. Keep the returned field names and distinguish an empty array from an error response.

## Test Evidence

[FE11_Testing.md](FE11_Testing.md) contains the terminal commands and complete actual JSON responses for the current API, permissions, email verification, images, public and private auctions, bidding and Moyasar Sandbox cases.
