const buckets = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

module.exports = (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now - current.start >= WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return next();
  }

  current.count += 1;

  if (current.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - current.start)) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      success: false,
      message: "Too many API requests. Please try again later.",
    });
  }

  next();
};
