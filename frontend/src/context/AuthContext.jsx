import { createContext, useContext, useEffect, useReducer } from 'react';
import { authService } from '../services';

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

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
    authService.getMe()
      .then(({ data }) => dispatch({ type: 'SET_USER', payload: data.data.user }))
      .catch(() => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); dispatch({ type: 'LOGOUT' }); });
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await authService.login(credentials);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      dispatch({ type: 'SET_USER', payload: data.data.user });
      return { requireOTP: false, user: data.data.user };
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await authService.register(formData);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      dispatch({ type: 'SET_USER', payload: data.data.user });
      return data.data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user) => dispatch({ type: 'SET_USER', payload: user });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
