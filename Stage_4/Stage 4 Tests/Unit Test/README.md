# Unit Tests

This folder contains unit tests for admin access and Moyasar readiness.
This folder contains unit tests for admin access, Moyasar readiness, listing validation, and minimum bid calculation.

## Admin Access Test

This test checks that an admin request is allowed to continue after the access check.

The screenshots show a passed run and a failed run.

The failed runs were created by changing the test checks from true to false to check if the teset work.  

![alt text](<Screenshot 2026-11-25 at 9.06.03 PM.png>)
![alt text](<Screenshot 2026-11-25 at 1.01.19 AM.png>)

## Moyasar Readiness Test

This test checks that Moyasar is not ready when its secret key is missing.

The screenshots show a passed run and a failed run.

The failed runs were created by changing the test checks from true to false to check if the teset work.  

![alt text](<Screenshot 2026-11-25 at 1.55.41 AM.png>)
![alt text](<Screenshot 2026-11-25 at 1.55.41 AM-1.png>)

## Listing Validation Test (FE-05) — Abeer

This test checks that the listing fields are valid before submitting a listing.

The test checks valid fields, missing required fields, and invalid plate numbers.

The screenshot shows a passed run with 3 successful tests and 0 failed tests.

![Listing Validation Test](listing-validation-pass.png)

## Minimum Bid Test (FE-12) — Abeer

This test checks that the minimum bid amount is calculated correctly.

The test checks the starting price, the minimum increment after an existing bid, and missing auction data.

The test runs the calculation functions from the frontend source in isolation.

The screenshot shows a passed run with 3 successful tests and 0 failed tests.

![Minimum Bid Test](minimum-bid-pass.png)
