const blockedPages = new Set([
  "create-listing",
  "edit-listing",
  "create-auction",
  "listings",
  "activity",
  "my-auctions",
  "bid",
  "commitment",
  "payment",
]);

export function isAdminRole(role) {
  return role === "ADMIN";
}

export function isAdminPageBlocked(role, page) {
  return isAdminRole(role) && blockedPages.has(page);
}

export function canShowMarketplaceActions(role) {
  return !isAdminRole(role);
}

export function canShowAuctionNavPage(role, page) {
  return !isAdminPageBlocked(role, page);
}

export function canShowAccountSettings(role) {
  return !isAdminRole(role);
}
