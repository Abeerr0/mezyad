import test from "node:test";
import assert from "node:assert/strict";
import { moyasarReady } from "../../../backend/src/moyasar.js";

test("MoyasarReadyMoyasarkeyisMissing", () => {
  delete process.env.MOYASAR_SECRET_KEY;
  assert.equal(moyasarReady(), false);
});
//اختبار المفتاح التجريبي لميسر هل موجود ولالا 