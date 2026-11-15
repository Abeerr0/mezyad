# BE-09 — Admin Pending Advertisements Testing Report

**Team member:** Ghadi

**Week:** 2 — Backend

**Task deadline:** 21 October 2026

**Retest date:** 15 November 2026

**Testing method:** Manual testing using the terminal and curl.

## Goal

Check that the admin's pending advertisement list returns advertisements waiting for review with their stored image records.

Also check that the normal advertisement list returns only the current user's own advertisements.

## Results Summary

| Test | Expected result | Actual result | Status |
| --- | --- | --- | --- |
| Request the list without a token | Reject the request | `401 Unauthorized` | Passed |
| Request the list as a regular user | Return only that user's advertisements | `200 OK`, only `Test Car` and its two image records | Passed |
| Admin requests an empty list | Return an empty list | `200 OK` and `{"data":[]}` | Passed |
| Return a pending advertisement without images | Return the advertisement with an empty image list | `Test Car` appeared with `"images":[]` | Passed |
| Return an advertisement with two image records | Return both records with the advertisement | Both records appeared inside `images` | Passed |
| Request the list with different advertisement statuses present | Return only pending advertisements with the correct image records | Only the two pending advertisements appeared, with the correct image records | Passed |
| Regular user requests their normal advertisement list | Return only that user's advertisements | Only `Test Car` appeared, with its image records | Passed |

## Testing Method

I sent curl commands from the VS Code terminal.

I used `Test Car` with two image records and listings from another account.

I compared each HTTP status and response with the expected result. For protected requests, I took the JWT from `data.token` in the login response and placed it after `Bearer`.

## Tests and Commands

### 1. Request Without a Token

I requested the pending advertisements without sending a token:

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items?status=PENDING_REVIEW'
```

**Result:** The backend returned `401 UNAUTHORIZED`.

### 2. Request as a Regular User

I sent the request using the regular user's token:

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer <SELLER_JWT>'
```

**Result:** The backend returned `200 OK`. Only the user's own advertisement, `Test Car`, appeared with its two image records. The other account's advertisements were excluded, so the test passed.

### 3. Admin Requests an Empty List

Before adding test advertisements, I requested the list using the admin token:

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer <ADMIN_JWT>'
```

**Result:** The backend returned `200`. The response showed `items=0`.

```json
{"data":[]}
```

### 4. Create a Test Car Advertisement and Return It Without Images

I used the existing `POST /items` creation route to add a test advertisement.

```bash
curl -i -X POST 'http://127.0.0.1:49692/api/v1/items' \
  -H 'Authorization: Bearer <SELLER_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test Car","description":"Car for testing","categoryId":"217fc62a-ddf7-4a89-a557-c11c04363412","categoryFields":{}}'
```

**Result:** The backend returned `201`. The response showed `status=PENDING_REVIEW`.

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer <ADMIN_JWT>'
```

**Result:** The backend returned `200`. The response showed `items=1 images=0`.

### 5. Return the Advertisement's Image Records

I added two records to the existing `item_images` table in the local database.

I used the following query in the temporary database.

```sql
INSERT INTO item_images (item_id, image_url) VALUES
  ('6e3eabf0-d9a8-432b-8849-40c2efa6a901', 'https://example.com/car1.jpg'),
  ('6e3eabf0-d9a8-432b-8849-40c2efa6a901', 'https://example.com/car2.jpg');
```

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer <ADMIN_JWT>'
```

**Result:** The backend returned `200`. The response showed `images=2`.

### 6. Filter by Status and Keep Images With Their Advertisement

I prepared three listings for the other account with the statuses `PENDING_REVIEW`, `APPROVED`, and `REJECTED` before requesting the admin list.

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer <ADMIN_JWT>'
```

**Result:** The backend returned `200`. The response showed `items=2 pending with matching images`.

### 7. Regular User's Own Advertisement List

I requested `/api/v1/items` without the status filter, using the regular user's token:

```bash
curl -i -X GET 'http://127.0.0.1:49692/api/v1/items' \
  -H 'Authorization: Bearer <SELLER_JWT>'
```

**Result:** The backend returned `200 OK`. Only the user's own advertisement, `Test Car`, appeared with its two image records. The other account's advertisements were excluded, so the test passed.

## Final Result

All 7 cases matched their expected results. Tests 2 and 7 confirmed that the regular user received only their own advertisement and its images. The admin received pending advertisements from both accounts.
