# BE-07 — Login, Session and Logout Testing Report

**Team member:** Ghadi
**Week:** 1 — Backend
**Task date:** 15 October 2026
**Retest date:** 15 November 2026
**Testing method:** Manual testing using the terminal and curl.

## Goal

Test login with valid and invalid data, check that a valid session token returns the user's details, and confirm that the token is rejected after logout.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Empty email | Reject the request | `400 INVALID_INPUT` | Passed |
| Empty password | Reject the request | `400 INVALID_INPUT` | Passed |
| Incorrect password | Reject login | `401 INVALID_CREDENTIALS` | Passed |
| Correct login details | Return a session token and user details | `200 OK` with a JWT and user details | Passed |
| Request user details without a session token | Reject the request | `401 UNAUTHORIZED` | Passed |
| Request user details with a valid session token | Return user details | `200 OK` with user details | Passed |
| Logout with a valid session token | Accept logout | `200 OK` with `signedOut: true` | Passed |
| Use the same token after logout | Reject the request | `401 UNAUTHORIZED` | Passed |

## Testing Method

I tested login, the session, and logout using `curl` commands in the VS Code terminal.

I used `ghadi0alzhrani@gmail.com`. I took the JWT from `data.token` after successful login and used it for the user-details and logout requests. The last request reused the token after logout.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Test Cases and Commands

### Test 1 — Empty Email

I sent a login request with an empty email to check that the request was rejected.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"","password":"MezyadTest2026!"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 2 — Empty Password

I sent the account email with an empty password to check that the request was rejected.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ghadi0alzhrani@gmail.com","password":""}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 3 — Incorrect Password

I sent the correct account email with the incorrect password `wrong`.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ghadi0alzhrani@gmail.com","password":"wrong"}'
```

**Result:** The backend returned `401 INVALID_CREDENTIALS`.

### Test 4 — Correct Login Details

I sent the account email and the correct password.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ghadi0alzhrani@gmail.com","password":"MezyadTest2026!"}'
```

**Result:** The backend returned `200`. The response showed `JWT and user details`.

### Test 5 — Request User Details Without a Session Token

I requested user details without sending an `Authorization` header.

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/auth/me'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

### Test 6 — Request User Details With a Valid Session Token

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/auth/me' \
  -H 'Authorization: Bearer <SELLER_JWT>'
```

**Result:** The backend returned `200`. The response showed `email=ghadi0alzhrani@gmail.com`.

### Test 7 — Logout

I sent a logout request using the same JWT.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/auth/logout' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `200`. The response showed `signedOut=true`.

```json
{"data":{"signedOut":true}}
```

### Test 8 — Use the Session Token After Logout

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/auth/me' \
  -H 'Authorization: Bearer <SIGNED_OUT_SELLER_JWT>'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

## Testing Result

All 8 cases matched their expected results. The backend issued a JWT after login and rejected reuse of the token after logout.
