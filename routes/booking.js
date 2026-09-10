const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.post(
  "/:id/bookings",
  isLoggedIn,
  wrapAsync(bookingController.createBooking)
);

router.post(
  "/bookings/:bookingId/payment",
  isLoggedIn,
  wrapAsync(bookingController.completeDemoPayment)
);

router.delete(
  "/bookings/:bookingId",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking)
);

module.exports = router;
