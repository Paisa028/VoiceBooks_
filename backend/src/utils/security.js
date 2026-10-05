const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { config } = require('../config.js');

const COOKIE_NAME = 'vb_token';

// ---- Passwords: bcrypt with a per-password salt ----
const hashPassword = (plain) => bcrypt.hash(plain, config.bcryptRounds);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
// Compared against when the email is unknown so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);

// ---- JWT ----
const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: `${config.sessionMinutes}m`,
  });

const verifyToken = (token) =>
  jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });

// httpOnly cookie: JavaScript (and therefore XSS) can't read the token.
const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/',
});
const setAuthCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: config.sessionMinutes * 60 * 1000 });
const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

// ---- Password reset tokens ----
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const newResetToken = () => {
  const raw = crypto.randomBytes(32).toString('hex'); // 64 hex chars, sent to the user
  return { raw, hash: sha256(raw) }; // only the hash is stored
};

module.exports = { COOKIE_NAME, hashPassword, verifyPassword, DUMMY_HASH, signToken, verifyToken, setAuthCookie, clearAuthCookie, sha256, newResetToken };
