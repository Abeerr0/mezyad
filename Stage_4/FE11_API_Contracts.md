# FE-11: Mezyad API Endpoints

**Team member:** Ghadi  
**Task date:** 13 November 2026  
**Base path:** `/api/v1`

Endpoints that require login use `Authorization: Bearer <JWT>`. Successful JSON responses put the result in `data`. Errors include `error.code` and `error.message`.

| Method | Path | Purpose | Access | Success |
|---|---|---|---|---|
| GET | `/health` | Checks whether the API is running | Public | 200 |
| GET | `/categories` | Lists categories | Public | 200 |
| POST | `/auth/register` | Creates an account | Public | 201 |
| POST | `/auth/verify-email` | Confirms the email with a code | Public | 200 |
| POST | `/auth/resend-code` | Sends a new verification code | Public | 200 |
| POST | `/auth/login` | Signs in and returns a login token | Public | 200 |
| GET | `/auth/me` | Returns the signed-in account’s details | Signed in | 200 |
| POST | `/auth/logout` | Ends the login session | Signed in | 200 |
| POST | `/items` | Creates a listing for review | USER | 201 |
| GET | `/items` | Lists own listings for users or review listings for admins | Signed in | 200 |
| GET | `/items/:id` | Returns listing details and images | Listing owner or ADMIN | 200 |
| PATCH | `/items/:id` | Updates a rejected listing and sends it back for review | USER who owns the listing | 200 |
| GET | `/images/:filename` | Returns the image, not JSON | Valid signed image link | 200 |
| POST | `/admin/items/:id/review` | Approves or rejects a listing | ADMIN | 200 |
| POST | `/auctions` | Creates an auction from an approved listing | USER who owns the listing | 201 |
| GET | `/auctions` | Lists auctions | Public; `scope=all` is ADMIN only | 200 |
| GET | `/auctions/:id` | Returns auction details | Public auction: anyone. Private: owner, ADMIN, or user with access | 200 |
| POST | `/auctions/access` | Grants access to a private auction with a valid code | USER | 200 |
| POST | `/auctions/:id/commitment` | Verifies and records a Moyasar payment hold | Signed in, with a valid payment hold | 201 |
| GET | `/auctions/:id/commitment` | Returns the account’s own payment hold | Signed in | 200 |
| POST | `/auctions/:id/bids` | Places a bid | USER with auction access and a verified payment hold | 201 |
| GET | `/auctions/:id/bids` | Lists bids for an auction | Signed in, with auction access | 200 |
| GET | `/me/items` | Lists the signed-in account’s own listings | Signed in | 200 |
| GET | `/me/auctions` | Lists auctions the account owns or has bid on | Signed in | 200 |
