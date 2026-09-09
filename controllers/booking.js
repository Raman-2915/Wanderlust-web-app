const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

const getDate = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body.booking || {};
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  const start = getDate(checkIn);
  const end = getDate(checkOut);
  const guestCount = Number(guests);

  if (!start || !end || end <= start || !Number.isInteger(guestCount) || guestCount < 1) {
    req.flash("error", "Please provide valid booking dates and guest count.");
    return res.redirect(`/listings/${id}`);
  }

  if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
    req.flash("error", "Check-in date cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  const conflictingBooking = await Booking.findOne({
    listing: id,
    status: "confirmed",
    checkIn: { $lt: end },
    checkOut: { $gt: start },
  });

  if (conflictingBooking) {
    req.flash("error", "These dates are already booked. Please choose different dates.");
    return res.redirect(`/listings/${id}`);
  }

  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalPrice = nights * listing.price;

  await Booking.create({
    listing: id,
    guest: req.user._id,
    checkIn: start,
    checkOut: end,
    guests: guestCount,
    totalPrice,
  });

  req.flash("success", "Booking confirmed successfully!");
  res.redirect("/profile");
};

module.exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, guest: req.user._id, status: "confirmed" },
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) {
    req.flash("error", "Booking not found or already cancelled.");
    return res.redirect("/profile");
  }

  req.flash("success", "Booking cancelled successfully.");
  res.redirect("/profile");
};
