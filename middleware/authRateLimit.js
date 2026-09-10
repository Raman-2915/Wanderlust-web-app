const buckets = new Map();

const createAuthRateLimit = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.start >= windowMs) {
      buckets.set(key, { start: now, count: 1 });
      return next();
    }

    bucket.count += 1;
    if (bucket.count <= max) return next();

    const retryAfter = Math.ceil((windowMs - (now - bucket.start)) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).render("listings/error.ejs", {
      message: "Too many authentication attempts. Please try again later.",
    });
  };
};

module.exports = { createAuthRateLimit };
