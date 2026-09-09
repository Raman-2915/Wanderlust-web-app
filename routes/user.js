const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { isLoggedIn, saveRedirectUrl } = require("../middleware");
const userController = require("../controllers/user");

router
  .route("/signup")
  .get(userController.renderSignUpForm)
  .post(wrapAsync(userController.userSignUp));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.userLogin
  );

router.get("/profile", isLoggedIn, wrapAsync(userController.renderDashboard));
router.get("/logout", userController.userLogout);

module.exports = router;
