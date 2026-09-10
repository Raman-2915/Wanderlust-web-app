const csrf = require("../middleware/csrf.js");
const { createAuthRateLimit } = require("../middleware/authRateLimit.js");

const makeResponse = () => {
  const res = {
    locals: {},
    set: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe("CSRF protection", () => {
  test("creates one token per session and exposes it to views", () => {
    const req = { session: {} };
    const res = makeResponse();
    const next = jest.fn();

    csrf.attachToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.session.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(res.locals.csrfToken).toBe(req.session.csrfToken);
  });

  test("rejects a browser mutation without a valid token", () => {
    const req = {
      method: "POST",
      body: {},
      session: { csrfToken: "a".repeat(64) },
      originalUrl: "/login",
      get: jest.fn(),
    };
    const res = makeResponse();

    csrf.protect(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith(
      "listings/error.ejs",
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test("accepts a browser mutation with the session token", () => {
    const token = "b".repeat(64);
    const req = {
      method: "POST",
      body: { _csrf: token },
      session: { csrfToken: token },
      originalUrl: "/login",
      get: jest.fn(),
    };
    const res = makeResponse();
    const next = jest.fn();

    csrf.protect(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("defers multipart verification until its fields have been parsed", () => {
    const req = {
      method: "POST",
      is: jest.fn().mockReturnValue("multipart/form-data"),
      originalUrl: "/listings",
    };

    csrf.protectBrowserRequests(req, makeResponse(), jest.fn());

    expect(req.is).toHaveBeenCalledWith("multipart/form-data");
  });
});

describe("authentication rate limiting", () => {
  test("blocks attempts above the configured limit", () => {
    const limit = createAuthRateLimit({ windowMs: 60_000, max: 2 });
    const req = { ip: "127.0.0.1" };
    const next = jest.fn();

    limit(req, makeResponse(), next);
    limit(req, makeResponse(), next);

    const blockedResponse = makeResponse();
    limit(req, blockedResponse, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(blockedResponse.status).toHaveBeenCalledWith(429);
    expect(blockedResponse.set).toHaveBeenCalledWith(
      "Retry-After",
      expect.any(String)
    );
  });
});
