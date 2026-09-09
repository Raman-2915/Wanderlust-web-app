if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const bookingRouter = require("./routes/booking.js");
const apiRouter = require("./routes/api.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

const db_url = process.env.ATLASDB_URL;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret: process.env.SECRET || "test-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

if (process.env.NODE_ENV !== "test") {
  sessionOptions.store = MongoStore.create({
    mongoUrl: db_url,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600,
  });

  sessionOptions.store.on("error", (err) => {
    console.error("Mongo session store error:", err);
  });
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/api/v1", apiRouter);
app.use("/listings", listingRouter);
app.use("/listings", reviewRouter);
app.use("/listings", bookingRouter);
app.use("/", userRouter);

app.all(/.*/, (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  console.error(err);

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(statusCode).json({ success: false, message });
  }

  res.status(statusCode).render("listings/error.ejs", { message });
});

async function startServer() {
  if (!db_url) {
    throw new Error("ATLASDB_URL is not configured");
  }
  await mongoose.connect(db_url);
  console.log("Connection successful to database");

  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

if (require.main === module && process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
}

module.exports = { app, startServer };
