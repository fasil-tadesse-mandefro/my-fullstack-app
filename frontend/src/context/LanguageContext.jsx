import { createContext, useCallback, useContext, useState } from "react";
import en from "../locales/en";
import am from "../locales/am";

const locales = { en, am };
const STORAGE_KEY = "abugida-lang";

const LanguageContext = createContext(null);

function getInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "am") return stored;
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const switchLang = useCallback((newLang) => {
    if (newLang !== "en" && newLang !== "am") return;
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  // Nested key lookup — supports "nav.home", "footer.platform", etc.
  const t = useCallback(
    (key) => {
      const parts = key.split(".");
      let value = locales[lang];
      for (const part of parts) {
        if (value == null) return key;
        value = value[part];
      }
      return value ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
