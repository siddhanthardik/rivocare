import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Standardize response: Always return res.data via interceptor
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    
    // 🛡️ Global 401 Handling (Session Expiry)
    if (err.response?.status === 401) {
      // 1. Try Refresh Token
      if (!original._retry) {
        original._retry = true;
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token');
          
          // Use axios directly to avoid interceptor loop
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          
          localStorage.setItem('accessToken', newAccess);
          localStorage.setItem('refreshToken', newRefresh);
          
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch (refreshErr) {
          console.error('[AUTH] Refresh failed, purging session');
        }
      }

      // 2. Clear state and Redirect if refresh fails or wasn't possible
      const roleHint = localStorage.getItem('roleHint');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('roleHint');
      
      // Prevent multiple redirects if already on login
      if (!window.location.pathname.includes('/login')) {
        if (roleHint === 'partner') {
          window.location.href = '/partner/lab/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    // 🛡️ Global Error Logging & Debugging
    const errorData = {
      status: err.response?.status,
      method: err.config?.method?.toUpperCase(),
      url: err.config?.url,
      message: err.message,
      timestamp: new Date().toISOString()
    };
    console.error(`[API_ERROR] ${errorData.method} ${errorData.url}`, errorData);

    // 💾 Persist frontend errors to Backend DB
    if (!errorData.url.includes('/logs/frontend-error') && errorData.status >= 400) {
      axios.post(`${api.defaults.baseURL}/logs/frontend-error`, {
        message: `API_${errorData.status}: ${errorData.message}`,
        route: window.location.pathname,
        component: 'AXIOS_INTERCEPTOR',
        stack: `URL: ${errorData.url} | Method: ${errorData.method}`,
        browser: navigator.userAgent
      }).catch(() => {}); // Silent fail for logger
    }

    return Promise.reject(err);
  }
);

export default api;
