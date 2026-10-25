import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined; // undefined = same origin

export const tokens = {
  get access() { return localStorage.getItem('tm_access'); },
  get refresh() { return localStorage.getItem('tm_refresh'); },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('tm_access', accessToken);
    if (refreshToken) localStorage.setItem('tm_refresh', refreshToken);
  },
  clear() { localStorage.removeItem('tm_access'); localStorage.removeItem('tm_refresh'); },
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// Refresh-token flow: when the access JWT expires, silently get a new one and retry once.
let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { response, config } = error;
    if (response?.status === 401 && response.data?.code === 'TOKEN_EXPIRED' && !config._retried && tokens.refresh) {
      config._retried = true;
      try {
        refreshing = refreshing || axios.post(`${API_URL}/auth/refresh`, { refreshToken: tokens.refresh }).finally(() => { refreshing = null; });
        const { data } = await refreshing;
        tokens.set(data);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch {
        tokens.clear();
        window.dispatchEvent(new Event('tm:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e, fallback = 'Something went wrong') => e?.response?.data?.message || e?.message || fallback;
export default api;
