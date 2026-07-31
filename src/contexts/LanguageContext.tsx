import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { translations, Language, TranslationKey } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('language') as Language) || 'es';
    } catch {
      return 'es';
    }
  });

  // Caché en memoria de traducciones parseadas por idioma
  const cacheRef = useRef<Record<string, Map<string, any>>>({
    es: new Map(),
    en: new Map(),
    miskito: new Map(),
    kriol: new Map(),
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      console.warn("Failed to set language in localStorage:", e);
    }
  }, []);

  const t = useCallback((key: TranslationKey | string): any => {
    if (!key) return '';

    const langCache = cacheRef.current[language] || cacheRef.current.es;
    if (langCache.has(key)) {
      return langCache.get(key);
    }

    const getNested = (obj: any, path: string) => {
      if (!obj || !path) return undefined;
      const parts = path.split('.');
      let current = obj;
      for (let i = 0; i < parts.length; i++) {
        if (current === undefined || current === null) return undefined;
        current = current[parts[i]];
      }
      return current;
    };

    const currentLangObj = translations[language] || translations['es'];
    const fallbackLangObj = translations['es'];

    const result = getNested(currentLangObj, key) ?? getNested(fallbackLangObj, key) ?? key;
    langCache.set(key, result);

    return result;
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
