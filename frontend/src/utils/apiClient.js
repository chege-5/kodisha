import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export function getFriendlyError(err, fallback = 'We could not complete that request. Please try again.') {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.code === 'ECONNABORTED') return 'The request took too long. Please check your connection and try again.';
  if (!err.response) return 'We could not reach the server. Please check your connection and try again.';
  return fallback;
}

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
