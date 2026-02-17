import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { Language } from '@/lib/i18n';
import {
  store,
  findUserByEmail,
  findUserByEmailAndPassword,
  addUserToStore,
  updateUserInStore,
  genId,
  persistStore,
} from '@/lib/mockStore';

interface AuthContextType {
  user: User | null;
  firebaseUser: null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  preferredLanguage: Language;
}

const SESSION_KEY = 'garagepro_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (sessionId) {
        const found = store.users.find(u => u.id === sessionId);
        if (found) {
          const { password: _pw, ...userData } = found;
          setUser(userData as User);
        }
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const found = findUserByEmailAndPassword(email, password);
    if (!found) {
      return { success: false, error: 'Invalid email or password' };
    }
    const { password: _pw, ...userData } = found;
    setUser(userData as User);
    localStorage.setItem(SESSION_KEY, found.id);
    return { success: true };
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    const existing = findUserByEmail(data.email);
    if (existing) {
      return { success: false, error: 'Email already registered. Please use the login page.' };
    }

    const newUser = {
      id: genId(),
      email: data.email.toLowerCase(),
      password: data.password,
      fullName: data.fullName,
      role: data.role,
      preferredLanguage: data.preferredLanguage,
      createdAt: new Date().toISOString(),
    };

    addUserToStore(newUser);
    const { password: _pw, ...userData } = newUser;
    setUser(userData as User);
    localStorage.setItem(SESSION_KEY, newUser.id);
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    updateUserInStore(user.id, updates);
    setUser({ ...user, ...updates });
    persistStore();
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const found = findUserByEmail(email);
    if (!found) {
      return { success: false, error: 'Email not found' };
    }
    // In demo mode, just confirm success (no real email sent)
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser: null, isLoading, login, signup, logout, updateUser, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
