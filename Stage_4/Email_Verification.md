# Email Verification

**Team member:** Ghadi
**Week:** 4 — Backend
**Task date:** 4 November 2026
**Testing method:** Manual testing using the terminal and curl.

## Goal

Test email verification for a new account, check that an unverified account cannot sign in, and confirm that code validation, the five-attempt limit, and requesting a new code work as expected.

## Test Results Summary

| Test case | Expected result | Actual result | Test status |
|---|---|---|---|
| Register a new account and receive the email | Create an unverified account and send a code | `201 Created`, `emailVerified: false`, `emailSent: true`; email received | Passed |
| Login before email verification | Reject login | `403 EMAIL_NOT_VERIFIED` | Passed |
| Incorrect six-digit code | Reject the code | `400 INVALID_CODE` | Passed |
| Code containing three digits | Reject the invalid input | `400 INVALID_INPUT` | Passed |
| Correct code after five wrong attempts | Reject the code even while it is unexpired | `400 INVALID_CODE`; database showed 5 attempts and `not_expired: t` | Passed |
| Request a new code after one minute | Send a new code and reject the previous code | `200 OK`; email received; superseded code returned `400 INVALID_CODE` | Passed |
| Request another code immediately | Reject the early resend | `429 TOO_SOON` | Passed |
| Verify using the newest correct code | Confirm the email | `200 OK`, `emailVerified: true` | Passed |
| Verify the same email again | Reject repeated verification | `409 ALREADY_VERIFIED` | Passed |
| Login after email verification | Return a session token and user details | `200 OK` with a token and user details | Passed |

## Testing Method

I tested email verification manually using `curl` commands in the VS Code terminal.

PostgreSQL was running using Docker, and the backend was running locally on port `3000`. The email-verification database migration had already been applied.

I kept the backend running and used another terminal to send JSON requests to `/auth/register`, `/auth/login`, `/auth/verify-email`, and `/auth/resend-code`.

I used one new test account throughout the tests. I received real verification emails from Mezyad in Gmail. I also read the attempt counter and expiry condition from PostgreSQL during Test 5.

For each request, I checked the HTTP status and response body and compared them with the expected result. I documented the commands and results in this report.

The commands below use `TEST_EMAIL`, `TEST_PASSWORD`, and code placeholders instead of the real account values. I entered the real values in the terminal. `TEST_USER_ID` represents the same user ID in the registration and login responses, and `HIDDEN` replaces the returned session token.

## Test Cases and Commands

### Test 1 — Register a New Account and Receive the Verification Email

I sent a registration request using an email address that had not been registered in the project.

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Email Test","email":"TEST_EMAIL","password":"TEST_PASSWORD"}'
```

**Result:** The backend created the account and returned `201 Created`. The response contained `emailVerified: false` and `emailSent: true`. I opened Gmail and received the verification email from Mezyad.

```json
{"data":{"id":"TEST_USER_ID","name":"Email Test","email":"TEST_EMAIL","role":"USER","emailVerified":false,"emailSent":true}}
```

### Test 2 — Login Before Email Verification

I tried to sign in using the correct email and password before confirming the email.

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","password":"TEST_PASSWORD"}'
```

**Result:** The backend rejected login and returned `403 Forbidden` with the error code `EMAIL_NOT_VERIFIED`.

```json
{"error":{"code":"EMAIL_NOT_VERIFIED","message":"Verify your email before signing in"}}
```

### Test 3 — Incorrect Six-Digit Code

I sent `000000`, which was different from the code received by email. The issued code had not expired.

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"000000"}'
```

**Result:** The backend rejected the incorrect code and returned `400 Bad Request` with the error code `INVALID_CODE`.

```json
{"error":{"code":"INVALID_CODE","message":"Invalid or expired code"}}
```

### Test 4 — Code Containing Three Digits

I sent `123` to check that a code containing fewer than six digits was rejected.

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"123"}'
```

**Result:** The backend rejected the input and returned `400 Bad Request` with the error code `INVALID_INPUT`.

```json
{"error":{"code":"INVALID_INPUT","message":"Valid email and 6-digit code required"}}
```

