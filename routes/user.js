const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { isLoggedIn, saveRedirectUrl } = require("../middleware");
const userController = require("../controllers/user");
const { createAuthRateLimit } = require("../middleware/authRateLimit.js");

const authRateLimit = createAuthRateLimit();

router
  .route("/signup")
  .get(userController.renderSignUpForm)
  .post(authRateLimit, wrapAsync(userController.userSignUp));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    authRateLimit,
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.userLogin
  );

router.get("/profile", isLoggedIn, wrapAsync(userController.renderDashboard));
router.post("/logout", userController.userLogout);

module.exports = router;
