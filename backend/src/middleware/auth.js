const { COOKIE_NAME, verifyToken } = require('../utils/security.js');
const { findRowById, toPublic } = require('../models/accounts.js');

// Protected routes: verifies the JWT, then loads the user fresh from the DB
// so role changes or deleted accounts take effect immediately.
async function authenticate(req, res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const token = req.cookies?.[COOKIE_NAME] || bearer;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

  let payload;
  try { payload = verifyToken(token); }
  catch { return res.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
  try {
    const row = await findRowById(Number(payload.sub));
    if (!row) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    req.user = toPublic(row);
    next();
  } catch (error) {
    next(error);
  }
}

// Role-based access control: requireRole('admin'), requireRole('accountant', 'admin')
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to access this.' });

module.exports = { authenticate, requireRole };
