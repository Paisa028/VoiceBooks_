
const { config } = require("../config.js");
const accounts = require("../models/accounts.js");

const {
  verifyGoogleCredential,
} = require("../services/googleAuthService.js");

const {
  passwordChangedEmail,
  passwordResetEmail,
} = require("../utils/emailTemplates.js");

const {
  mailConfigured,
  sendInBackground,
} = require("../utils/mailer.js");

const {
  DUMMY_HASH,
  clearAuthCookie,
  hashPassword,
  createGoogleAccountPasswordHash,
  newResetToken,
  setAuthCookie,
  sha256,
  signToken,
  verifyPassword,
} = require("../utils/security.js");

const RESEND_COOLDOWN_SECONDS = 60;

const PUBLIC_REGISTRATION_ROLES = [
  "business_owner",
  "accountant",
  "auditor",
];

// Register accounts without granting automatic business access.
async function register(req, res) {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    business,
  } = req.body;

  const requestedRole = role || "business_owner";

  if (!PUBLIC_REGISTRATION_ROLES.includes(requestedRole)) {
    return res.status(403).json({
      message: "Registration is not allowed for this role.",
      errors: {
        role: "Select Business Owner, Accountant or Auditor.",
      },
    });
  }

  if (
    requestedRole === "business_owner" &&
    (!business ||
      typeof business !== "object" ||
      Array.isArray(business))
  ) {
    return res.status(400).json({
      message: "Business details are required.",
      errors: {
        business: "Complete your business information.",
      },
    });
  }

  const existingUser = await accounts.findRowByEmail(email);

  if (existingUser) {
    return res.status(409).json({
      message: "An account with this email already exists.",
      errors: {
        email: "This email is already registered.",
      },
    });
  }

  const passwordHash = await hashPassword(password);

  const userData = {
    email,
    passwordHash,
    firstName,
    lastName,
    phone: phone || null,
    role: requestedRole,
  };

  let userId;

  try {
    if (requestedRole === "business_owner") {
      // Owners create their own business profiles.
      userId = await accounts.createUserWithBusiness({
        user: userData,
        business,
      });
    } else {
      // Professionals are created without business assignments.
      if (typeof accounts.createProfessionalUser !== "function") {
        return res.status(503).json({
          message:
            "Professional account registration is not configured.",
        });
      }

      userId = await accounts.createProfessionalUser({
        user: userData,
      });
    }
  } catch (err) {
    if (
      err.code === "ACCOUNT_EXISTS" ||
      String(err.code || "").startsWith("SQLITE_CONSTRAINT")
    ) {
      return res.status(409).json({
        message: "An account with this email already exists.",
        errors: {
          email: "This email is already registered.",
        },
      });
    }

    if (err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({
        message: err.message,
      });
    }

    throw err;
  }

  const userRow = await accounts.findRowById(userId);

  if (!userRow) {
    return res.status(500).json({
      message: "Account created but could not be loaded.",
    });
  }

  const user = accounts.toPublic(userRow);

  setAuthCookie(res, signToken(user));

  return res.status(201).json({
    message: "Account created.",
    user,
  });
}

// Authenticate using email and password.
async function login(req, res) {
  const { email, password } = req.body;

  const row = await accounts.findRowByEmail(email);

  const validPassword = await verifyPassword(
    password,
    row?.password_hash ?? DUMMY_HASH
  );

  if (!row || !validPassword) {
    return res.status(401).json({
      message: "Incorrect email or password.",
    });
  }

  const user = accounts.toPublic(row);

  setAuthCookie(res, signToken(user));

  return res.json({
    message: "Signed in.",
    user,
  });
}

/**
 * Sign in with Google.
 * Linked users sign in directly.
 * New users continue to VoiceBooks registration.
 */
async function googleLogin(req, res) {
  try {
    const { credential } = req.body || {};

    // Verify the Google identity on the server.
    const googleUser = await verifyGoogleCredential(credential);

    const userRow = await accounts.findRowByGoogleSub(
      googleUser.googleSub
    );

    if (!userRow) {
      // Never link an account using email alone.
      const existingEmailAccount =
        await accounts.findRowByEmail(googleUser.email);

      if (existingEmailAccount) {
        return res.status(409).json({
          code: "GOOGLE_LINK_REQUIRED",
          message:
            "An account with this email already exists. Sign in with your VoiceBooks password and connect Google in your account settings.",
        });
      }

      // A new Google user must complete registration.
      return res.status(404).json({
        code: "GOOGLE_SIGNUP_REQUIRED",
        message:
          "Complete your VoiceBooks registration.",
      });
    }

    // Sign in to the existing linked VoiceBooks account.
    const user = accounts.toPublic(userRow);

    setAuthCookie(res, signToken(user));

    return res.status(200).json({
      message: "Signed in with Google successfully.",
      user,
    });
  } catch (error) {
    console.error(
      "Google login failed:",
      error.message
    );

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to sign in with Google.",
    });
  }
}

// Register a Business Owner using a verified Google account.

