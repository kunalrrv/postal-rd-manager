import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rd_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '\u20B90';
  return '\u20B9' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatCurrencyDecimal(amount) {
  if (amount === null || amount === undefined) return '\u20B90.00';
  return '\u20B9' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
