# BE-08 — Role-Based Route Protection Testing Report

**Team member:** Ghadi

**Week:** 1 — Backend

**Selected task date:** 16 October 2026.

**Retest date:** 10 November 2026

**Testing method:** Manual testing using the terminal and curl.

## Goal

Check that protected routes reject requests without a valid session, accept requests with a valid session, and apply the correct permissions for regular users and admins.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
| --- | --- | --- | --- |
| Request user details without a token | Reject the request | `401 UNAUTHORIZED` | Passed |
| Request user details with an invalid token | Reject the request | `401 UNAUTHORIZED` | Passed |
| Request user details with a valid user token | Return user details | `200 OK` | Passed |
| Access the admin route with a regular user token | Reject access | `403 FORBIDDEN` | Passed |
| Access the admin route with an admin token and an empty body | Pass permission checks, then reject the empty input | `400 INVALID_INPUT` | Passed |
| Sign out the admin | End the current session | `200 OK` and `signedOut: true` | Passed |
| Reuse the same admin token after logout | Reject the request | `401 UNAUTHORIZED` | Passed |

## Testing Method

I tested the routes using `curl` commands in the VS Code terminal.

I used `seller@mezyad.test` as the regular user and `admin@mezyad.test` as the admin. I signed in to both accounts and used their JWTs in the relevant requests.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Test Account Preparation

### Regular User Account

I used the test account `seller@mezyad.test` with the role `USER` and signed in to obtain its JWT.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"seller@mezyad.test","password":"<TEST_PASSWORD>"}'
```

### Admin Account

I prepared `admin@mezyad.test` with the role `ADMIN` in the temporary database and signed in to obtain its JWT.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mezyad.test","password":"<TEST_PASSWORD>"}'
```

## Test Cases and Commands

### Test 1 — Request Without a Token

I requested user details without sending an `Authorization` header:

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auth/me'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

### Test 2 — Invalid Token

I sent `abc123` instead of a valid JWT:

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auth/me' \
  -H 'Authorization: Bearer <INVALID_JWT>'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

### Test 3 — Valid User Token

I sent the regular user's token obtained from the login response:

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auth/me' \
  -H 'Authorization: Bearer <SELLER_JWT>'
```

**Result:** The backend returned `200`. The response showed `role=USER`.

### Test 4 — Regular User Accessing the Admin Route

I sent a request to the advertisement review route using the regular user's token:

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/admin/items/00000000-0000-4000-8000-000000000000/review' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `403 FORBIDDEN`.

### Test 5 — Admin Passing the Permission Checks

I sent the same request using the admin token and kept the request body empty:

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/admin/items/00000000-0000-4000-8000-000000000000/review' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 6 — Admin Logout

I sent a logout request using the same admin token:

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/logout' \
  -H 'Authorization: Bearer <ADMIN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `200`. The response showed `signedOut=true`.

```json
{"data":{"signedOut":true}}
```

### Test 7 — Reusing the Token After Logout

I requested user details using the same admin token after signing out:

```bash
curl -i -X GET 'http://127.0.0.1:51969/api/v1/auth/me' \
  -H 'Authorization: Bearer <SIGNED_OUT_ADMIN_JWT>'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

## Testing Result

All 7 cases matched their expected results.
