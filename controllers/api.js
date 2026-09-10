const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

module.exports.listListings = async (req, res) => {
  const { search = "", country = "", sort = "newest" } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
  const filter = {};

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: regex }, { location: regex }, { country: regex }];
  }

  if (country.trim()) {
    filter.country = new RegExp(escapeRegex(country.trim()), "i");
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
  };

  const total = await Listing.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const listings = await Listing.find(filter)
    .select("title description image price location country owner createdAt")
    .sort(sortOptions[sort] || sortOptions.newest)
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: listings,
    pagination: { page: currentPage, limit, total, totalPages },
  });
};

module.exports.getListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .select("title description image price location country owner createdAt")
    .lean();

  if (!listing) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }

  const confirmedBookings = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gte: new Date() },
  })
    .select("checkIn checkOut")
    .sort({ checkIn: 1 })
    .lean();

  res.json({ success: true, data: { ...listing, availability: confirmedBookings } });
};

module.exports.createBooking = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });

  if (listing.owner.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: "You cannot book your own listing" });
  }

  const { checkIn, checkOut, guests } = req.body.booking || req.body;
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  const guestCount = Number(guests);

  if (!start || !end || end <= start || !Number.isInteger(guestCount) || guestCount < 1) {
    return res.status(400).json({ success: false, message: "Invalid booking dates or guest count" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return res.status(400).json({ success: false, message: "Check-in date cannot be in the past" });
  }

  const conflict = await Booking.findOne({
    listing: listing._id,
    status: "confirmed",
    checkIn: { $lt: end },
    checkOut: { $gt: start },
  });

  if (conflict) {
    return res.status(409).json({ success: false, message: "These dates are already booked" });
  }

  const nights = Math.ceil((end - start) / 86400000);
  const booking = await Booking.create({
    listing: listing._id,
    guest: req.user._id,
    checkIn: start,
    checkOut: end,
    guests: guestCount,
    totalPrice: nights * listing.price,
  });

  await booking.populate("listing", "title location country price");
  res.status(201).json({ success: true, data: booking });
};

module.exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, guest: req.user._id, status: "confirmed" },
    { status: "cancelled" },
    { new: true }
  ).populate("listing", "title location country price");

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found or already cancelled" });
  }

  res.json({ success: true, data: booking });
};

module.exports.health = (req, res) => {
  res.json({ success: true, message: "Wanderlust API is running" });
};
