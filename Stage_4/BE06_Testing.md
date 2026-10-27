# BE-06 — Account Registration Testing Report

**Team member:** Ghadi
**Week:** 1 — Backend
**Task date:** 14 October 2026
**Testing method:** Manual testing using the terminal and curl.

## Goal

Test account registration with valid and invalid data, and check that the same email address cannot be registered twice.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Email containing two `@` symbols | Reject the request | `400 INVALID_INPUT` | Passed |
| Password containing 73 bytes | Reject the request | `400 INVALID_INPUT` | Passed |
| Password containing 72 bytes with a new email | Create the account | `201 Created` | Passed |
| Register the same email again | Reject the duplicate | `409 DUPLICATE_EMAIL` | Passed |
| Name containing 161 characters | Reject the request | `400 INVALID_INPUT` | Passed |
| Email containing 255 characters | Reject the request | `400 INVALID_INPUT` | Passed |
| Name containing 160 characters and email containing 254 characters | Create the account | `201 Created` | Passed |

## Testing Method

I tested account registration manually using `curl` commands in the VS Code terminal.

I started PostgreSQL using Docker with `docker compose up -d db`, then started the backend from the `backend` folder using `npm run dev`. The terminal displayed a message confirming that the server was listening on port `3000`.

I kept the backend running and opened another terminal to send `POST` requests to:

```text
http://localhost:3000/auth/register
```

I sent the name, email, and password in JSON format. I changed the data between requests to test valid and invalid inputs, input length limits, and duplicate email registration.

For each request, I checked the HTTP status and response body returned by the backend and compared them with the expected result. I documented the commands and results in this report.

## Test Cases and Commands

### Test 1 — Email Containing Two @ Symbols

I sent a registration request with an email containing two `@` symbols to check that this invalid format was rejected.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@@example.com","password":"Test12345"}'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT`.

### Test 2 — Password Containing 73 Bytes

I sent a password containing 73 ASCII digits. Each digit takes one byte, so the password was 73 bytes long.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"password-limit@example.com","password":"1234567890123456789012345678901234567890123456789012345678901234567890123"}'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT` because the password exceeded 72 bytes.

### Test 3 — Password Containing 72 Bytes

I sent a password containing 72 ASCII digits with valid registration data and an email that was not already registered.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"password-limit@example.com","password":"123456789012345678901234567890123456789012345678901234567890123456789012"}'
```

**Result:** The backend created the account and returned `201 Created`. The response included the user's ID, name, email, and role.

### Test 4 — Duplicate Email

I sent the same request again after the account had been created to check that the same email could not be registered twice.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"password-limit@example.com","password":"123456789012345678901234567890123456789012345678901234567890123456789012"}'
```

**Result:** The backend rejected the duplicate and returned `409 Conflict` with the error code `DUPLICATE_EMAIL` and the following message:

```text
Email already registered
```

### Test 5 — Name Containing 161 Characters

I sent a name containing 161 characters to check that names above the 160-character limit were rejected.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "email":"name-limit@example.com",
    "password":"Test12345"
  }'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT`.

### Test 6 — Email Containing 255 Characters

I sent an email containing 255 characters to check that emails above the 254-character limit were rejected.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Test User",
    "email":"be06aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddd.example.com",
    "password":"Test12345"
  }'
```

**Result:** The backend rejected the request and returned `400 Bad Request` with the error code `INVALID_INPUT`.

### Test 7 — Name and Email at the Allowed Limits

I sent a name containing 160 characters, an email containing 254 characters, and an accepted password. I tested both limits together in one request.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "email":"be06aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.ddddddddddddddddddddddddddddddddddddddddddddddddd.example.com",
    "password":"Test12345"
  }'
```

**Result:** The backend created the account and returned `201 Created`.

## Testing Result

All seven test cases matched the expected results.

The backend accepted valid data at the tested limits, rejected values above those limits, and prevented duplicate email registration.

Successful registration responses included the user's ID, name, email, and role. They did not include the password or its hash.