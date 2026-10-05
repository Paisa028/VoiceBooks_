export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;

  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body
        ? { 'Content-Type': 'application/json' }
        : undefined,
      body: body
        ? JSON.stringify(body)
        : undefined,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      0
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data.message || 'Something went wrong. Try again.',
      res.status,
      data.errors
    );
  }

  return data;
}

const post = (path, body) =>
  request(path, {
    method: 'POST',
    body,
  });

export const api = {
  // ==================================================
  // AUTHENTICATION
  // ==================================================

  register: (payload) =>
    post('/auth/register', payload),

  login: (payload) =>
    post('/auth/login', payload),

  forgotPassword: (payload) =>
    post('/auth/forgot-password', payload),

  resetPassword: (payload) =>
    post('/auth/reset-password', payload),

  verifyResetToken: (token) =>
    post('/auth/verify-reset-token', { token }),

  logout: () =>
    post('/auth/logout'),

  profile: () =>
    request('/auth/profile'),

  // ==================================================
  // ONBOARDING
  // ==================================================

  setSage: (payload) =>
    request('/onboarding/sage', {
      method: 'PUT',
      body: payload,
    }),

  completeOnboarding: () =>
    post('/onboarding/complete'),

  // ==================================================
  // ADMIN
  // ==================================================

  adminUsers: () =>
    request('/admin/users'),

  // ==================================================
  // TRANSACTIONS
  // ==================================================

  getTransactions: () =>
    request('/transactions'),

  getAccountant: () => request('/transactions/accountant'),
  setAccountant: (payload) => request('/transactions/accountant', { method: 'PUT', body: payload }),

  getTransactionById: (id) =>
    request(`/transactions/${id}`),

  processTransaction: (payload) =>
    post('/transactions/process', payload),

  confirmTransaction: (payload) =>
    post('/transactions', payload),

  // ==================================================
  // SETTINGS
  // ==================================================

  getSettings: () =>
    request('/settings'),

  updateSettings: (payload) =>
    request('/settings', {
      method: 'PUT',
      body: payload,
    }),
};
