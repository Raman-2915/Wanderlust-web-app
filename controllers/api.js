const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    return res.status(404).json({
      success: false,
      message: "Listing not found",
    });
  }

  const confirmedBookings = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gte: new Date() },
  })
    .select("checkIn checkOut")
    .sort({ checkIn: 1 })
    .lean();

  res.json({
    success: true,
    data: {
      ...listing,
      availability: confirmedBookings,
    },
  });
};

module.exports.health = (req, res) => {
  res.json({ success: true, message: "Wanderlust API is running" });
};
