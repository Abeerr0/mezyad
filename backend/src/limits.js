// نوقف المحاولات المتكررة مؤقتًا إذا تعدّت الحد المسموح.
export function attemptLimit({
  max = 10,
  windowMs = 60000,
  key = (req) => req.user?.id || req.ip,
} = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [id, entry] of attempts)
      if (entry.reset <= now) attempts.delete(id);
    const id = key(req);
    const entry = attempts.get(id) || { count: 0, reset: now + windowMs };
    if (entry.count >= max || (!attempts.has(id) && attempts.size >= 10000)) {
      res.set(
        "Retry-After",
        String(Math.max(1, Math.ceil((entry.reset - now) / 1000))),
      );
      return res.status(429).json({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Try again later.",
        },
      });
    }
    entry.count++;
    attempts.set(id, entry);
    next();
  };
}
