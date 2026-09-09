const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const apiController = require("../controllers/api.js");
const { isLoggedIn } = require("../middleware.js");
const apiRateLimit = require("../middleware/apiRateLimit.js");

router.use(apiRateLimit);

router.get("/health", apiController.health);
router.get("/listings", wrapAsync(apiController.listListings));
router.get("/listings/:id", wrapAsync(apiController.getListing));
router.post("/listings/:id/bookings", isLoggedIn, wrapAsync(apiController.createBooking));
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(apiController.cancelBooking));

module.exports = router;
