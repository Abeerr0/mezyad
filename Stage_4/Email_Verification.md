# Email Verification

**Team member:** Ghadi
**Week:** 4 — Backend
**Task date:** 4 November 2026
**Retest date:** 10 November 2026
**Testing method:** Manual testing using the terminal and curl.

## Goal

Test email verification for a new account, check that an unverified account cannot sign in, and confirm that code validation, the five-attempt limit, and requesting a new code work as expected.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Register a new account and receive the email | Create an unverified account and send a code | `201 Created`, `emailVerified: false`, `emailSent: true`; code received in the local SMTP inbox | Passed |
| Login before email verification | Reject login | `403 EMAIL_NOT_VERIFIED` | Passed |
| Incorrect six-digit code | Reject the code | `400 INVALID_CODE` | Passed |
| Code containing three digits | Reject the invalid input | `400 INVALID_INPUT` | Passed |
| Correct code after five wrong attempts | Reject the code even while it is unexpired | `400 INVALID_CODE`; database showed 5 attempts and `not_expired: t` | Passed |
| Request a new code after one minute | Send a new code and reject the previous code | `200 OK`; new code received in the local SMTP inbox; superseded code returned `400 INVALID_CODE` | Passed |
| Request another code immediately | Reject the early resend | `429 TOO_SOON` | Passed |
| Verify using the newest correct code | Confirm the email | `200 OK`, `emailVerified: true` | Passed |
| Verify the same email again | Reject repeated verification | `409 ALREADY_VERIFIED` | Passed |
| Login after email verification | Return a session token and user details | `200 OK` with a JWT and user details | Passed |

## Testing Method

I tested email verification using `curl` commands in the VS Code terminal.

I used `verify@mezyad.test` and a local SMTP inbox for the verification emails. The five-attempt, resend, and login cases used the same account.

I compared each HTTP status and response with the expected result.

## Test Cases and Commands

### Test 1 — Register a New Account and Receive the Verification Email

I sent a registration request using an email address that had not been registered in the project.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Email Test","email":"verify@mezyad.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `201 Created` with `emailVerified: false` and `emailSent: true`.

```json
{"data":{"id":"13ef09e3-e592-49e0-81c2-7bc18a091e43","name":"Email Test","email":"verify@mezyad.test","role":"USER","emailVerified":false,"emailSent":true}}
```

I received the code in the local SMTP inbox. I also received a verification email from Mezyad at `ghadi0alzhrani@gmail.com` during the Gmail delivery check.

### Test 2 — Login Before Email Verification

I tried to sign in using the correct email and password before confirming the email.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Email Test","email":"verify@mezyad.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `403 EMAIL_NOT_VERIFIED`.

```json
{"error":{"code":"EMAIL_NOT_VERIFIED","message":"Verify your email before signing in"}}
```

### Test 3 — Incorrect Six-Digit Code

I sent `000000`, which was different from the code received by email. The issued code had not expired.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<INCORRECT_SIX_DIGIT_CODE>"}'
```

**Result:** The backend returned `400 INVALID_CODE`.

```json
{"error":{"code":"INVALID_CODE","message":"Invalid or expired code"}}
```

### Test 4 — Code Containing Three Digits

I sent `123` to check that a code containing fewer than six digits was rejected.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"123"}'
```

**Result:** The backend returned `400 INVALID_INPUT`.

```json
{"error":{"code":"INVALID_INPUT","message":"Valid email and 6-digit code required"}}
```

### Test 5 — Correct Code After Five Wrong Attempts

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<INCORRECT_SIX_DIGIT_CODE>"}'
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<INCORRECT_SIX_DIGIT_CODE>"}'
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<INCORRECT_SIX_DIGIT_CODE>"}'
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<INCORRECT_SIX_DIGIT_CODE>"}'
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<FIRST_CODE>"}'
```

**Result:** The backend returned `400 INVALID_CODE`.

```json
{"error":{"code":"INVALID_CODE","message":"Invalid or expired code"}}
```

PostgreSQL showed five wrong attempts and confirmed that the code had not expired.

```sql
SELECT email_code_attempts, email_code_expires_at > now() AS not_expired
FROM users
WHERE email = 'verify@mezyad.test';
```

### Test 6 — Request a New Code After One Minute

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/resend-code' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test"}'
```

**Result:** The backend returned `200 OK`, and I received the new code in the local SMTP inbox.

```json
{"data":{"message":"If the account exists and is not verified, a new code was sent"}}
```

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<FIRST_CODE>"}'
```

**Result:** The backend returned `400 INVALID_CODE`.

```json
{"error":{"code":"INVALID_CODE","message":"Invalid or expired code"}}
```

### Test 7 — Request Another Code Immediately

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/resend-code' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test"}'
```

**Result:** The backend returned `429 TOO_SOON`.

```json
{"error":{"code":"TOO_SOON","message":"Wait one minute before requesting a new code"}}
```

### Test 8 — Verify Using the Newest Correct Code

I opened the newest verification email and sent its code. I kept the code inside quotation marks as a string, including its leading zero.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<NEWEST_CODE>"}'
```

**Result:** The backend returned `200`. The response showed `emailVerified=true`.

```json
{"data":{"emailVerified":true}}
```

### Test 9 — Verify the Same Email Again

I repeated the same successful verification request from Test 8.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/verify-email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@mezyad.test","code":"<NEWEST_CODE>"}'
```

**Result:** The backend returned `409 ALREADY_VERIFIED`.

```json
{"error":{"code":"ALREADY_VERIFIED","message":"Email already verified"}}
```

### Test 10 — Login After Email Verification

I sent the same correct login details used in Test 2, after the email had been confirmed.

```bash
curl -i -X POST 'http://127.0.0.1:51969/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Email Test","email":"verify@mezyad.test","password":"<TEST_PASSWORD>"}'
```

**Result:** The backend returned `200`. The response showed `JWT and verified account`.

```json
{"data":{"token":"HIDDEN","user":{"id":"13ef09e3-e592-49e0-81c2-7bc18a091e43","name":"Email Test","email":"verify@mezyad.test","role":"USER"}}}
```

## Testing Result

All 10 cases matched their expected results. I received the codes in the local SMTP inbox and confirmed that a verified account could sign in and receive a JWT.
