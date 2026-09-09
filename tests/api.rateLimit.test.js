const apiRateLimit = require("../middleware/apiRateLimit.js");

describe("API rate limiter", () => {
  test("allows 100 requests and blocks the 101st request from one IP", () => {
    const next = jest.fn();
    const json = jest.fn();
    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json,
    };
    const req = { ip: `rate-limit-test-${Date.now()}-${Math.random()}` };

    for (let i = 0; i < 100; i += 1) {
      apiRateLimit(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(100);
    expect(res.status).not.toHaveBeenCalled();

    apiRateLimit(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith("Retry-After", expect.any(String));
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "Too many API requests. Please try again later.",
    });
  });
});
