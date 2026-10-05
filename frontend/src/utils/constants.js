export const SIGNUP_STEPS = ['Your details', 'Account type', 'Business'];
export const ONBOARDING_STEPS = ['Welcome', 'Connect Sage', 'Done'];

// ids must match the roles accepted by the server (server/src/validators/auth.schemas.js)
export const ROLES = [
  { id: 'business_owner', label: 'Business owner', description: 'I run a business and want my books and cash position in one place.' },
  { id: 'accountant', label: 'Accountant', description: 'I review books, reports and compliance for a practice or its clients.' },
  { id: 'bookkeeper', label: 'Bookkeeper', description: 'I capture transactions and keep records accurate day to day.' },
];

export const INDUSTRIES = [
  'Retail', 'Hospitality', 'Construction and trades', 'Professional services', 'Technology',
  'Health and wellness', 'Manufacturing', 'Transport and logistics', 'Education', 'Non-profit', 'Other',
];

export const BUSINESS_SIZES = [
  { value: '1', label: 'Just me' },
  { value: '2-10', label: '2 to 10 people' },
  { value: '11-50', label: '11 to 50 people' },
  { value: '51-200', label: '51 to 200 people' },
  { value: '200+', label: 'More than 200 people' },
];

export const COUNTRIES = [
  { name: 'Australia', currency: 'AUD' },
  { name: 'Canada', currency: 'CAD' },
  { name: 'Ireland', currency: 'EUR' },
  { name: 'Kenya', currency: 'KES' },
  { name: 'Nigeria', currency: 'NGN' },
  { name: 'South Africa', currency: 'ZAR' },
  { name: 'United Kingdom', currency: 'GBP' },
  { name: 'United States', currency: 'USD' },
];
export const CURRENCIES = ['AUD', 'CAD', 'EUR', 'GBP', 'KES', 'NGN', 'USD', 'ZAR'];

// Edit to match the regions your Sage plan supports.
export const SAGE_REGIONS = ['Canada', 'Ireland', 'South Africa', 'United Kingdom', 'United States'];

export const SAGE_STATUS_LABELS = {
  not_connected: 'Not connected',
  pending: 'Connection started',
  connected: 'Connected',
  skipped: 'Skipped for now',
};