### Test 5 — Correct Code After Five Wrong Attempts

Test 3 had used one wrong-code attempt. I sent four more wrong-code requests, for a total of five eligible wrong attempts. I checked the counter in the database before submitting the original correct code.

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"000000"}'
```

I repeated the wrong-code request four times in this test, then read the counter and expiry condition:

```bash
docker compose exec -T db psql -U postgres -d mezyad -c "SELECT email_code_attempts AS attempts, email_code_expires_at > now() AS not_expired FROM users WHERE email='TEST_EMAIL';"
```

The database showed `attempts: 5` and `not_expired: t`. This confirmed that the attempt limit had been reached while the code was still unexpired.

I then sent the correct code from the registration email:

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"REGISTER_CODE"}'
```

**Result:** The backend rejected the correct code and returned `400 Bad Request` with `INVALID_CODE`. The code was still within its ten-minute validity, so this tested rejection after the five-attempt limit.

```json
{"error":{"code":"INVALID_CODE","message":"Invalid or expired code"}}
```

### Test 6 — Request a New Code After One Minute

After more than one minute had passed since the previous email, I requested a new code using the same account email.

```bash
curl -i -X POST http://localhost:3000/auth/resend-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL"}'
```

**Result:** The backend returned `200 OK`, and I received a new verification email in Gmail.

```json
{"data":{"message":"If the account exists and is not verified, a new code was sent"}}
```

After more than one minute, I sent the same resend request again and received `200 OK`. This created a newer code. I tested the immediate-repeat restriction after this request in Test 7.

I then sent the code from the first resend email to check that the newer resend had replaced it:

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"FIRST_RESENT_CODE"}'
```

**Result:** The backend rejected the previous code and returned `400 Bad Request` with `INVALID_CODE`. That previous code was less than three minutes old, so it was still within its original ten-minute validity.

```json
{"error":{"code":"INVALID_CODE","message":"Invalid or expired code"}}
```

### Test 7 — Request Another Code Immediately

Immediately after the second successful resend in Test 6, I repeated the same resend request without waiting one minute.

```bash
curl -i -X POST http://localhost:3000/auth/resend-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL"}'
```

**Result:** The backend rejected the early resend and returned `429 Too Many Requests` with the error code `TOO_SOON`.

```json
{"error":{"code":"TOO_SOON","message":"Wait one minute before requesting a new code"}}
```

### Test 8 — Verify Using the Newest Correct Code

I opened the newest verification email and sent its code. I kept the code inside quotation marks as a string, including its leading zero.

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"LATEST_CODE"}'
```

**Result:** The backend confirmed the email and returned `200 OK` with `emailVerified: true`. This also showed that a new code could be used after the earlier five-attempt limit and resend.

```json
{"data":{"emailVerified":true}}
```

### Test 9 — Verify the Same Email Again

I repeated the same successful verification request from Test 8.

```bash
curl -i -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","code":"LATEST_CODE"}'
```

**Result:** The backend rejected repeated verification and returned `409 Conflict` with the error code `ALREADY_VERIFIED`.

```json
{"error":{"code":"ALREADY_VERIFIED","message":"Email already verified"}}
```

### Test 10 — Login After Email Verification

I sent the same correct login details used in Test 2, after the email had been confirmed.

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"TEST_EMAIL","password":"TEST_PASSWORD"}'
```

**Result:** Login succeeded, and the backend returned `200 OK`. The response included a session token in `data.token` and user details in `data.user`. The ID matched the account created in Test 1, and the role was `USER`. The token value is hidden below.

```json
{"data":{"token":"HIDDEN","user":{"id":"TEST_USER_ID","name":"Email Test","email":"TEST_EMAIL","role":"USER"}}}
```

## Testing Result

All ten documented test cases matched the expected results.

The backend sent actual verification emails, rejected login before verification, and rejected incorrect or malformed codes. It rejected the correct unexpired code after five wrong attempts.

Requesting a new code succeeded after one minute, replaced the previous code, and allowed verification again. An immediate resend was rejected.

The newest correct code confirmed the email. Repeated verification was rejected, and the same login details returned a session token and user details after verification.