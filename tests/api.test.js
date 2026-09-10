process.env.NODE_ENV = "test";

const listing = {
  _id: "507f1f77bcf86cd799439011",
  title: "Test Stay",
  description: "A test listing",
  price: 2500,
  location: "Delhi",
  country: "India",
};

const mockListingModel = {
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
};

const mockBookingModel = {
  find: jest.fn(),
};

jest.mock("../models/listing.js", () => mockListingModel);
jest.mock("../models/booking.js", () => mockBookingModel);

const request = require("supertest");
const { app } = require("../app.js");

const chain = (value) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe("Wanderlust REST API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/v1/health returns API status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Wanderlust API is running",
    });
  });

  test("GET /api/v1/listings returns paginated listings", async () => {
    mockListingModel.countDocuments.mockResolvedValue(1);
    mockListingModel.find.mockReturnValue(chain([listing]));

    const response = await request(app)
      .get("/api/v1/listings")
      .query({ search: "Delhi", page: 1, limit: 9 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Test Stay");
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 9,
      total: 1,
      totalPages: 1,
    });
  });

  test("GET /api/v1/listings/:id returns 404 JSON for missing listing", async () => {
    mockListingModel.findById.mockReturnValue(chain(null));

    const response = await request(app).get(
      "/api/v1/listings/507f1f77bcf86cd799439011"
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Listing not found",
    });
  });

  test("POST booking requires authentication", async () => {
    const response = await request(app)
      .post("/api/v1/listings/507f1f77bcf86cd799439011/bookings")
      .send({ booking: { checkIn: "2030-06-10", checkOut: "2030-06-12", guests: 2 } });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  test("DELETE booking requires authentication", async () => {
    const response = await request(app).delete(
      "/api/v1/bookings/507f1f77bcf86cd799439012"
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  test("unknown API route returns JSON instead of an HTML error page", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Page not found");
  });
});
