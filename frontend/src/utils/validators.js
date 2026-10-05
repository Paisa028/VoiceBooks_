// Client-side checks give instant feedback. The server re-validates everything.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s-]{7,15}$/;

export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', hint: 'at least 8 characters', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', hint: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', hint: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'num', label: 'A number', hint: 'a number', test: (p) => /\d/.test(p) },
];

const required = (v, message) => (String(v ?? '').trim() ? undefined : message);
const clean = (errs) => Object.fromEntries(Object.entries(errs).filter(([, v]) => v));

const emailError = (v) =>
  !v.trim() ? 'Email is required' : !EMAIL_RE.test(v.trim()) ? 'Enter a valid email address' : undefined;

const passwordError = (p) => {
  if (!p) return 'Password is required';
  const failed = PASSWORD_RULES.find((r) => !r.test(p));
  if (failed) return `Password needs ${failed.hint}`;
  return p.length > 72 ? 'Password must be 72 characters or fewer' : undefined;
};

const confirmError = (p, c) => (!c ? 'Confirm your password' : p !== c ? 'Passwords do not match' : undefined);

export const validateLogin = (v) =>
  clean({ email: emailError(v.email), password: required(v.password, 'Password is required') });

export const validateAccount = (v) =>
  clean({
    firstName: required(v.firstName, 'First name is required'),
    lastName: required(v.lastName, 'Last name is required'),
    phone: v.phone.trim() && !PHONE_RE.test(v.phone.trim()) ? 'Enter a valid phone number' : undefined,
    email: emailError(v.email),
    password: passwordError(v.password),
    confirmPassword: confirmError(v.password, v.confirmPassword),
  });

export const validateForgot = (v) => clean({ email: emailError(v.email) });

export const validateReset = (v) =>
  clean({ password: passwordError(v.password), confirmPassword: confirmError(v.password, v.confirmPassword) });

export const validateBusiness = (v) =>
  clean({
    businessName: v.businessName.trim().length < 2 ? 'Enter your business name' : undefined,
    industry: required(v.industry, 'Select an industry'),
    businessSize: required(v.businessSize, 'Select a business size'),
    country: required(v.country, 'Select a country'),
    currency: required(v.currency, 'Select a currency'),
  });

export const validateSage = (v) => clean({ region: required(v.region, 'Select your Sage region') });
