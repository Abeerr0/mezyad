# BE-08 — Role-Based Route Protection Testing Report

**Team member:** Ghadi

**Week:** 1 — Backend

**Selected task date:** 16 October 2026.

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

I tested the routes manually using `curl` commands in the VS Code terminal.

PostgreSQL was running in Docker, and the backend was running locally on port `3000`. I kept the backend running and used another terminal to send requests.

I used a regular user account and prepared a separate account to test admin permissions. I used the token belonging to the account being tested.

For each request, I compared the HTTP status and response message with the expected result.

## Test Account Preparation

### Regular User Account

I signed in with the existing user account to obtain its session token:

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test12345"}'
```

The response returned `200 OK`, a session token, and account details with the role `USER`.

### Admin Account

I registered a separate test account:

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Admin","email":"admin@example.com","password":"Test12345"}'
```

The response returned `201 Created`. The account initially had the role `USER`.

I changed only this account's role to `ADMIN` in the local database:

```bash
docker compose exec db psql -U postgres -d mezyad -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com' RETURNING email, role;"
```

The output displayed the email with the role `ADMIN` and returned `UPDATE 1`, confirming that one row was updated.

I then signed in with the admin account:

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Test12345"}'
```

The response returned `200 OK`, a session token, and the role `ADMIN`.

I copied each account's token from `data.token` in its login response in the terminal. I placed that token after `Bearer` in requests for that account.

## Test Cases and Commands

### Test 1 — Request Without a Token

I requested user details without sending an `Authorization` header:

```bash
curl -i http://localhost:3000/auth/me
```

**Result:** The backend rejected the request and returned `401 Unauthorized` with the error code `UNAUTHORIZED` and the message `Sign in required`.

### Test 2 — Invalid Token

I sent `abc123` instead of a valid session token:

```bash
curl -i http://localhost:3000/auth/me \
  -H 'Authorization: Bearer abc123'
```

**Result:** The backend rejected the request and returned `401 Unauthorized` with the error code `UNAUTHORIZED` and the message `Session expired`.

In this case, the token did not match a valid session.

### Test 3 — Valid User Token

I sent the regular user's token obtained from the login response:

```bash
curl -i http://localhost:3000/auth/me \
  -H 'Authorization: Bearer (I placed the user token here)'
```

**Result:** The backend returned `200 OK` with the user's ID, name, email, and role `USER`.

### Test 4 — Regular User Accessing the Admin Route

I sent a request to the advertisement review route using the regular user's token:

```bash
curl -i -X POST http://localhost:3000/admin/items/00000000-0000-4000-8000-000000000000/review \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend rejected access and returned `403 Forbidden` with the error code `FORBIDDEN` and the message `Admin only`.

The user had a valid session, but their role did not allow access to the admin route.

### Test 5 — Admin Passing the Permission Checks

I sent the same request using the admin token and kept the request body empty:

```bash
curl -i -X POST http://localhost:3000/admin/items/00000000-0000-4000-8000-000000000000/review \
  -H 'Authorization: Bearer (I placed the admin token here)' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Result:** The backend returned `400 Bad Request` with the error code `INVALID_INPUT` and the message:

```text
Valid decision and rejection reason required
```

This route checks the session and admin permission before validating the review data. The request reached input validation and was rejected because `{}` did not contain the required review data.

The admin permission check passed. This test did not approve or reject an advertisement.

### Test 6 — Admin Logout

I sent a logout request using the same admin token:

```bash
curl -i -X POST http://localhost:3000/auth/logout \
  -H 'Authorization: Bearer (I placed the admin token here)'
```

**Result:** The backend returned `200 OK` with:

```json
{"data":{"signedOut":true}}
```

### Test 7 — Reusing the Token After Logout

I requested user details using the same admin token after signing out:

```bash
curl -i http://localhost:3000/auth/me \
  -H 'Authorization: Bearer (I placed the admin token here)'
```

**Result:** The backend rejected the request and returned `401 Unauthorized` with the error code `UNAUTHORIZED` and the message `Session expired`.

This confirmed that the session ended by logout no longer allowed access.

## Testing Result

All seven documented test cases matched the expected results.

On the tested routes, requests without valid tokens were rejected, and valid user sessions could retrieve user details. The regular user was blocked from the admin route, while the admin passed the permission checks.

Logout succeeded, and the same session token was rejected after logout.