const Listing = require("../models/listing");
const User = require("../models/user");

module.exports.index = async (req, res) => {
  const {
    search = "",
    country = "",
    minPrice = "",
    maxPrice = "",
    category = "",
    sort = "newest",
  } = req.query;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 9;
  const filter = {};

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { country: searchRegex },
    ];
  }

  if (country.trim()) {
    filter.country = new RegExp(country.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  if (category) {
    filter.category = category;
  }

  if (minPrice !== "" || maxPrice !== "") {
    filter.price = {};
    if (minPrice !== "" && !Number.isNaN(Number(minPrice))) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== "" && !Number.isNaN(Number(maxPrice))) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
  };

  const sortBy = sortOptions[sort] || sortOptions.newest;
  const totalListings = await Listing.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(totalListings / limit), 1);
  const currentPage = Math.min(page, totalPages);

  const allListings = await Listing.find(filter)
    .sort(sortBy)
    .skip((currentPage - 1) * limit)
    .limit(limit);

  res.render("listings/index.ejs", {
    allListings,
    search,
    country,
    minPrice,
    maxPrice,
    sort,
    category,
    totalListings,
    currentPage,
    totalPages,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Listing image is required");
    return res.redirect("/listings/new");
  }

  const { url, filename } = req.file;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image?.url;
  if (originalImageUrl) {
    originalImageUrl = originalImageUrl.replace(
      "/upload",
      "/upload/h_300,w_250"
    );
  }

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.editListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true, runValidators: true }
  );

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let isFavorite = false;
  if (req.user) {
    isFavorite = await User.exists({
      _id: req.user._id,
      favorites: listing._id,
    });
  }

  const pageTitle = `${listing.title} in ${listing.location} | Roamly`;
  const pageDescription = (listing.description || "Discover this stay on Roamly.").slice(0, 160);
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: listing.title,
    description: pageDescription,
    image: listing.image?.url,
    priceRange: `₹${listing.price} per night`,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.location,
      addressCountry: listing.country,
    },
    url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
  }).replace(/</g, "\\u003c");

  res.render("listings/show.ejs", {
    listing,
    isFavorite: Boolean(isFavorite),
    pageTitle,
    pageDescription,
    structuredData,
  });
};

module.exports.addFavorite = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { favorites: listing._id },
  });

  req.flash("success", "Added to your wishlist!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.removeFavorite = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { favorites: listing._id },
  });

  req.flash("success", "Removed from your wishlist!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);

  if (!deletedListing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  await User.updateMany(
    { favorites: deletedListing._id },
    { $pull: { favorites: deletedListing._id } }
  );

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
