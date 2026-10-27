# BE-09 — Admin Pending Advertisements Testing Report

**Team member:** Ghadi

**Week:** 2 — Backend

**Task deadline:** 21 October 2026

**Testing method:** Manual testing using the terminal and curl.

## Goal

Check that the pending advertisement list is available only to admins and returns advertisements waiting for review with their stored image records.

Also check that the normal advertisement list returns only the current user's own advertisements.

## Results Summary

| Test | Expected result | Actual result | Status |
| --- | --- | --- | --- |
| Request the list without a token | Reject the request | `401 Unauthorized` | Passed |
| Request the list as a regular user | Reject access | `403 Forbidden` | Passed |
| Admin requests an empty list | Return an empty list | `200 OK` and `{"data":[]}` | Passed |
| Return a pending advertisement without images | Return the advertisement with an empty image list | `Test Car` appeared with `"images":[]` | Passed |
| Return an advertisement with two image records | Return both records with the advertisement | Both records appeared inside `images` | Passed |
| Request the list with different advertisement statuses present | Return only pending advertisements with the correct image records | Only the two pending advertisements appeared, with the correct image records | Passed |
| Regular user requests their normal advertisement list | Return only that user's advertisements | Only `Test Car` appeared, with its image records | Passed |

## Testing Method

PostgreSQL was running in Docker, and the backend was running locally on port `3000`. I kept the backend running and sent curl commands from another terminal in VS Code.

I checked the file's syntax with the following command, which returned without an error message:

```bash
node --check backend/src/app.js
```

I used two existing accounts:

- `test@example.com` with the role `USER`.
- `admin@example.com` with the role `ADMIN`.

I signed in to each account through `POST /auth/login`. I copied each account's token from `data.token` in its login response in the terminal and placed it after `Bearer` in requests for that account.

For each test, I compared the HTTP status and response body with the expected result.

## Tests and Commands

### 1. Request Without a Token

I requested the pending advertisements without sending a token:

```bash
curl -i 'http://localhost:3000/items?status=PENDING_REVIEW'
```

**Result:** The backend returned `401 Unauthorized`, with the error code `UNAUTHORIZED` and the message `Sign in required`.

### 2. Request as a Regular User

I sent the request using the regular user's token:

```bash
curl -i 'http://localhost:3000/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer (I placed the user token here)'
```

**Result:** The backend returned `403 Forbidden`, with the error code `FORBIDDEN` and the message `Admin only`.

### 3. Admin Requests an Empty List

Before adding test advertisements, I requested the list using the admin token:

```bash
curl -i 'http://localhost:3000/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer (I placed the admin token here)'
```

**Result:** The backend returned `200 OK` with:

```json
{"data":[]}
```

### 4. Create a Test Car Advertisement and Return It Without Images

I used the existing `POST /items` creation route to add a test advertisement.

I wrote the title `Test Car` and the description `Car for testing` inside the JSON data in the curl command. I used the ID of the existing `Rare Vehicles` category in my local database, previously returned by `/categories`. I left `categoryFields` as an empty object `{}` for this test.

I sent the request using the regular user's token:

```bash
curl -i -X POST http://localhost:3000/items \
  -H 'Authorization: Bearer (I placed the user token here)' \
  -H 'Content-Type: application/json' \
  -d '{
    "categoryId":"cc19d435-c42a-4479-89a1-54a1079b35fb",
    "title":"Test Car",
    "description":"Car for testing",
    "categoryFields":{}
  }'
```

The response returned `201 Created`. The advertisement was saved in `items` and linked to the token's user. The database generated a new ID and assigned the status `PENDING_REVIEW`.

The generated advertisement ID was:

```text
4d5dc010-0fa4-48bd-bdff-810e1cc4703b
```

I then requested the list using the admin account:

```bash
curl -i 'http://localhost:3000/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer (I placed the admin token here)'
```

**Result:** The backend returned `200 OK`. `Test Car` appeared with `"images":[]`, because no image records were linked to it yet.

### 5. Return the Advertisement's Image Records

I added two records to the existing `item_images` table in the local database.

I placed the ID of `Test Car` in `item_id` to link both records to it. I used two example text URLs in `image_url`.

The purpose was to check that the code reads both records and returns them with the correct advertisement. This step tested stored image data and did not include uploading image files or displaying them in a browser.

I ran the SQL command through `psql` inside the database container:

```bash
docker compose exec db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 -c "INSERT INTO item_images (item_id, image_url) VALUES ('4d5dc010-0fa4-48bd-bdff-810e1cc4703b', 'https://example.com/car1.jpg'), ('4d5dc010-0fa4-48bd-bdff-810e1cc4703b', 'https://example.com/car2.jpg') RETURNING item_id, image_url;"
```

The database displayed two rows and returned `INSERT 0 2`.

I requested the list again:

```bash
curl -i 'http://localhost:3000/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer (I placed the admin token here)'
```

**Result:** The backend returned `200 OK`. The `images` list inside `Test Car` contained both records, each with an image ID and the correct URL:

```text
https://example.com/car1.jpg
https://example.com/car2.jpg
```

### 6. Filter by Status and Keep Images With Their Advertisement

I prepared three additional advertisements directly in `items` using SQL:

- `Test Car 2` with the status `PENDING_REVIEW` and no images.
- `Approved Car` with the status `APPROVED`.
- `Rejected Car` with the status `REJECTED`.

I used the admin account's ID as the owner of these test records, so there were advertisements belonging to an account different from the owner of `Test Car`.

I prepared the statuses directly to test list filtering:

```bash
docker compose exec db psql -U postgres -d mezyad -v ON_ERROR_STOP=1 -c "
INSERT INTO items (seller_id, category_id, title, description, status)
VALUES
('b8aa1615-1a07-42d7-bc7f-6c58a4330221', 'cc19d435-c42a-4479-89a1-54a1079b35fb', 'Test Car 2', 'Car for testing', 'PENDING_REVIEW'),
('b8aa1615-1a07-42d7-bc7f-6c58a4330221', 'cc19d435-c42a-4479-89a1-54a1079b35fb', 'Approved Car', 'Car for testing', 'APPROVED'),
('b8aa1615-1a07-42d7-bc7f-6c58a4330221', 'cc19d435-c42a-4479-89a1-54a1079b35fb', 'Rejected Car', 'Car for testing', 'REJECTED')
RETURNING title, status;"
```

The database displayed the three advertisements with their statuses and returned `INSERT 0 3`.

I requested the list using the admin token:

```bash
curl -i 'http://localhost:3000/items?status=PENDING_REVIEW' \
  -H 'Authorization: Bearer (I placed the admin token here)'
```

**Result:** The backend returned `200 OK`.

- `Test Car` appeared with its two image records.
- `Test Car 2` appeared with `"images":[]`.
- The approved and rejected advertisements did not appear.

The list returned only pending advertisements, and the image records stayed attached to the correct advertisement.

### 7. Regular User's Own Advertisement List

I requested `/items` without the status filter, using the regular user's token:

```bash
curl -i http://localhost:3000/items \
  -H 'Authorization: Bearer (I placed the user token here)'
```

**Result:** The backend returned `200 OK`. Only `Test Car` appeared, with its two image records. The other account's three advertisements did not appear.

## Final Result

All seven tests matched the expected results.

The pending list rejected requests without a valid session and blocked regular users. Admin requests returned only pending advertisements with each advertisement's image records.

The normal `/items` request continued to return only the current user's own advertisements.

The image data used in these tests consisted of records with example text URLs. The tests confirmed that these records were read and returned through the API. They did not cover image file uploads or image display in a browser.