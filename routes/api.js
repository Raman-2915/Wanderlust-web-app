const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const apiController = require("../controllers/api.js");
const apiAuth = require("../middleware/apiAuth.js");
const apiRateLimit = require("../middleware/apiRateLimit.js");
const csrf = require("../middleware/csrf.js");

router.use(apiRateLimit);

router.get("/health", apiController.health);
router.get("/listings", wrapAsync(apiController.listListings));
router.get("/listings/:id", wrapAsync(apiController.getListing));
router.post("/listings/:id/bookings", apiAuth, csrf.protect, wrapAsync(apiController.createBooking));
router.delete("/bookings/:bookingId", apiAuth, csrf.protect, wrapAsync(apiController.cancelBooking));

module.exports = router;