async function googleRegister(req, res) {
  try {
    const {
      credential,
      role = "business_owner",
      business,
    } = req.body || {};

    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      return res.status(403).json({
        message: "Registration is not allowed for this role.",
      });
    }

    // Always verify the Google ID token on the server.
    const googleUser = await verifyGoogleCredential(credential);

    const existingEmail = await accounts.findRowByEmail(
      googleUser.email
    );

    const existingGoogle = await accounts.findRowByGoogleSub(
      googleUser.googleSub
    );

    if (existingEmail || existingGoogle) {
      return res.status(409).json({
        message:
          "This account already exists. Please sign in or link your Google account.",
      });
    }

    const passwordHash =
      await createGoogleAccountPasswordHash();

    let userId;

    if (role === "business_owner") {
      if (
        !business ||
        typeof business !== "object" ||
        Array.isArray(business)
      ) {
        return res.status(400).json({
          message: "Business details are required.",
        });
      }

      userId = await accounts.createGoogleUserWithBusiness({
        googleUser,
        passwordHash,
        business,
      });
    } else {
      if (
        typeof accounts.createGoogleProfessionalUser !==
        "function"
      ) {
        return res.status(503).json({
          message:
            "Google professional registration is not configured.",
        });
      }

      userId = await accounts.createGoogleProfessionalUser({
        googleUser,
        role,
        passwordHash,
      });
    }

    const userRow = await accounts.findRowById(userId);

    if (!userRow) {
      throw new Error("Unable to load registered account.");
    }

    const user = accounts.toPublic(userRow);

    setAuthCookie(res, signToken(user));

    return res.status(201).json({
      message: "Google account registered successfully.",
      user,
    });
  } catch (error) {
    const duplicate =
      error.status === 409 ||
      String(error.code || "").startsWith(
        "SQLITE_CONSTRAINT"
      );

    console.error(
      "Google registration failed:",
      error.message
    );

    return res.status(
      duplicate ? 409 : error.status || 500
    ).json({
      message: duplicate
        ? "This account already exists. Please sign in or link your Google account."
        : error.status
          ? error.message
          : "Unable to register with Google.",
    });
  }
}

// Request a password-reset link without revealing account existence.
async function forgotPassword(req, res) {
  const response = {
    message:
      "If an account exists for that email, a reset link is on its way.",
    expiresInMinutes: config.resetTokenTtlMinutes,
  };

  const row = await accounts.findRowByEmail(req.body.email);

  const realMail = mailConfigured || config.isProd;

  const throttled =
    row &&
    realMail &&
    (await accounts.recentResetTokenExists(
      row.id,
      RESEND_COOLDOWN_SECONDS
    ));

  if (row && !throttled) {
    const { raw, hash } = newResetToken();

    const expiresAt = new Date(
      Date.now() + config.resetTokenTtlMinutes * 60_000
    ).toISOString();

    await accounts.saveResetToken(
      row.id,
      hash,
      expiresAt
    );

    const link =
      `${config.clientOrigin}/reset-password?token=${encodeURIComponent(raw)}`;

    sendInBackground(
      row.email,
      passwordResetEmail({
        firstName: row.first_name,
        link,
        minutes: config.resetTokenTtlMinutes,
      })
    );

    if (!config.isProd && !mailConfigured) {
      response.devResetLink = link;
    }
  }

  return res.json(response);
}

// Check a password-reset token.
async function verifyResetToken(req, res) {
  const tokenHash = sha256(req.body.token);

  const record = await accounts.findValidResetToken(
    tokenHash
  );

  return res.json({
    valid: Boolean(record),
  });
}

// Reset a password using a single-use token.
async function resetPassword(req, res) {
  const { token, password } = req.body;

  const record = await accounts.findValidResetToken(
    sha256(token)
  );

  if (!record) {
    return res.status(400).json({
      message:
        "This reset link is invalid or has expired. Request a new one.",
      errors: {
        token: "This reset link is invalid or has expired.",
      },
    });
  }

  const passwordHash = await hashPassword(password);

  await accounts.consumeResetToken(
    record.id,
    record.user_id,
    passwordHash
  );

  const user = await accounts.findRowById(
    record.user_id
  );

  if (user) {
    sendInBackground(
      user.email,
      passwordChangedEmail({
        firstName: user.first_name,
      })
    );
  }

  return res.json({
    message: "Password updated. You can now sign in.",
  });
}

// Load the current profile from the database.
async function profile(req, res) {
  const userRow = await accounts.findRowById(req.user.id);

  if (!userRow) {
    clearAuthCookie(res);

    return res.status(401).json({
      message: "Account not found. Please sign in again.",
    });
  }

  const user = accounts.toPublic(userRow);

  return res.json({ user });
}

// Clear the authentication cookie.
function logout(req, res) {
  clearAuthCookie(res);

  return res.json({
    message: "Signed out.",
  });
}

async function googleLink(req, res) {
  try {
    const { credential, password } = req.body || {};

    if (
      typeof credential !== "string" ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Google credential and current password are required.",
      });
    }

    const userRow = await accounts.findRowById(req.user.id);

    if (!userRow) {
      return res.status(401).json({
        message: "Please sign in again.",
      });
    }

    // Confirm the user's current VoiceBooks password.
    const validPassword = await verifyPassword(
      password,
      userRow.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Incorrect VoiceBooks password.",
      });
    }

    // Verify the Google identity on the server.
    const googleUser = await verifyGoogleCredential(
      credential
    );

    // Never link accounts just because email addresses match.
    const linkedUser = await accounts.linkGoogleAccount(
      userRow.id,
      googleUser.googleSub
    );

    return res.json({
      message: "Google account linked successfully.",
      user: accounts.toPublic(linkedUser),
    });
  } catch (error) {
    const conflict =
      String(error.code || "").startsWith(
        "SQLITE_CONSTRAINT"
      ) ||
      error.message ===
        "This VoiceBooks or Google account is already linked.";

    if (conflict) {
      return res.status(409).json({
        message:
          "This Google or VoiceBooks account is already linked.",
      });
    }

    console.error("Google linking failed:", error.message);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to link Google account.",
    });
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  googleRegister,
  googleLink,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  profile,
  logout,
};

