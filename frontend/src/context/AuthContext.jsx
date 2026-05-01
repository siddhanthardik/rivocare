import { createContext, useContext, useEffect, useReducer } from 'react';
import { authService } from '../services';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = { user: null, loading: true, error: null };

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':   return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR':  return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':     return { ...initialState, loading: false };
    default:           return state;
  }
}

// Helper: which /me endpoint to call based on stored role hint
const fetchCurrentUser = async () => {
  try {
    const roleHint = localStorage.getItem('roleHint');
    if (roleHint === 'partner') {
      const res = await api.get('/partner/lab/me');
      return res.data?.user || null;
    }
    // Default: standard user (patient / provider / admin)
    const res = await authService.getMe();
    return res.data?.user || null;
  } catch (err) {
    console.error('Session restoration failed:', err);
    throw err;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { dispatch({ type: 'SET_LOADING', payload: false }); return; }

    fetchCurrentUser()
      .then((user) => dispatch({ type: 'SET_USER', payload: user }))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('roleHint');
        dispatch({ type: 'LOGOUT' });
      });
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      // Standard users never have the partner hint
      localStorage.removeItem('roleHint');
      dispatch({ type: 'SET_USER', payload: res.data.user });
      return { requireOTP: false, user: res.data.user };
    } catch (error) {
      throw error;
    }
  };

  // Dedicated partner login — uses standardized response structure
  const partnerLogin = async (credentials) => {
    try {
      const res = await api.post('/partner/lab/login', credentials);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('roleHint', 'partner');
      dispatch({ type: 'SET_USER', payload: res.data.user });
      return res.data.user;
    } catch (error) {
      throw error;
    }
  };

  const partnerRegister = async (formData) => {
    try {
      const res = await api.post('/partner/lab/register', formData);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('roleHint', 'partner');
      dispatch({ type: 'SET_USER', payload: res.data.user });
      return res.data.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const res = await authService.register(formData);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.removeItem('roleHint');
      dispatch({ type: 'SET_USER', payload: res.data.user });
      return res.data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try { 
      if (localStorage.getItem('roleHint') !== 'partner') {
        await authService.logout(); 
      }
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('roleHint');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user) => dispatch({ type: 'SET_USER', payload: user });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, partnerLogin, partnerRegister }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

