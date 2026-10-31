
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client();

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Google authentication is not configured.");
  }

  if (
    typeof credential !== "string" ||
    credential.length < 100 ||
    credential.length > 10000
  ) {
    const error = new Error("Invalid Google credential.");
    error.status = 400;
    throw error;
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch {
    const error = new Error(
      "Google authentication failed. Please try again."
    );
    error.status = 401;
    throw error;
  }

  const payload = ticket.getPayload();

  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    const error = new Error(
      "A verified Google account is required."
    );
    error.status = 401;
    throw error;
  }

  return {
    googleSub: payload.sub,
    email: payload.email,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
  };
}

module.exports = {
  verifyGoogleCredential,
};
