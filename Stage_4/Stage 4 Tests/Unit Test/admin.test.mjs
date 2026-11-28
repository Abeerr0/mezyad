import test from "node:test";
import assert from "node:assert/strict";
import { admin } from "../../../backend/src/auth.js";

test("AdminCanApproveListings", (t) => {
  const request = { user: { role: "ADMIN" } };
  let allowed = false;

   const next = t.mock.fn((error) => {
    assert.equal(error, undefined);
    allowed = true;
  });

  admin(request, {}, next);
  assert.equal(allowed, true);
});
// هذا الكود اختبا يونت تست  للادمن لما يوافق على انشاء الاعلان 