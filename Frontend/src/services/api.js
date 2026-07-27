

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('bg_token');
export const setToken = (token) => localStorage.setItem('bg_token', token);
export const clearToken = () => localStorage.removeItem('bg_token');
export const getUser = () => {
  const u = localStorage.getItem('bg_user');
  return u ? JSON.parse(u) : null;
};
export const setUser = (user) => localStorage.setItem('bg_user', JSON.stringify(user));
export const clearUser = () => localStorage.removeItem('bg_user');

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error(`Network error: Could not connect to server at ${BASE_URL || 'backend'}.`);
  }

  let data = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = {};
    }
  } else {
    const text = await res.text();
    data = { error: text || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      clearUser();
    }
    throw new Error(data.error || `API Error: ${res.status}`);
  }
  return data;
}

export const authApi = {
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email, password, name) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  verifyEmail: (email, code) =>
    request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  resendOtp: (email, purpose) =>
    request('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),
  forgotPassword: (email) =>
    request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyResetOtp: (email, code) =>
    request('/api/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  resetPassword: (email, code, newPassword) =>
    request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),
};

export const profileApi = {
  get: () => request('/api/profile'),
  update: (data) =>
    request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const accountsApi = {
  list: () => request('/api/accounts'),
  listActive: () => request('/api/accounts/active'),
  create: (data) =>
    request('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  archive: (id, targetAccountId = null) =>
    request(`/api/accounts/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ target_account_id: targetAccountId }),
    }),
  reactivate: (id) =>
    request(`/api/accounts/${id}/reactivate`, {
      method: 'POST',
    }),
  remove: (id, targetAccountId = null) =>
    request(`/api/accounts/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ target_account_id: targetAccountId }),
    }),
};

export const transactionsApi = {
  list: () => request('/api/transactions'),
  addManual: (data) =>
    request('/api/transactions/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
};

export const budgetsApi = {
  list: () => request('/api/budgets/plans'),
  create: (data) =>
    request('/api/budgets/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  rollover: (id, data) =>
    request(`/api/budgets/plans/${id}/rollover`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/api/budgets/plans/${id}`, { method: 'DELETE' }),
};

export const goalsApi = {
  list: () => request('/api/goals'),
  create: (data) =>
    request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  fund: (id, data) =>
    request(`/api/goals/${id}/fund`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/api/goals/${id}`, { method: 'DELETE' }),
};

export const subscriptionsApi = {
  list: () => request('/api/subscriptions'),
  create: (data) =>
    request('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/api/subscriptions/${id}`, { method: 'DELETE' }),
};

export const alertsApi = {
  list: () => request('/api/alerts'),
  resolve: (id, data) =>
    request(`/api/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  discard: (id) =>
    request(`/api/alerts/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  list: () => request('/api/categories'),
  upsert: (data) =>
    request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const gatewayApi = {
  status: () => request('/api/gateway/status'),
  heartbeat: () => request('/api/gateway/heartbeat', { method: 'POST' }),
};

export const banksApi = {
  list: () => request('/api/banks'),
};

export const subscribeToEvents = (onMessage) => {
  const token = getToken();
  if (!token) return null;
  const url = `${BASE_URL}/api/events/stream?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (e) {
      // ignore
    }
  };
  return eventSource;
};

