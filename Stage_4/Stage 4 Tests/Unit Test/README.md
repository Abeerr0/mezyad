# Unit Tests

This folder contains unit tests for admin access and Moyasar readiness.
This folder contains unit tests for admin access, Moyasar readiness, listing validation, and minimum bid calculation.

## Admin Access Test - done by Ghadi Alzhrani 

This test checks that an admin request is allowed to continue after the access check.

The screenshots show a passed run and a failed run.

The failed runs were created by changing the test checks from true to false to check if the test works.  

![alt text](<Pasted 2026-11-28 at 4.13.23 AM.png>)
![alt text](<Pasted 2026-11-28 at 4.13.37 AM.png>)

## Moyasar Readiness Test - done by Ghadi Alzhrani 

This test checks that Moyasar is not ready when its secret key is missing.

The screenshots show a passed run and a failed run.

The failed runs were created by changing the test checks from false to true to check if the test works.  

![alt text](<Pasted 2026-11-28 at 12.40.23 AM.png>)
![alt text](<Pasted 2026-11-28 at 12.40.31 AM.png>)

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
