const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const Booking = require("../models/booking");

module.exports.renderSignUpForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.userSignUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message || "Unable to create account");
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.userLogin = async (req, res) => {
  req.flash("success", "Welcome back to Wanderlust!");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  delete req.session.redirectUrl;
  res.redirect(redirectUrl);
};

module.exports.userLogout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out");
    res.redirect("/listings");
  });
};

module.exports.renderDashboard = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "favorites",
    populate: { path: "owner", select: "username" },
  });

  const [listings, reviews, bookings] = await Promise.all([
    Listing.find({ owner: req.user._id }).sort({ createdAt: -1 }),
    Review.find({ author: req.user._id })
      .populate("listing", "title")
      .sort({ createdAt: -1 }),
    Booking.find({ guest: req.user._id })
      .populate("listing", "title image location country price")
      .sort({ checkIn: 1 }),
  ]);

  res.render("users/dashboard.ejs", {
    user,
    listings,
    favorites: user.favorites || [],
    reviews,
    bookings,
  });
};
