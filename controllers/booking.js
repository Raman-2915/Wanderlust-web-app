const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const BookingNight = require("../models/bookingNight.js");

const getDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getBookingNights = (start, end) => {
  const nights = [];
  const cursor = new Date(start);

  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return nights;
};

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body.booking || {};
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing.");
    return res.redirect(`/listings/${id}`);
  }

  const start = getDate(checkIn);
  const end = getDate(checkOut);
  const guestCount = Number(guests);

  if (!start || !end || end <= start || !Number.isInteger(guestCount) || guestCount < 1) {
    req.flash("error", "Please provide valid booking dates and guest count.");
    return res.redirect(`/listings/${id}`);
  }

  if (guestCount > (listing.maxGuests || 1)) {
    req.flash("error", `This stay accommodates up to ${listing.maxGuests || 1} guest(s).`);
    return res.redirect(`/listings/${id}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
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

  const bookedNights = getBookingNights(start, end);
  const totalPrice = bookedNights.length * listing.price;
  const booking = new Booking({
    listing: id,
    guest: req.user._id,
    checkIn: start,
    checkOut: end,
    guests: guestCount,
    totalPrice,
  });

  try {
    await BookingNight.insertMany(
      bookedNights.map((date) => ({ listing: id, booking: booking._id, date })),
      { ordered: true }
    );
    await booking.save();
  } catch (err) {
    await BookingNight.deleteMany({ booking: booking._id });
    await Booking.deleteOne({ _id: booking._id });

    if (err?.code === 11000) {
      req.flash("error", "These dates were just booked. Please choose different dates.");
      return res.redirect(`/listings/${id}`);
    }

    throw err;
  }

  await booking.populate("listing", "title location country price");
  res.render("bookings/confirmation.ejs", { booking });
};

module.exports.completeDemoPayment = async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    {
      _id: req.params.bookingId,
      guest: req.user._id,
      status: "confirmed",
      paymentStatus: "unpaid",
    },
    {
      paymentStatus: "demo_paid",
      paymentReference: `DEMO-${Date.now()}`,
    },
    { new: true }
  ).populate("listing", "title location country price");

  if (!booking) {
    req.flash("error", "This demo payment is no longer available.");
    return res.redirect("/profile#trips");
  }

  req.flash("success", "Demo payment recorded. No money was charged.");
  res.render("bookings/confirmation.ejs", { booking });
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

  await BookingNight.deleteMany({ booking: booking._id });

  req.flash("success", "Booking cancelled successfully.");
  res.redirect("/profile");
};
