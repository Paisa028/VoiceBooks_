const { z } = require('zod');

const SELF_ASSIGNABLE_ROLES = [
  'business_owner',
  'accountant',
  'bookkeeper'
];

// --------------------------------------------------
// EMAIL
// --------------------------------------------------

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

// --------------------------------------------------
// NAME
// --------------------------------------------------

const name = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60, `${label} is too long`);

// --------------------------------------------------
// PHONE
// --------------------------------------------------

const phone = z
  .string()
  .trim()
  .regex(
    /^\+?[0-9\s-]{7,15}$/,
    'Enter a valid phone number'
  )
  .optional()
  .or(z.literal(''));

// --------------------------------------------------
// PASSWORD
// --------------------------------------------------

const passwordSchema = z
  .string({
    required_error: 'Password is required'
  })
  .min(1, 'Password is required')
  .min(
    8,
    'Password needs at least 8 characters'
  )
  .max(
    72,
    'Password must be 72 characters or fewer'
  )
  .regex(
    /[a-z]/,
    'Password needs a lowercase letter'
  )
  .regex(
    /[A-Z]/,
    'Password needs an uppercase letter'
  )
  .regex(
    /\d/,
    'Password needs a number'
  );

// --------------------------------------------------
// PASSWORD CONFIRMATION
// --------------------------------------------------

const confirmMatches = (data) =>
  data.password === data.confirmPassword;

const mismatch = {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
};

// --------------------------------------------------
// BUSINESS
// --------------------------------------------------

const business = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, 'Enter your business name')
    .max(120),

  registrationNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default(''),

  vatNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default(''),

  industry: z
    .string()
    .trim()
    .min(1, 'Select an industry')
    .max(60),

  businessSize: z.enum(
    ['1', '2-10', '11-50', '51-200', '200+'],
    {
      errorMap: () => ({
        message: 'Select a business size'
      })
    }
  ),

  country: z
    .string()
    .trim()
    .min(2, 'Select a country')
    .max(60),

  currency: z
    .string()
    .trim()
    .length(3, 'Select a currency')
});

// --------------------------------------------------
// REGISTER
// --------------------------------------------------

const registerSchema = z
  .object({
    firstName: name('First name'),
    lastName: name('Last name'),
    phone,
    email,
    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(1, 'Confirm your password'),

    // "admin" is deliberately not accepted here.
    // This prevents privilege escalation.
    role: z.enum(
      SELF_ASSIGNABLE_ROLES,
      {
        errorMap: () => ({
          message: 'Choose an account type'
        })
      }
    ),

    business
  })
  .refine(
    confirmMatches,
    mismatch
  );

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

const loginSchema = z.object({
  email,

  password: z
    .string()
    .min(1, 'Password is required')
    .max(200)
});

// --------------------------------------------------
// FORGOT PASSWORD
// --------------------------------------------------

const forgotPasswordSchema = z.object({
  email
});

// --------------------------------------------------
// RESET PASSWORD
// --------------------------------------------------

const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .regex(
        /^[a-f0-9]{64}$/,
        'This reset link is invalid'
      ),

    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(
        1,
        'Confirm your password'
      )
  })
  .refine(
    confirmMatches,
    mismatch
  );

// --------------------------------------------------
// SAGE
// --------------------------------------------------

const sageSchema = z
  .object({
    action: z.enum([
      'connect',
      'skip'
    ]),

    region: z
      .string()
      .trim()
      .max(40)
      .optional()
  })
  .refine(
    (data) =>
      data.action === 'skip' ||
      !!data.region,
    {
      path: ['region'],
      message: 'Select your Sage region'
    }
  );

// --------------------------------------------------
// VERIFY RESET TOKEN
// --------------------------------------------------

const verifyResetTokenSchema = z.object({
  token: z
    .string()
    .regex(
      /^[a-f0-9]{64}$/,
      'This reset link is invalid'
    )
});

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  SELF_ASSIGNABLE_ROLES,
  passwordSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sageSchema,
  verifyResetTokenSchema
};