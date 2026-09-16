const buckets = new Map();

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

function authRateLimit(req, res, next) {
  if (!["POST"].includes(req.method) || !["/login", "/signup"].includes(req.path)) return next();

  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 30;
  const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  buckets.set(key, entry);

  if (entry.count > max) {
    req.flash("error", "Too many attempts. Please try again later.");
    return res.redirect(req.path);
  }

  next();
}

module.exports = { securityHeaders, authRateLimit };
