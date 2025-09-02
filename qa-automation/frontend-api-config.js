// Add this to your frontend src/config/api.js or similar

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app';

export const API = {
  // Auth endpoints
  register: `${API_BASE_URL}/api/auth/register`,
  login: `${API_BASE_URL}/api/auth/login`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  refresh: `${API_BASE_URL}/api/auth/refresh`,
  
  // Products endpoints
  products: `${API_BASE_URL}/api/products`,
  product: (id) => `${API_BASE_URL}/api/products/${id}`,
  
  // Vendors endpoints
  vendors: `${API_BASE_URL}/api/vendors`,
  vendor: (id) => `${API_BASE_URL}/api/vendors/${id}`,
  
  // Orders endpoints
  createOrder: `${API_BASE_URL}/api/orders/create`,
  orders: `${API_BASE_URL}/api/orders`,
  order: (id) => `${API_BASE_URL}/api/orders/${id}`,
  
  // Search
  search: `${API_BASE_URL}/api/search/products`,
};

// Auth helper
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Example usage:
// const response = await fetch(API.products, {
//   headers: getAuthHeader()
// });
