
const { Router } = require("express");
const { rateLimit } = require("express-rate-limit");

const { config } = require("../config.js");
const { authenticate } = require("../middleware/auth.js");
const { validate } = require("../middleware/validate.js");
const ctrl = require("../controllers/auth.controller.js");

const {
  forgotPasswordSchema,
  googleRegisterSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
} = require("../validators/auth.schemas.js");

const router = Router();

// Limit authentication attempts.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProd ? 20 : 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message:
      "Too many attempts. Please try again in a few minutes.",
  },
});

// Email and password registration.
router.post(
  "/register",
  limiter,
  validate(registerSchema),
  ctrl.register
);

// Email and password login.
router.post(
  "/login",
  limiter,
  validate(loginSchema),
  ctrl.login
);

// Google login for already-linked accounts.
router.post(
  "/google/login",
  limiter,
  ctrl.googleLogin
);

// Google registration with business validation.
router.post(
  "/google/register",
  limiter,
  validate(googleRegisterSchema),
  ctrl.googleRegister
);

// Link a Google account to an existing account.
router.post(
  "/google/link",
  limiter,
  authenticate,
  ctrl.googleLink
);

// Request a password reset.
router.post(
  "/forgot-password",
  limiter,
  validate(forgotPasswordSchema),
  ctrl.forgotPassword
);

// Verify a password reset token.
router.post(
  "/verify-reset-token",
  limiter,
  validate(verifyResetTokenSchema),
  ctrl.verifyResetToken
);

// Reset the account password.
router.post(
  "/reset-password",
  limiter,
  validate(resetPasswordSchema),
  ctrl.resetPassword
);

// End the current session.
router.post(
  "/logout",
  ctrl.logout
);

// Get the authenticated user's profile.
router.get(
  "/profile",
  authenticate,
  ctrl.profile
);

module.exports = router;
