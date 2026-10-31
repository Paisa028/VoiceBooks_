
const { Router } = require("express");
const crypto = require("node:crypto");

const { config } = require("../config.js");
const { authenticate } = require("../middleware/auth.js");

const {
  exchangeAuthorizationCode,
} = require("../services/sageOAuthService.js");

const {
  saveConnection,
  getConnectionStatus,
} = require("../models/sqliteSageConnections.js");

const {
  getSageCompanies,
} = require("../services/sageSouthAfricaService.js");

const router = Router();

const SAGE_AUTHORIZE_URL =
  "https://www.sageone.com/oauth2/auth/central?filter=apiv3.1";

const OAUTH_STATE_COOKIE = "sage_oauth_state";

const stateCookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: "lax",
  path: "/api/sage",
};

function requireBusinessOwner(req, res, next) {
  if (req.user.role !== "business_owner") {
    return res.status(403).json({
      message:
        "Only Business Owners can manage Sage integration.",
    });
  }

  next();
}

// INTERNATIONAL: Start Sage OAuth authorization.
router.get(
  "/connect",
  authenticate,
  requireBusinessOwner,
  (req, res) => {
    const clientId = process.env.SAGE_CLIENT_ID;
    const clientSecret = process.env.SAGE_CLIENT_SECRET;
    const redirectUri = process.env.SAGE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(503).json({
        message: "Sage OAuth configuration is incomplete.",
      });
    }

    let callbackUrl;

    try {
      callbackUrl = new URL(redirectUri);
    } catch {
      return res.status(503).json({
        message: "Invalid Sage redirect URI.",
      });
    }

    if (callbackUrl.pathname !== "/api/sage/callback") {
      return res.status(503).json({
        message:
          "SAGE_REDIRECT_URI must point to /api/sage/callback.",
      });
    }

    const state = crypto.randomBytes(32).toString("hex");

    res.cookie(OAUTH_STATE_COOKIE, state, {
      ...stateCookieOptions,
      maxAge: 10 * 60 * 1000,
    });

    const authorizationUrl = new URL(SAGE_AUTHORIZE_URL);

    authorizationUrl.searchParams.set(
      "response_type",
      "code"
    );

    authorizationUrl.searchParams.set(
      "client_id",
      clientId
    );

    authorizationUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    authorizationUrl.searchParams.set(
      "scope",
      "readonly"
    );

    authorizationUrl.searchParams.set(
      "state",
      state
    );

    return res.redirect(302, authorizationUrl.toString());
  }
);

// INTERNATIONAL: Receive Sage OAuth callback.
router.get(
  "/callback",
  authenticate,
  requireBusinessOwner,
  async (req, res) => {
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
    const returnedState = req.query.state;

    res.clearCookie(
      OAUTH_STATE_COOKIE,
      stateCookieOptions
    );

    if (
      typeof expectedState !== "string" ||
      typeof returnedState !== "string" ||
      !/^[a-f0-9]{64}$/.test(expectedState) ||
      !/^[a-f0-9]{64}$/.test(returnedState) ||
      !crypto.timingSafeEqual(
        Buffer.from(expectedState, "hex"),
        Buffer.from(returnedState, "hex")
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid or expired Sage authorization state.",
      });
    }

    if (req.query.error) {
      return res.status(400).json({
        message: "Sage authorization was cancelled or denied.",
        authorized: false,
      });
    }

    const code = req.query.code;

    if (typeof code !== "string" || !code) {
      return res.status(400).json({
        message:
          "Sage did not return an authorization code.",
        authorized: false,
      });
    }

    try {
      const tokens = await exchangeAuthorizationCode(code);

      saveConnection(req.user.id, tokens);

      return res.status(200).json({
        message:
          "Sage authorization received. Company verification is still required.",
        authorized: true,
        connected: false,
      });
    } catch (error) {
      console.error(
        "Sage OAuth callback failed:",
        error.message
      );

      return res.status(502).json({
        message: "Unable to complete Sage authorization.",
        authorized: false,
        connected: false,
      });
    }
  }
);

// INTERNATIONAL: Read the saved connection status.
router.get(
  "/status",
  authenticate,
  requireBusinessOwner,
  (req, res) => {
    try {
      const connection = getConnectionStatus(req.user.id);

      return res.json({
        ...connection,
        authorized:
          connection.status === "authorized" ||
          connection.status === "connected",
        connected: connection.status === "connected",
      });
    } catch {
      return res.status(500).json({
        message:
          "Unable to retrieve Sage connection status.",
      });
    }
  }
);

// SOUTH AFRICA: Read-only company connection test.
// Uses one development Sage account, not per-customer credentials.
router.get(
  "/sa/companies",
  authenticate,
  requireBusinessOwner,
  async (req, res) => {
    // Shared development credentials must not be exposed
    // to multiple customers on a public deployment.
    if (config.isProd) {
      return res.status(404).json({
        message: "Not found.",
      });
    }

    try {
      const companies = await getSageCompanies();

      return res.json({
        success: true,
        provider: "sage_sa",
        connected: false,
        companies,
        message:
          "Sage South Africa authentication succeeded. Company selection is still required.",
      });
    } catch (error) {
      return res.status(error.status || 502).json({
        success: false,
        provider: "sage_sa",
        connected: false,
        message:
          error.message || "Sage connection test failed.",
      });
    }
  }
);

module.exports = router;
