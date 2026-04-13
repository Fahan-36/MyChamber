import { createContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('mychamber_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mychamber_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const persistAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('mychamber_token', nextToken);
    localStorage.setItem('mychamber_user', JSON.stringify(nextUser));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('mychamber_token');
    localStorage.removeItem('mychamber_user');
  };

  const syncUserFromProfile = (profileData) => {
    if (!profileData) return;
    const nextUser = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      phone: profileData.phone,
      profile_image: profileData.profile_image || null,
    };
    setUser(nextUser);
    localStorage.setItem('mychamber_user', JSON.stringify(nextUser));
  };

  const login = async (payload) => {
    const res = await authService.login(payload);
    const authData = res.data;
    persistAuth(authData.token, authData.user);
    toast.success('Welcome back to MyChamber');
    return authData.user;
  };

  const register = async (payload) => {
    const res = await authService.register(payload);
    const authData = res.data;
    persistAuth(authData.token, authData.user);
    toast.success('Account created successfully');
    return authData.user;
  };

  const logout = () => {
    clearAuth();
    toast.success('Signed out');
  };

  const fetchProfile = async () => {
    if (!token) return null;
    const res = await authService.profile();
    setProfile(res.data);
    syncUserFromProfile(res.data);
    return res.data;
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profileData = await authService.profile();
        if (!active) return;
        setProfile(profileData.data);
        syncUserFromProfile(profileData.data);
      } catch (error) {
        clearAuth();
      } finally {
        if (active) setIsLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      fetchProfile,
      setProfile,
    }),
    [token, user, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
