# BE-07 — Login, Session and Logout Testing Report

**Team member:** Ghadi
**Week:** 1 — Backend
**Task date:** 15 October 2026
**Testing method:** Manual testing using the terminal and curl.

## Goal

Test login with valid and invalid data, check that a valid session token returns the user's details, and confirm that the token is rejected after logout.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Empty email | Reject the request | `400 INVALID_INPUT` | Passed |
| Empty password | Reject the request | `400 INVALID_INPUT` | Passed |
| Incorrect password | Reject login | `401 INVALID_CREDENTIALS` | Passed |
| Correct login details | Return a session token and user details | `200 OK` with a token and user details | Passed |
| Request user details without a session token | Reject the request | `401 UNAUTHORIZED` | Passed |
| Request user details with a valid session token | Return user details | `200 OK` with user details | Passed |
| Logout with a valid session token | Accept logout | `200 OK` with `signedOut: true` | Passed |
| Use the same token after logout | Reject the request | `401 UNAUTHORIZED` | Passed |

## Testing Method

I tested login, the session, and logout manually using `curl` commands in the VS Code terminal.

PostgreSQL was running using Docker, and the backend was running locally on port `3000`.

I kept the backend running and used another terminal to send requests. I used the previously registered test account with the email `test@example.com` and password `Test12345`.

I sent login details in JSON format. I changed the data between requests to test an empty email, an empty password, an incorrect password, and correct login details.

After successful login, I used the session token to request user details and log out. I then used the same token after logout to check that it was rejected.

For each request, I checked the HTTP status and response body and compared them with the expected result. I documented the commands and results in this report.

## Test Cases and Commands

### Test 1 — Empty Email

I sent a login request with an empty email to check that the request was rejected.

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"","password":"Test12345"}'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT` and the message `Valid email and password required`.

### Test 2 — Empty Password

I sent the account email with an empty password to check that the request was rejected.

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":""}'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT` and the message `Valid email and password required`.

### Test 3 — Incorrect Password

I sent the correct account email with the incorrect password `Test54321`.

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test54321"}'
```

**Result:** The backend rejected login and returned `401 Unauthorized` with the error code `INVALID_CREDENTIALS` and the message `Invalid credentials`.

### Test 4 — Correct Login Details

I sent the account email and the correct password.

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test12345"}'
```

**Result:** Login succeeded, and the backend returned `200 OK`.

The response included the session token in `data.token` and user details in `data.user`. The user details included the ID, name, email, and role.

### Test 5 — Request User Details Without a Session Token

I requested user details without sending an `Authorization` header.

```bash
curl -i http://localhost:3000/auth/me
```

**Result:** The backend rejected the request and returned `401 Unauthorized` with the error code `UNAUTHORIZED` and the message `Sign in required`.

### Test 6 — Request User Details With a Valid Session Token

After successful login in Test 4, I copied the `token` value inside `data` from the response displayed in the terminal. I placed it after `Bearer` in the following commands. I used the same value to request user details, log out, and check that access was rejected after logout.

I requested user details using the session token:

```bash
curl -i http://localhost:3000/auth/me \
  -H 'Authorization: Bearer (I placed the token here)'
```

**Result:** The backend returned `200 OK` and user details in `data.user`.

The name was `Test User`, the email was `test@example.com`, and the role was `USER`. The user ID matched the ID returned during login.

### Test 7 — Logout

I sent a logout request using the same session token.

```bash
curl -i -X POST http://localhost:3000/auth/logout \
  -H 'Authorization: Bearer (I placed the token here)'
```

**Result:** The backend returned `200 OK` with the following response:

```json
{"data":{"signedOut":true}}
```

### Test 8 — Use the Session Token After Logout

After logout, I requested user details again using the same token, without logging in again.

```bash
curl -i http://localhost:3000/auth/me \
  -H 'Authorization: Bearer (I placed the token here)'
```

**Result:** The backend rejected the request and returned `401 Unauthorized` with the error code `UNAUTHORIZED` and the message `Session expired`.

This confirmed that the previous token no longer allowed access after logout.

## Testing Result

All eight documented test cases matched the expected results.

The backend accepted correct login details and rejected empty inputs and an incorrect password.

It returned user details when a valid session token was provided and rejected the same token after logout.

The returned user details did not include the password or its hash.