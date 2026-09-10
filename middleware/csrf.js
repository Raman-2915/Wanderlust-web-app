const crypto = require("crypto");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const tokensMatch = (provided, expected) => {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const attachToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

const reject = (req, res) => {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(403).json({ success: false, message: "Invalid CSRF token" });
  }
  return res.status(403).render("listings/error.ejs", {
    message: "Your form expired. Please refresh the page and try again.",
  });
};

const protect = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const token = req.body?._csrf || req.get("x-csrf-token");
  if (!tokensMatch(token, req.session?.csrfToken)) return reject(req, res);

  next();
};

const protectBrowserRequests = (req, res, next) => {
  if (req.originalUrl.startsWith("/api/") || req.is("multipart/form-data")) {
    return next();
  }
  return protect(req, res, next);
};

module.exports = { attachToken, protect, protectBrowserRequests };
