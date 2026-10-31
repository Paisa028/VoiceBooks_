
const { z } = require("zod");
const {
  parsePhoneNumberFromString,
} = require("libphonenumber-js");

// --------------------------------------------------
// REGISTRATION ROLES
// --------------------------------------------------

// Recognised account roles.
// The controller must enforce registration permissions.
const REGISTRATION_ROLES = [
  "business_owner",
  "accountant",
  "auditor",
];

// Only Business Owners can register publicly.
// Accountant and Auditor require authorised access.
const SELF_ASSIGNABLE_ROLES = ["business_owner"];

// --------------------------------------------------
// EMAIL
// --------------------------------------------------

// Validate and normalise email addresses.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

// --------------------------------------------------
// NAME
// --------------------------------------------------

// Validate first and last names.
const name = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60, `${label} is too long`);

// --------------------------------------------------
// PHONE
// --------------------------------------------------

// Phone is optional, but supplied numbers must use
// international E.164 format and pass country validation.
const phone = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (value) => {
      if (!value) return true;

      // Require a country calling code, for example +27.
      if (!/^\+[1-9]\d{1,14}$/.test(value)) {
        return false;
      }

      const parsed = parsePhoneNumberFromString(value);

      // Check whether the number matches a valid
      // numbering pattern for its country.
      return Boolean(parsed && parsed.isValid());
    },
    {
      message:
        "Enter a valid phone number with its country code, e.g. +27821234567",
    }
  )
  .transform((value) => value || null);

// --------------------------------------------------
// PASSWORD
// --------------------------------------------------

// Enforce the same password rules as the frontend.
const passwordSchema = z
  .string({
    required_error: "Password is required",
  })
  .min(1, "Password is required")
  .min(
    8,
    "Password needs at least 8 characters"
  )
  .max(
    72,
    "Password must be 72 characters or fewer"
  )
  .regex(
    /[a-z]/,
    "Password needs a lowercase letter"
  )
  .regex(
    /[A-Z]/,
    "Password needs an uppercase letter"
  )
  .regex(
    /\d/,
    "Password needs a number"
  );

// --------------------------------------------------
// PASSWORD CONFIRMATION
// --------------------------------------------------

// Ensure password and confirmation match.
const confirmMatches = (data) =>
  data.password === data.confirmPassword;

const mismatch = {
  path: ["confirmPassword"],
  message: "Passwords do not match",
};

// --------------------------------------------------
// BUSINESS
// --------------------------------------------------

// Validate business information submitted during signup.
const business = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Enter your business name")
    .max(120),

  registrationNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default(""),

  vatNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default(""),

  industry: z
    .string()
    .trim()
    .min(1, "Select an industry")
    .max(60),

  businessSize: z.enum(
    ["1", "2-10", "11-50", "51-200", "200+"],
    {
      errorMap: () => ({
        message: "Select a business size",
      }),
    }
  ),

  country: z
    .string()
    .trim()
    .min(2, "Select a country")
    .max(60),

  currency: z
    .string()
    .trim()
    .length(3, "Select a currency"),
});

// --------------------------------------------------
// REGISTER
// --------------------------------------------------

// Validate email/password registration.
// Role recognition does not grant permission.
// The controller decides whether registration is allowed.
const registerSchema = z
  .object({
    firstName: name("First name"),
    lastName: name("Last name"),

    phone,
    email,
    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(1, "Confirm your password"),

    // Admin is deliberately excluded.
    // Privileged roles need server-side authorisation.
    role: z.enum(REGISTRATION_ROLES, {
  errorMap: () => ({
    message: 'Choose an account type',
  }),
}),

    business,
  })
  .refine(confirmMatches, mismatch);

// --------------------------------------------------
// GOOGLE REGISTER
// --------------------------------------------------

// Validate Google registration requests.
// The controller must verify the Google ID token.
const googleRegisterSchema = z.object({
  credential: z
    .string()
    .min(1, "Google authentication is required"),

  // Public Google signup currently supports
  // Business Owner accounts only.
  role: z.enum(["business_owner"], {
    errorMap: () => ({
      message:
        "Google registration is currently available for Business Owners only.",
    }),
  }),

  business,
});

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

// Validate traditional email/password login.
const loginSchema = z.object({
  email,

  password: z
    .string()
    .min(1, "Password is required")
    .max(200),
});

// --------------------------------------------------
// FORGOT PASSWORD
// --------------------------------------------------

// Validate email before requesting a reset link.
const forgotPasswordSchema = z.object({
  email,
});

// --------------------------------------------------
// RESET PASSWORD
// --------------------------------------------------

// Validate the reset token and new password.
const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .regex(
        /^[a-f0-9]{64}$/,
        "This reset link is invalid"
      ),

    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(1, "Confirm your password"),
  })
  .refine(confirmMatches, mismatch);

// --------------------------------------------------
// SAGE
// --------------------------------------------------

// Require a Sage region when starting a connection.
// Skipping the connection does not require a region.
const sageSchema = z
  .object({
    action: z.enum(["connect", "skip"]),

    region: z
      .string()
      .trim()
      .max(40)
      .optional(),
  })
  .refine(
    (data) =>
      data.action === "skip" ||
      Boolean(data.region),
    {
      path: ["region"],
      message: "Select your Sage region",
    }
  );

// --------------------------------------------------
// VERIFY RESET TOKEN
// --------------------------------------------------

// Validate the token format before database lookup.
const verifyResetTokenSchema = z.object({
  token: z
    .string()
    .regex(
      /^[a-f0-9]{64}$/,
      "This reset link is invalid"
    ),
});

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  SELF_ASSIGNABLE_ROLES,
  REGISTRATION_ROLES,
  passwordSchema,
  registerSchema,
  googleRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sageSchema,
  verifyResetTokenSchema,
};
