/**
 * Internationalization (i18n) Service
 * 
 * Provides language switching and translation functionality.
 * Supports Chinese (zh) and English (en).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Translations, locales } from './locales';

// Storage key for persisting language preference
const LOCALE_STORAGE_KEY = 'app_locale';

// Default locale
const DEFAULT_LOCALE: Locale = 'zh';

// Get initial locale from localStorage or browser settings
const getInitialLocale = (): Locale => {
  // Try to get from localStorage first
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  
  // Try to detect from browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    if (browserLang.startsWith('en')) {
      return 'en';
    }
  }
  
  return DEFAULT_LOCALE;
};

// i18n Context
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// i18n Provider Props
interface I18nProviderProps {
  children: ReactNode;
}

/**
 * i18n Provider Component
 * Wrap your app with this to enable internationalization
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage not available
    }
  };

  const t = locales[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to use i18n translations
 * 
 * @example
 * const { t, locale, setLocale } = useI18n();
 * console.log(t.feedback.title); // "提交反馈" or "Submit Feedback"
 */
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback for components not wrapped in I18nProvider
    // Log a warning in development to alert developers
    if (process.env.NODE_ENV === 'development') {
      console.warn('[i18n] useI18n called outside of I18nProvider. Using default locale.');
    }
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {
        console.warn('[i18n] setLocale called outside of I18nProvider. Language preference will not be saved.');
      },
      t: locales[DEFAULT_LOCALE],
    };
  }
  return context;
};

/**
 * Get current locale without hook (for non-React code)
 */
export const getCurrentLocale = (): Locale => {
  return getInitialLocale();
};

/**
 * Get translations for a specific locale
 */
export const getTranslations = (locale: Locale): Translations => {
  return locales[locale];
};

// Export types and locales
export type { Locale, Translations } from './locales';
export { locales } from './locales';
