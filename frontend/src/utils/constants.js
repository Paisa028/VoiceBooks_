
export const SIGNUP_STEPS = [
  "Your details",
  "Account type",
  "Business",
];

export const ONBOARDING_STEPS = [
  "Welcome",
  "Connect Sage",
  "Done",
];

export const ROLES = [
  {
    id: "business_owner",
    label: "Business owner",
    description:
      "I run a business and want my books and cash position in one place.",
  },
  {
    id: "accountant",
    label: "Accountant",
    description:
      "I review books, reports and compliance for a practice or its clients.",
  },
  {
   
  id: "auditor",
  label: "Auditor",
  description:
    "I review financial records, reports and audit history without changing transactions.",
},
];

export const INDUSTRIES = [
  "Retail",
  "Hospitality",
  "Construction and trades",
  "Professional services",
  "Technology",
  "Health and wellness",
  "Manufacturing",
  "Transport and logistics",
  "Education",
  "Non-profit",
  "Other",
];

export const BUSINESS_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2 to 10 people" },
  { value: "11-50", label: "11 to 50 people" },
  { value: "51-200", label: "51 to 200 people" },
  { value: "200+", label: "More than 200 people" },
];

export const COUNTRIES = [
  { name: "Australia", currency: "AUD" },
  { name: "Canada", currency: "CAD" },
  { name: "Ireland", currency: "EUR" },
  { name: "Kenya", currency: "KES" },
  { name: "Nigeria", currency: "NGN" },
  { name: "South Africa", currency: "ZAR" },
  { name: "United Kingdom", currency: "GBP" },
  { name: "United States", currency: "USD" },
];

export const CURRENCIES = [
  "AUD",
  "CAD",
  "EUR",
  "GBP",
  "KES",
  "NGN",
  "USD",
  "ZAR",
];

// Regions supported by the VoiceBooks integration UI.
// Availability of the international Sage API depends
// on the Sage product and account region.
export const SAGE_REGIONS = [
  "South Africa",
  "United Kingdom",
  "Ireland",
  "Canada",
];

// Select the appropriate Sage integration.
export const SAGE_PROVIDERS = {
  SOUTH_AFRICA: "sage_sa",
  INTERNATIONAL: "sage_international",
};

export const getSageProvider = (region) => {
  if (region === "South Africa") {
    return SAGE_PROVIDERS.SOUTH_AFRICA;
  }

  if (
    [
      "United Kingdom",
      "Ireland",
      "Canada",
    ].includes(region)
  ) {
    return SAGE_PROVIDERS.INTERNATIONAL;
  }

  return null;
};

export const SAGE_PROVIDER_LABELS = {
  sage_sa: "Sage Accounting South Africa",
  sage_international: "Sage Accounting International",
};

export const SAGE_STATUS_LABELS = {
  not_connected: "Not connected",
  pending: "Setup pending",
  authorized: "Authorization received",
  connected: "Connected",
  skipped: "Skipped for now",
};
