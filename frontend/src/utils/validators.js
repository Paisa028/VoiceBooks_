
import {
  parsePhoneNumberFromString,
} from "libphonenumber-js";

// Client-side checks give instant feedback.
// The server must independently validate submitted data.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_RULES = [
  {
    id: "len",
    label: "At least 8 characters",
    hint: "at least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "lower",
    label: "A lowercase letter",
    hint: "a lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "upper",
    label: "An uppercase letter",
    hint: "an uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "num",
    label: "A number",
    hint: "a number",
    test: (p) => /\d/.test(p),
  },
];

const required = (value, message) =>
  String(value ?? "").trim() ? undefined : message;

const clean = (errors) =>
  Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value)
  );

const emailError = (value) => {
  const email = String(value ?? "").trim();

  if (!email) return "Email is required";

  if (!EMAIL_RE.test(email)) {
    return "Enter a valid email address";
  }

  return undefined;
};

const passwordError = (password) => {
  const value = String(password ?? "");

  if (!value) return "Password is required";

  const failed = PASSWORD_RULES.find(
    (rule) => !rule.test(value)
  );

  if (failed) {
    return `Password needs ${failed.hint}`;
  }

  return value.length > 72
    ? "Password must be 72 characters or fewer"
    : undefined;
};

const confirmError = (password, confirmation) => {
  if (!confirmation) return "Confirm your password";

  if (password !== confirmation) {
    return "Passwords do not match";
  }

  return undefined;
};

// Optional phone field.
// International E.164 numbers are required when supplied.
export const phoneError = (value) => {
  const phone = String(value ?? "").trim();

  if (!phone) return undefined;

  if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
    return "Enter a number with its country code, e.g. +27821234567";
  }

  const parsed = parsePhoneNumberFromString(phone);

  if (!parsed || !parsed.isValid()) {
    return "Enter a valid phone number for the selected country code";
  }

  return undefined;
};

export const validateLogin = (values) =>
  clean({
    email: emailError(values.email),
    password: required(
      values.password,
      "Password is required"
    ),
  });

export const validateAccount = (values) =>
  clean({
    firstName: required(
      values.firstName,
      "First name is required"
    ),
    lastName: required(
      values.lastName,
      "Last name is required"
    ),
    phone: phoneError(values.phone),
    email: emailError(values.email),
    password: passwordError(values.password),
    confirmPassword: confirmError(
      values.password,
      values.confirmPassword
    ),
  });

export const validateForgot = (values) =>
  clean({
    email: emailError(values.email),
  });

export const validateReset = (values) =>
  clean({
    password: passwordError(values.password),
    confirmPassword: confirmError(
      values.password,
      values.confirmPassword
    ),
  });

export const validateBusiness = (values) => {
  const businessName = String(
    values.businessName ?? ""
  ).trim();

  return clean({
    businessName:
      businessName.length < 2
        ? "Enter a business name with at least 2 characters"
        : undefined,
    industry: required(
      values.industry,
      "Select an industry"
    ),
    businessSize: required(
      values.businessSize,
      "Select a business size"
    ),
    country: required(
      values.country,
      "Select a country"
    ),
    currency: required(
      values.currency,
      "Select a currency"
    ),
  });
};

export const validateSage = (values) =>
  clean({
    region: required(
      values.region,
      "Select your Sage region"
    ),
  });
