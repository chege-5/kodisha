import axios from 'axios';

const baseURL = import.meta.env.VITE_URL 
  ? import.meta.env.VITE_URL.replace(/\/$/, '') 
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
});

export function getFriendlyError(err, fallback = 'We could not complete that request. Please try again.') {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.code === 'ECONNABORTED') return 'The request took too long. Please check your connection and try again.';
  if (!err.response) return 'We could not reach the server. Please check your connection and try again.';
  return fallback;
}

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !String(original?.url || '').includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(original);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        isRefreshing = false;
        processQueue(null);
        return api(original);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
