const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { config } = require('../config.js');
const { authenticate } = require('../middleware/auth.js');
const { validate } = require('../middleware/validate.js');
const ctrl = require('../controllers/auth.controller.js');
const { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyResetTokenSchema } = require('../validators/auth.schemas.js');

const router = Router();

// Slows down brute-force and token-guessing attempts.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProd ? 20 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/register', limiter, validate(registerSchema), ctrl.register);
router.post('/login', limiter, validate(loginSchema), ctrl.login);
router.post('/forgot-password', limiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/verify-reset-token', limiter, validate(verifyResetTokenSchema), ctrl.verifyResetToken);
router.post('/reset-password', limiter, validate(resetPasswordSchema), ctrl.resetPassword);
router.post('/logout', ctrl.logout);
router.get('/profile', authenticate, ctrl.profile);

module.exports = router;
