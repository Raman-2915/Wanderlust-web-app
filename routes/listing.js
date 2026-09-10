const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateListing, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const csrf = require("../middleware/csrf.js");

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG and PNG images are allowed"));
    }
    cb(null, true);
  },
});

router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    csrf.protect,
    validateListing,
    wrapAsync(listingController.createListing)
  );

router
  .route("/:id")
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    csrf.protect,
    validateListing,
    wrapAsync(listingController.editListing)
  )
  .get(wrapAsync(listingController.showListing));

router.post(
  "/:id/favorite",
  isLoggedIn,
  wrapAsync(listingController.addFavorite)
);

router.delete(
  "/:id/favorite",
  isLoggedIn,
  wrapAsync(listingController.removeFavorite)
);

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

router.delete(
  "/:id/delete",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.destroyListing)
);

module.exports = router;
