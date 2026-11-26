# Mezyad End-to-End Test Report

**Prepared by:** Ghadi Al-Zahrani

## Objective

Verify the main auction workflows through the website, from account registration and listing review to bidding and auction results.

## Test environment

Testing was performed manually in a browser on the deployed Mezyad website. Payment steps used Moyasar test mode.

## Results summary

| ID | Test case | Status |
|---|---|---|
| E2E-01 | Registration, verification, sign-in, and sign-out | Pass |
| E2E-02 | Listing rejection, edit, resubmission, and approval | Pass |
| E2E-03 | Public auction with a winner | Pass |
| E2E-04 | Private auction access, bidding, and result | Pass |
| E2E-05 | Auction closes without bids | Pass |

## E2E-01: Registration, verification, sign-in, and sign-out

**Preconditions:** The visitor can access a test inbox and has not registered the test account.

1. Register an account and try to sign in before verifying it.
2. Submit an incorrect verification code, then submit the correct one.
3. Confirm that verification signs the user in automatically. Open the Account page, sign out, and try to open it again.

**Expected:** Sign-in is blocked before verification. An incorrect code is rejected, and the correct code verifies the account. Verification establishes a signed-in session. The Account page is accessible while signed in and requires sign-in again after sign-out.

**Actual result:** An incorrect code was rejected. The correct code verified the account and signed the user in. After logout, the account page required sign-in.

## E2E-02: Listing rejection, edit, resubmission, and approval

**Preconditions:** The seller and administrator are signed in to separate sessions.

1. Submit a new listing as the seller and check that it is pending review.
2. Reject it as the administrator and record a reason in the review form.
3. Open the listing as the seller, check the reason, update the listing, and resubmit it.
4. Approve the resubmitted listing as the administrator. Check the listing status and review controls as the seller.

**Expected:** The seller sees the rejection reason and can resubmit the edited listing. The listing returns to review, and its status becomes Approved after the administrator approves it. The seller cannot use administrator review controls.

**Actual result:** The listing was rejected, edited, resubmitted, and approved.

## E2E-03: Public auction with a winner

**Preconditions:** The seller, administrator, and bidders can sign in. Moyasar test mode is available.

1. Submit and approve a new listing, then create a public auction. Confirm a guest can find it.
2. As a bidder, complete a test commitment and submit a valid bid.
3. In a different bidder session, complete a test commitment. Try a bid below the required minimum, then submit a valid higher bid.
4. After the scheduled end, check the bid history, winner, final amount, and result notifications. Check the losing hold and payment status.

**Expected:** Only valid bids appear in the history. The highest valid bidder wins at the recorded amount. The seller and winner receive the result by email. The losing hold is released and no payment is captured.

**Actual result:** The lower bid was rejected and both valid bids were recorded. The winner and seller received result emails, and the losing bidder’s test hold was released.

## E2E-04: Private auction access, bidding, and result

**Preconditions:** A private auction exists, the bidder does not have access, and Moyasar test mode is available.

1. Check that the auction is absent from the public list and cannot be opened by an unauthorized bidder.
2. Submit an incorrect access code, then submit the correct one.
3. Complete a test commitment and check its status. Submit a valid bid and check separately that it appears in the bid history.
4. After the scheduled end, check the result and email notifications.

**Expected:** Public visitors cannot find the auction, and the wrong code does not grant access. The right code grants access. The commitment and the bid are both confirmed separately. The result matches the accepted bid. The seller and winner receive the result by email, and no payment is captured.

**Actual result:** The auction was hidden from the public list, rejected an incorrect code, and opened with the correct code. The test authorization and bid were confirmed, and the closing result matched the winner and seller emails.

## E2E-05: Auction closes without bids

**Preconditions:** An approved listing is available and the auction has no bids.

1. Create a public auction using the approved listing.
2. Leave the auction without bids until its scheduled end.
3. Check the auction result on the website and the result email.

**Expected:** The website shows the auction is closed without a winner. Only the seller receives the result email.

**Actual result:** The auction closed without bids or a winner. The seller received a matching result email.
