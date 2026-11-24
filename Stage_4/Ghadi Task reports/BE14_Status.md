# BE-14 – Bank Commitment Integration Status

**Team member:** Ghadi Alzhrani  
**Week:** 4  
**Report date:** October 31, 2026  
**Status:** Waiting for access to an official banking sandbox.

## Goal

Before accepting a bid, Mezyad should verify that a financial provider has confirmed the bidder’s commitment to a specific amount for that auction. I contacted the organizations listed below to ask whether our student team could use an official sandbox to test both approval and rejection of a commitment, or whether they could direct us to a suitable provider.

## Organizations and Programs Contacted

- Arab National Bank (ANB)
- Bank Albilad (Albilad Connect)
- Al Rajhi Bank
- Alinma Pay
- Lean Technologies
- Tarabut
- neotek
- Fintech Saudi
- XLAB
- Open Banking Lab
- Open Banking Team (`sabcustomer`)

## Backend Change

Before the change, the backend required a commitment record with the status `SUCCESS` for the same bidder and auction. Our test data had no such record, so bid requests stopped before the backend could check the auction time or bid amount.

I made the commitment check optional using `REQUIRE_BANK_COMMITMENT`. When this setting is `true`, the backend checks the commitment record in the database. When the check is disabled, the backend continues with the other bidding rules.

I temporarily disabled the check to complete the remaining `BE-04` tests. I verified that the backend rejected bids before the auction started and after it ended, rejected bids below the minimum, and recorded a valid bid. I documented the results in the [BE-04 testing report](BE04_Testing.md).

## Next Step

Once we have official sandbox access, we can connect Mezyad to the provider and test two cases. If the provider approves the commitment, the backend should continue checking the other bidding rules. If the provider rejects the commitment, the backend should reject the bid. Both cases are pending under `BE-14`.