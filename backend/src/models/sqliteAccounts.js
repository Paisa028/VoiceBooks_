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

/**
 * Create an Accountant or Auditor without granting
 * access to any business or financial records.
 */
const createProfessionalUser = db.transaction(({ user }) => {
  const allowedRoles = ["accountant", "auditor"];

  if (!allowedRoles.includes(user.role)) {
    const error = new Error("Invalid professional role.");
    error.status = 403;
    throw error;
  }

  const role = db
    .prepare("SELECT id FROM roles WHERE name = ?")
    .get(user.role);

  if (!role) {
    const error = new Error(
      "Professional role is not available."
    );
    error.status = 400;
    throw error;
  }

  const result = db
    .prepare(`
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      user.email,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.phone || null,
      role.id
    );

  // Business access requires a separate assignment.
  return Number(result.lastInsertRowid);
});

// Create a Google professional account without business access.
const createGoogleProfessionalUser = db.transaction(
  ({ googleUser, role, passwordHash }) => {
    if (!["accountant", "auditor"].includes(role)) {
      const error = new Error("Invalid professional role.");
      error.status = 403;
      throw error;
    }

    if (
      !googleUser?.googleSub ||
      !googleUser?.email ||
      typeof passwordHash !== "string"
    ) {
      const error = new Error("Invalid Google account.");
      error.status = 400;
      throw error;
    }

    if (
      findRowByEmail(googleUser.email) ||
      findRowByGoogleSub(googleUser.googleSub)
    ) {
      const error = new Error(
        "This account already exists. Sign in instead."
      );
      error.status = 409;
      throw error;
    }

    const roleRow = db
      .prepare("SELECT id FROM roles WHERE name = ?")
      .get(role);

    if (!roleRow) {
      throw new Error("Professional role is unavailable.");
    }

    const result = db.prepare(`
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        role_id,
        onboarding_completed
      )
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      googleUser.email,
      passwordHash,
      googleUser.firstName || "Google",
      googleUser.lastName || "User",
      roleRow.id
    );

    const userId = Number(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO user_google_accounts (
        user_id,
        google_sub
      )
      VALUES (?, ?)
    `).run(userId, googleUser.googleSub);

    return userId;
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


const findRowByGoogleSub = (googleSub) => {
  if (
    typeof googleSub !== "string" ||
    !googleSub.trim()
  ) {
    return null;
  }

  return db.prepare(`
    ${SELECT}
    WHERE u.id = (
      SELECT user_id
      FROM user_google_accounts
      WHERE google_sub = ?
    )
  `).get(googleSub);
};

const linkGoogleAccount = db.transaction(
  (userId, googleSub) => {
    const user = findRowById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const existing = db.prepare(`
      SELECT user_id, google_sub
      FROM user_google_accounts
      WHERE user_id = ? OR google_sub = ?
    `).all(userId, googleSub);

    if (existing.length > 0) {
      throw new Error(
        "This VoiceBooks or Google account is already linked."
      );
    }

    db.prepare(`
      INSERT INTO user_google_accounts
        (user_id, google_sub)
      VALUES (?, ?)
    `).run(userId, googleSub);

    return findRowById(userId);
  }
);

const createGoogleUserWithBusiness = db.transaction(
  ({ googleUser, business, passwordHash }) => {
    if (
      !googleUser?.googleSub ||
      !googleUser?.email ||
      typeof passwordHash !== "string" ||
      !/^\$2[aby]\$/.test(passwordHash) ||
      !business?.businessName ||
      !business?.industry ||
      !business?.businessSize ||
      !business?.country ||
      !business?.currency
    ) {
      const error = new Error(
        "Valid Google account and business details are required."
      );
      error.status = 400;
      throw error;
    }

    if (
      findRowByEmail(googleUser.email) ||
      findRowByGoogleSub(googleUser.googleSub)
    ) {
      const error = new Error(
        "This account already exists. Sign in and link Google instead."
      );
      error.status = 409;
      throw error;
    }

    const role = db.prepare(`
      SELECT id
      FROM roles
      WHERE name = 'business_owner'
    `).get();

    if (!role) {
      throw new Error("Business Owner role is unavailable.");
    }

    const result = db.prepare(`
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role_id
      )
      VALUES (?, ?, ?, ?, NULL, ?)
    `).run(
      googleUser.email,
      passwordHash,
      googleUser.firstName || "Google",
      googleUser.lastName || "User",
      role.id
    );

    const userId = Number(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO business_profiles (
        user_id,
        business_name,
        registration_number,
        vat_number,
        industry,
        business_size,
        country,
        currency
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      business.businessName,
      business.registrationNumber || null,
      business.vatNumber || null,
      business.industry,
      business.businessSize,
      business.country,
      business.currency
    );

    db.prepare(`
      INSERT INTO user_google_accounts (
        user_id,
        google_sub
      )
      VALUES (?, ?)
    `).run(
      userId,
      googleUser.googleSub
    );

    return userId;
  }
);


// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  findRowByEmail,
  findRowById,
  toPublic,
  createUserWithBusiness,
  createProfessionalUser,
  createGoogleUserWithBusiness,
  findRowByGoogleSub,
  linkGoogleAccount,
  setSageStatus,
  updateSettings,
  completeOnboarding,
  listUsers,
  saveResetToken,
  findValidResetToken,
  consumeResetToken,
  recentResetTokenExists,
  createGoogleProfessionalUser,
};
