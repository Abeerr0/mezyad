# BE-06 — Account Registration Testing Report

**Team member:** Ghadi
**Week:** 1 — Backend
**Task date:** 14 October 2026
**Retest date:** 10 November 2026
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

I tested account registration using `curl` commands in the VS Code terminal.

I used fresh test addresses and kept the same input limits. The boundary cases used 72 and 73 password bytes, 160 and 161 name characters, and 254 and 255 email characters.

I compared each HTTP status and response with the expected result.

## Test Cases and Commands

### Test 1 — Email Containing Two @ Symbols

I sent a registration request with an email containing two `@` symbols to check that this invalid format was rejected.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"a@@mezyad.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 2 — Password Containing 73 Bytes

I sent a password containing 73 ASCII digits. Each digit takes one byte, so the password was 73 bytes long.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"limits@mezyad.test","password":"1111111111111111111111111111111111111111111111111111111111111111111111111"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 3 — Password Containing 72 Bytes

I sent a password containing 72 ASCII digits with valid registration data and an email that was not already registered.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"limits@mezyad.test","password":"111111111111111111111111111111111111111111111111111111111111111111111111"}'
```

**Result:** The backend returned `201`.

### Test 4 — Duplicate Email

I sent the same request again after the account had been created to check that the same email could not be registered twice.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"limits@mezyad.test","password":"111111111111111111111111111111111111111111111111111111111111111111111111"}'
```

**Result:** The backend returned `409 DUPLICATE_EMAIL`.

### Test 5 — Name Containing 161 Characters

I sent a name containing 161 characters to check that names above the 160-character limit were rejected.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","email":"long-name@mezyad.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 6 — Email Containing 255 Characters

I sent an email containing 255 characters to check that emails above the 254-character limit were rejected.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddddddddd.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

### Test 7 — Name and Email at the Allowed Limits

I sent a name containing 160 characters, an email containing 254 characters, and an accepted password. I tested both limits together in one request.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","email":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.dddddddddddddddddddddddddddddddddddddddddddddddddddddddd.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `201`.

## Testing Result

All 7 cases matched their expected results.
