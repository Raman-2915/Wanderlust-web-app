const mockListingModel = {
  findById: jest.fn(),
};

const mockBookingModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.mock("../models/listing.js", () => mockListingModel);
jest.mock("../models/booking.js", () => mockBookingModel);

const apiController = require("../controllers/api.js");

const makeResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const userId = "507f1f77bcf86cd799439022";
const listingId = "507f1f77bcf86cd799439011";

const makeListing = (ownerId = "507f1f77bcf86cd799439033") => ({
  _id: listingId,
  price: 2500,
  owner: { equals: (id) => id === ownerId },
});

describe("Booking API controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects booking when the guest owns the listing", async () => {
    const req = {
      params: { id: listingId },
      user: { _id: userId },
      body: { booking: { checkIn: "2030-06-10", checkOut: "2030-06-12", guests: 2 } },
    };
    const res = makeResponse();
    mockListingModel.findById.mockResolvedValue(makeListing(userId));

    await apiController.createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "You cannot book your own listing",
    });
    expect(mockBookingModel.findOne).not.toHaveBeenCalled();
  });

  test("rejects invalid booking dates", async () => {
    const req = {
      params: { id: listingId },
      user: { _id: userId },
      body: { booking: { checkIn: "2030-06-12", checkOut: "2030-06-10", guests: 2 } },
    };
    const res = makeResponse();
    mockListingModel.findById.mockResolvedValue(makeListing());

    await apiController.createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid booking dates or guest count",
    });
  });

  test("returns 409 when requested dates overlap a confirmed booking", async () => {
    const req = {
      params: { id: listingId },
      user: { _id: userId },
      body: { booking: { checkIn: "2030-06-10", checkOut: "2030-06-12", guests: 2 } },
    };
    const res = makeResponse();
    mockListingModel.findById.mockResolvedValue(makeListing());
    mockBookingModel.findOne.mockResolvedValue({ _id: "existing-booking" });

    await apiController.createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "These dates are already booked",
    });
    expect(mockBookingModel.create).not.toHaveBeenCalled();
  });

  test("creates a booking and calculates the total price", async () => {
    const req = {
      params: { id: listingId },
      user: { _id: userId },
      body: { booking: { checkIn: "2030-06-10", checkOut: "2030-06-13", guests: 2 } },
    };
    const res = makeResponse();
    const booking = {
      _id: "507f1f77bcf86cd799439044",
      listing: listingId,
      guest: userId,
      totalPrice: 7500,
      populate: jest.fn().mockResolvedValue(undefined),
    };

    mockListingModel.findById.mockResolvedValue(makeListing());
    mockBookingModel.findOne.mockResolvedValue(null);
    mockBookingModel.create.mockResolvedValue(booking);

    await apiController.createBooking(req, res);

    expect(mockBookingModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: listingId,
        guest: userId,
        guests: 2,
        totalPrice: 7500,
      })
    );
    expect(booking.populate).toHaveBeenCalledWith(
      "listing",
      "title location country price"
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: booking });
  });

  test("returns 404 when cancellation cannot find a confirmed guest booking", async () => {
    const req = {
      params: { bookingId: "507f1f77bcf86cd799439044" },
      user: { _id: userId },
    };
    const res = makeResponse();
    const query = {
      populate: jest.fn().mockResolvedValue(null),
    };
    mockBookingModel.findOneAndUpdate.mockReturnValue(query);

    await apiController.cancelBooking(req, res);

    expect(mockBookingModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ guest: userId, status: "confirmed" }),
      { status: "cancelled" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Booking not found or already cancelled",
    });
  });
});
