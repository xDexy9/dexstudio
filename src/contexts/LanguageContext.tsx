import React, { createContext, useContext, ReactNode } from 'react';
import { Language, t as translate } from '@/lib/i18n';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

// Create context with undefined initial value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  
  // Default to English if no user is logged in
  const language: Language = user?.preferredLanguage || 'en';

  const t = (key: string): string => {
    return translate(key, language);
  };

  const setLanguage = (lang: Language) => {
    updateUser({ preferredLanguage: lang });
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    console.error('useLanguage called outside LanguageProvider. Component tree may be broken.');
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
