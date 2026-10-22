import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BoomPosition } from './data/types';

export type Lang = 'de' | 'en';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx>({ lang: 'de', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem('mn-lang') === 'en' ? 'en' : 'de';
    } catch {
      return 'de';
    }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('mn-lang', l); } catch { /* ignore */ }
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

/**
 * useLang() exposes the current language, a setter, and a tiny translate
 * helper `t(de, en)` that returns the string for the active language.
 */
export function useLang() {
  const { lang, setLang } = useContext(LanguageContext);
  const t = (de: string, en: string) => (lang === 'en' ? en : de);
  const nf1 = (v: number) =>
    v.toLocaleString(lang === 'en' ? 'en-US' : 'de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return { lang, setLang, t, nf1 };
}

/* ---------- Data-level translations (used outside of React too) ---------- */

export const BOOM_POSITION_LABELS_I18N: Record<BoomPosition, { de: string; en: string }> = {
  parkposition: { de: 'Parkposition', en: 'Park position' },
  arbeitsposition: { de: 'Arbeitsposition', en: 'Working position' },
  jackknife: { de: 'Klappmesser-Position', en: 'Jackknife position' },
  boomDown: { de: 'Ausleger abgelegt', en: 'Boom lowered' },
};

export function boomLabel(pos: BoomPosition, lang: Lang): string {
  return BOOM_POSITION_LABELS_I18N[pos][lang];
}

const CONFIG_EN: Record<string, string> = {
  'Hauptausleger + Nadelausleger': 'Main boom + jib',
  'Hauptausleger ohne Nadelausleger': 'Main boom without jib',
  'Ausleger abgelegt': 'Boom lowered',
  'mit Nadelausleger (feststehend)': 'With jib (fixed)',
  'mit Nadelausleger (wippbar)': 'With jib (luffing)',
  'ohne Nadelausleger': 'Without jib',
  'Hauptausleger': 'Main boom',
};

/** Translate a (free-form) boom-configuration string; falls back to the original. */
export function configLabel(cfg: string, lang: Lang): string {
  return lang === 'en' ? (CONFIG_EN[cfg] ?? cfg) : cfg;
}
