const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const apiController = require("../controllers/api.js");

router.get("/health", apiController.health);
router.get("/listings", wrapAsync(apiController.listListings));
router.get("/listings/:id", wrapAsync(apiController.getListing));

module.exports = router;
