const { config } = require('../config.js');
const accounts = require('../models/accounts.js');
const { passwordChangedEmail, passwordResetEmail } = require('../utils/emailTemplates.js');
const { mailConfigured, sendInBackground } = require('../utils/mailer.js');
const { DUMMY_HASH, clearAuthCookie, hashPassword, newResetToken, setAuthCookie, sha256, signToken, verifyPassword } = require('../utils/security.js');

// POST /api/auth/register: hash password, create user + business profile, sign in.
async function register(req, res) {
  const { email, password, firstName, lastName, phone, role, business } = req.body;

  if (await accounts.findRowByEmail(email)) {
    return res.status(409).json({
      message: 'An account with this email already exists.',
      errors: { email: 'This email is already registered' },
    });
  }

  const passwordHash = await hashPassword(password);
  let userId;
  try {
    userId = await accounts.createUserWithBusiness({
      user: { email, passwordHash, firstName, lastName, phone, role },
      business,
    });
  } catch (err) {
    if (err.code === 'ACCOUNT_EXISTS' || String(err.code).startsWith('SQLITE_CONSTRAINT')) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
        errors: { email: 'This email is already registered' },
      });
    }
    throw err;
  }

  const user = accounts.toPublic(await accounts.findRowById(userId));
  setAuthCookie(res, signToken(user)); // account creation signs the user in
  res.status(201).json({ message: 'Account created.', user });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const row = await accounts.findRowByEmail(email);
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return res.status(401).json({ message: 'Incorrect email or password.' });

  const user = accounts.toPublic(row);
  setAuthCookie(res, signToken(user));
  res.json({ message: 'Signed in.', user });
}

const RESEND_COOLDOWN_SECONDS = 60;

// POST /api/auth/forgot-password: the response is identical whether or not the email exists.
async function forgotPassword(req, res) {
  const response = {
    message: 'If an account exists for that email, a reset link is on its way.',
    expiresInMinutes: config.resetTokenTtlMinutes,
  };
  const row = await accounts.findRowByEmail(req.body.email);

  // One email per minute per account, so nobody can flood an inbox with reset emails.
  // Skipped in local development without SMTP so the console/UI link always works.
  const realMail = mailConfigured || config.isProd;
  const throttled = row && realMail && await accounts.recentResetTokenExists(row.id, RESEND_COOLDOWN_SECONDS);

  if (row && !throttled) {
    const { raw, hash } = newResetToken();
    const expiresAt = new Date(Date.now() + config.resetTokenTtlMinutes * 60_000).toISOString();
    await accounts.saveResetToken(row.id, hash, expiresAt);

    const link = `${config.clientOrigin}/reset-password?token=${raw}`;
    // Not awaited: response time must not reveal whether the email exists.
    sendInBackground(
      row.email,
      passwordResetEmail({ firstName: row.first_name, link, minutes: config.resetTokenTtlMinutes })
    );
    // Development shortcut only, and only when no real email is being sent.
    if (!config.isProd && !mailConfigured) response.devResetLink = link;
  }
  res.json(response);
}

// POST /api/auth/verify-reset-token: lets the reset page reject a bad or expired link before the person types a password.
async function verifyResetToken(req, res) {
  res.json({ valid: !!(await accounts.findValidResetToken(sha256(req.body.token))) });
}

// POST /api/auth/reset-password: the token is single-use and expires.
async function resetPassword(req, res) {
  const { token, password } = req.body;
  const record = await accounts.findValidResetToken(sha256(token));
  if (!record) {
    return res.status(400).json({
      message: 'This reset link is invalid or has expired. Request a new one.',
      errors: { token: 'This reset link is invalid or has expired' },
    });
  }
  await accounts.consumeResetToken(record.id, record.user_id, await hashPassword(password));

  const user = await accounts.findRowById(record.user_id);
  if (user) sendInBackground(user.email, passwordChangedEmail({ firstName: user.first_name }));
  res.json({ message: 'Password updated. You can now sign in.' });
}

// GET /api/auth/profile (protected)
const profile = (req, res) => res.json({ user: req.user });

// POST /api/auth/logout
function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Signed out.' });
}

module.exports = { register, login, forgotPassword, verifyResetToken, resetPassword, profile, logout };
