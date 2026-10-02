/**
 * Centralized API client connecting Vue 2 to the Node.js SQLite backend
 */
const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Server error occurred.');
  }

  return data;
}

export const api = {
  // Auth & Employee Badges
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  getUsers: () => request('/auth/users'),
  createUser: (userData) => request('/auth/users', { method: 'POST', body: userData }),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  // Products & Inventory
  getProducts: () => request('/products'),
  createProduct: (product) => request('/products', { method: 'POST', body: product }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Sales Transactions & Reports
  createSale: (saleData) => request('/sales', { method: 'POST', body: saleData }),
  getSalesReport: () => request('/sales/report')
};
