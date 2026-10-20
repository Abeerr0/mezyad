const MAX_CENTS = 99999999999999;

export function toCents(value) {
  if (typeof value !== "number" && typeof value !== "string")
    throw new TypeError("Invalid amount");
  // نفصل الريال والهللات كنص، عشان المبالغ الكبيرة ما تتأثر بدقة الكسور.
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new RangeError("Invalid currency precision");
  const cents =
    Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS)
    throw new RangeError("Amount out of range");
  return cents;
}

export function validMoney(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return false;
  try {
    return toCents(value) > 0;
  } catch {
    return false;
  }
}
