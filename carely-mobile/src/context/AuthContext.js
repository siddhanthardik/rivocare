import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('rivo_access_token');
      if (token) {
        // Token exists, attempt to fetch /me
        const res = await authService.getMe();
        if (res.data?.success) {
          setUser(res.data.data.user);
          if (res.data.data.providerProfile) {
            setProviderProfile(res.data.data.providerProfile);
          }
        } else {
          // Token invalid backend side
          await performLogout();
        }
      }
    } catch (error) {
      console.log('Error verifying initial auth:', error.response?.data?.message || error.message);
      await performLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, accessToken, refreshToken) => {
    try {
      await AsyncStorage.setItem('rivo_access_token', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('rivo_refresh_token', refreshToken);
      }
      setUser(userData);
      // Fetch fresh 'me' to ensure provider profile is loaded if they are a provider
      if (userData.role === 'provider') {
        const res = await authService.getMe();
        setProviderProfile(res.data?.data?.providerProfile);
      }
    } catch (err) {
      console.warn('Error during login storage:', err);
    }
  };

  const performLogout = async () => {
    await AsyncStorage.removeItem('rivo_access_token');
    await AsyncStorage.removeItem('rivo_refresh_token');
    setUser(null);
    setProviderProfile(null);
  };

  const logout = async () => {
    await performLogout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      providerProfile,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      isProvider: user?.role === 'provider',
    }}>
      {children}
    </AuthContext.Provider>
  );
};
