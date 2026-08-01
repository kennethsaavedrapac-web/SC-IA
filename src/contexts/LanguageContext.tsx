import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationCache: Record<string, any> = {};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('language') as Language) || 'es';
    } catch (e) {
      return 'es';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      console.warn("Failed to set language in localStorage:", e);
    }
  };

  const t = React.useCallback((key: TranslationKey | string): any => {
    const cacheKey = `${language}:${key}`;
    if (translationCache[cacheKey] !== undefined) {
      return translationCache[cacheKey];
    }

    const currentLangDict = translations[language] as Record<string, any>;
    const defaultLangDict = translations['es'] as Record<string, any>;

    let res: any;
    if (currentLangDict && key in currentLangDict) {
      res = currentLangDict[key];
    } else if (defaultLangDict && key in defaultLangDict) {
      res = defaultLangDict[key];
    } else {
      const getNested = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };
      res = getNested(translations[language], key) || getNested(translations['es'], key) || key;
    }

    translationCache[cacheKey] = res;
    return res;
  }, [language]);

  const contextValue = React.useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
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
