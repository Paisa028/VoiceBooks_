const { db } = require('../db/index.js');

const SELECT = `
  SELECT u.*, r.name AS role, r.label AS role_label,
         b.id AS business_id, b.business_name, b.registration_number, b.vat_number,
         b.industry, b.business_size, b.country, b.currency, b.sage_status, b.sage_region
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN business_profiles b ON b.user_id = u.id`;

const findRowByEmail = (email) =>
  db.prepare(`${SELECT} WHERE u.email = ?`).get(email);

const findRowById = (id) =>
  db.prepare(`${SELECT} WHERE u.id = ?`).get(id);

// Never includes password_hash.
const toPublic = (row) =>
  row && {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    roleLabel: row.role_label,
    onboardingCompleted: !!row.onboarding_completed,
    createdAt: row.created_at,

    business: row.business_id
      ? {
          name: row.business_name,
          registrationNumber: row.registration_number,
          vatNumber: row.vat_number,
          industry: row.industry,
          size: row.business_size,
          country: row.country,
          currency: row.currency,
          sageStatus: row.sage_status,
          sageRegion: row.sage_region,
        }
      : null,
  };

// --------------------------------------------------
// CREATE USER + BUSINESS
// --------------------------------------------------

// User + business profile are created together or not at all.
const createUserWithBusiness = db.transaction(
  ({ user, business }) => {
    const role = db
      .prepare(
        'SELECT id FROM roles WHERE name = ? AND self_assignable = 1'
      )
      .get(user.role);

    if (!role) {
      throw new Error('Invalid role');
    }

    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO users
           (email, password_hash, first_name, last_name, phone, role_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.phone || null,
        role.id
      );

    db.prepare(
      `INSERT INTO business_profiles
         (
           user_id,
           business_name,
           registration_number,
           vat_number,
           industry,
           business_size,
           country,
           currency
         )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      lastInsertRowid,
      business.businessName,
      business.registrationNumber || null,
      business.vatNumber || null,
      business.industry,
      business.businessSize,
      business.country,
      business.currency
    );

    return Number(lastInsertRowid);
  }
);

// --------------------------------------------------
// SAGE
// --------------------------------------------------

const setSageStatus = (
  userId,
  status,
  region = null
) =>
  db
    .prepare(
      `UPDATE business_profiles
       SET sage_status = ?,
           sage_region = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`
    )
    .run(status, region, userId);

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------

const updateSettings = db.transaction(
  (userId, { user, business }) => {
    // Update the user's personal information.
    db.prepare(
      `UPDATE users
       SET first_name = ?,
           last_name = ?,
           phone = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      user.firstName,
      user.lastName,
      user.phone || null,
      userId
    );

    // Update the business information.
    db.prepare(
      `UPDATE business_profiles
       SET business_name = ?,
           registration_number = ?,
           vat_number = ?,
           industry = ?,
           business_size = ?,
           country = ?,
           currency = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      business.businessName,
      business.registrationNumber || null,
      business.vatNumber || null,
      business.industry,
      business.businessSize,
      business.country,
      business.currency,
      userId
    );

    return toPublic(
      findRowById(userId)
    );
  }
);

// --------------------------------------------------
// ONBOARDING
// --------------------------------------------------

const completeOnboarding = (userId) =>
  db
    .prepare(
      `UPDATE users SET onboarding_completed = 1,
       updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(userId);

// --------------------------------------------------
// ADMIN
// --------------------------------------------------

const listUsers = () =>
  db
    .prepare(
      `SELECT u.id, u.email,
              u.first_name,
              u.last_name,
              r.name AS role,
              u.created_at,
              b.business_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN business_profiles b ON b.user_id = u.id
       ORDER BY u.id DESC
       LIMIT 100`
    )
    .all();

// --------------------------------------------------
// PASSWORD RESET TOKENS
// --------------------------------------------------

const saveResetToken = (
  userId,
  tokenHash,
  expiresAt
) => {
  // One live token per user.
  db.prepare(
    'DELETE FROM password_reset_tokens WHERE user_id = ?'
  ).run(userId);

  db.prepare(
    `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`
  ).run(
    userId,
    tokenHash,
    expiresAt
  );
};

const findValidResetToken = (tokenHash) => {
  const row = db
    .prepare(
      `SELECT *
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND used_at IS NULL`
    )
    .get(tokenHash);

  if (!row) {
    return null;
  }

  if (row.used_at) {
    return null;
  }

  if (new Date(row.expires_at) <= new Date()) {
    return null;
  }

  return row;
};

const consumeResetToken = db.transaction(
  (
    tokenId,
    userId,
    passwordHash
  ) => {
    db.prepare(
      `UPDATE users
       SET password_hash = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      passwordHash,
      userId
    );

    db.prepare(
      `UPDATE password_reset_tokens
       SET used_at = datetime('now')
       WHERE id = ?`
    ).run(tokenId);

    db.prepare(
      `DELETE FROM password_reset_tokens
       WHERE user_id = ?
         AND id != ?`
    ).run(
      userId,
      tokenId
    );
  }
);

// True if this user already requested a reset link
// within the last `seconds`.
const recentResetTokenExists = (
  userId,
  seconds
) =>
  !!db
    .prepare(
      `SELECT 1
       FROM password_reset_tokens
       WHERE user_id = ?
         AND created_at > datetime('now', ?)`
    )
    .get(
      userId,
      `-${Number(seconds)} seconds`
    );

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  findRowByEmail,
  findRowById,
  toPublic,
  createUserWithBusiness,
  setSageStatus,
  updateSettings,
  completeOnboarding,
  listUsers,
  saveResetToken,
  findValidResetToken,
  consumeResetToken,
  recentResetTokenExists,
};