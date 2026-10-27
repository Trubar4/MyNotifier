import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BoomPosition } from './data/types';

export type Lang = 'de' | 'en';
export type Units = 'metric' | 'imperial';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  units: Units;
  setUnits: (u: Units) => void;
}

const LanguageContext = createContext<LangCtx>({ lang: 'de', setLang: () => {}, units: 'metric', setUnits: () => {} });

// Conversion factors — data stays metric, only the display converts.
const MPS_TO_MPH = 2.2369362920544;
const M_TO_FT = 3.280839895;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem('mn-lang') === 'en' ? 'en' : 'de';
    } catch {
      return 'de';
    }
  });
  const [units, setUnitsState] = useState<Units>(() => {
    try {
      return localStorage.getItem('mn-units') === 'imperial' ? 'imperial' : 'metric';
    } catch {
      return 'metric';
    }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('mn-lang', l); } catch { /* ignore */ }
  };
  const setUnits = (u: Units) => {
    setUnitsState(u);
    try { localStorage.setItem('mn-units', u); } catch { /* ignore */ }
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <LanguageContext.Provider value={{ lang, setLang, units, setUnits }}>{children}</LanguageContext.Provider>;
}

/**
 * useLang() exposes the current language + unit system, their setters, a tiny
 * translate helper `t(de, en)`, and unit-aware number/measure formatters.
 * All measure helpers take METRIC base values (m/s, °C, m) and convert for display.
 */
export function useLang() {
  const { lang, setLang, units, setUnits } = useContext(LanguageContext);
  const loc = lang === 'en' ? 'en-US' : 'de-DE';
  const t = (de: string, en: string) => (lang === 'en' ? en : de);
  const nf = (v: number, dec: number) =>
    v.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const nf1 = (v: number) => nf(v, 1);

  const imperial = units === 'imperial';

  // Wind speed: m/s ⇄ mph
  const speedUnit = imperial ? 'mph' : 'm/s';
  const convSpeed = (mps: number) => (imperial ? mps * MPS_TO_MPH : mps);
  const speedNum = (mps: number) => nf1(convSpeed(mps));
  const fmtSpeed = (mps: number) => `${speedNum(mps)} ${speedUnit}`;
  // Inverse of convSpeed: turn a value entered in the display unit back into m/s.
  const fromSpeed = (displayVal: number) => (imperial ? displayVal / MPS_TO_MPH : displayVal);
  // Thresholds are whole m/s — keep them integer in metric, 1 decimal in imperial.
  const thresholdNum = (mps: number) => (imperial ? nf1(convSpeed(mps)) : nf(mps, 0));
  const fmtThreshold = (mps: number) => `${thresholdNum(mps)} ${speedUnit}`;

  // Temperature: °C ⇄ °F
  const tempUnit = imperial ? '°F' : '°C';
  const convTemp = (c: number) => (imperial ? c * 9 / 5 + 32 : c);
  const fmtTemp = (c: number) => `${nf1(convTemp(c))} ${tempUnit}`;

  // Length: m ⇄ ft
  const lenUnit = imperial ? 'ft' : 'm';
  const convLen = (m: number) => (imperial ? m * M_TO_FT : m);
  const fmtLen = (m: number, dec = 0) => `${nf(convLen(m), dec)} ${lenUnit}`;

  return {
    lang, setLang, t, nf1, nf,
    units, setUnits,
    speedUnit, convSpeed, fromSpeed, speedNum, fmtSpeed, thresholdNum, fmtThreshold,
    tempUnit, convTemp, fmtTemp,
    lenUnit, convLen, fmtLen,
  };
}

/* ---------- Data-level translations (used outside of React too) ---------- */

// Same canonical order as BOOM_POSITION_LABELS: Arbeits → Park → Klappmesser → abgelegt.
export const BOOM_POSITION_LABELS_I18N: Record<BoomPosition, { de: string; en: string }> = {
  arbeitsposition: { de: 'Arbeitsposition', en: 'Working position' },
  parkposition: { de: 'Parkposition', en: 'Park position' },
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
