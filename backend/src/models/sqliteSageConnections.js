
const crypto = require("node:crypto");
const { db } = require("../db/index.js");

function getEncryptionKey() {
  const keyHex = process.env.SAGE_TOKEN_ENCRYPTION_KEY;

  if (
    !keyHex ||
    !/^[0-9a-fA-F]{64}$/.test(keyHex)
  ) {
    throw new Error(
      "SAGE_TOKEN_ENCRYPTION_KEY must be a 32-byte hex key."
    );
  }

  return Buffer.from(keyHex, "hex");
}

function encrypt(value) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decrypt(value) {
  const [ivHex, tagHex, dataHex] = value.split(":");

  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted token.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// Initialise the Sage connection table.
db.exec(`
  CREATE TABLE IF NOT EXISTS sage_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL UNIQUE,
    sage_business_id TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id)
      REFERENCES business_profiles(id)
      ON DELETE CASCADE
  );
`);

function getBusinessId(userId) {
  const row = db.prepare(`
    SELECT b.id
    FROM business_profiles b
    JOIN users u ON u.id = b.user_id
    JOIN roles r ON r.id = u.role_id
    WHERE b.user_id = ?
      AND r.name = 'business_owner'
  `).get(userId);

  if (!row) {
    throw new Error(
      "No Business Owner profile found."
    );
  }

  return row.id;
}

// Store or update the authorised Sage connection.
const saveConnection = db.transaction(
  (userId, tokens, sageBusinessId = null) => {
    const businessId = getBusinessId(userId);

    if (
      typeof tokens.accessToken !== "string" ||
      !tokens.accessToken ||
      typeof tokens.refreshToken !== "string" ||
      !tokens.refreshToken ||
      !Number.isFinite(Number(tokens.expiresIn)) ||
      Number(tokens.expiresIn) <= 0
    ) {
      throw new Error("Invalid Sage token response.");
    }

    const accessToken = encrypt(tokens.accessToken);
    const refreshToken = encrypt(tokens.refreshToken);

    const expiresAt = new Date(
      Date.now() + Number(tokens.expiresIn) * 1000
    ).toISOString();

    db.prepare(`
      INSERT INTO sage_connections (
        business_id,
        sage_business_id,
        access_token_encrypted,
        refresh_token_encrypted,
        expires_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'connected')
      ON CONFLICT(business_id) DO UPDATE SET
        sage_business_id =
          COALESCE(
            excluded.sage_business_id,
            sage_connections.sage_business_id
          ),
        access_token_encrypted =
          excluded.access_token_encrypted,
        refresh_token_encrypted =
          excluded.refresh_token_encrypted,
        expires_at = excluded.expires_at,
        status = 'connected',
        updated_at = CURRENT_TIMESTAMP
    `).run(
      businessId,
      sageBusinessId,
      accessToken,
      refreshToken,
      expiresAt
    );

    db.prepare(`
      UPDATE business_profiles
      SET sage_status = 'connected',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(businessId);

    return {
      connected: true,
      expiresAt,
    };
  }
);

// Backend-only access; never return these tokens to the frontend.
function getConnection(userId) {
  const businessId = getBusinessId(userId);

  const row = db.prepare(`
    SELECT *
    FROM sage_connections
    WHERE business_id = ?
  `).get(businessId);

  if (!row) return null;

  return {
    businessId: row.business_id,
    sageBusinessId: row.sage_business_id,
    accessToken: decrypt(row.access_token_encrypted),
    refreshToken: decrypt(row.refresh_token_encrypted),
    expiresAt: row.expires_at,
    status: row.status,
  };
}

// Safe response for the frontend.
function getConnectionStatus(userId) {
  const businessId = getBusinessId(userId);

  const row = db.prepare(`
    SELECT sage_business_id, expires_at, status
    FROM sage_connections
    WHERE business_id = ?
  `).get(businessId);

  return {
    connected: row?.status === "connected",
    status: row?.status || "not_connected",
    sageBusinessId: row?.sage_business_id || null,
    expiresAt: row?.expires_at || null,
  };
}

module.exports = {
  saveConnection,
  getConnection,
  getConnectionStatus,
};
