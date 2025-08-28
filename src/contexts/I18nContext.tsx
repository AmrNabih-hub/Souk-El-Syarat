/**
 * Internationalization Context
 * Provides language and translation functionality
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, t } from '@/i18n/translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  availableLanguages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get saved language or detect from browser
    const saved = localStorage.getItem('language') as Language;
    if (saved && saved in translations) return saved;
    
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in translations) return browserLang as Language;
    
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Update document attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    // Set initial document attributes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const translate = (key: string) => t(key, language);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translate,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    availableLanguages: Object.keys(translations) as Language[]
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};