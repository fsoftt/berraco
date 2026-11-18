import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import esCO from './locales/es-CO';
import en from './locales/en';
import ptBR from './locales/pt-BR';
import type { LanguageCode } from '../domain';

/** To add a language: create locales/<code>.ts, register it here and in LANGUAGES. */
export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'es-CO', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português' },
];
export const resources = {
  'es-CO': { translation: esCO },
  en: { translation: en },
  'pt-BR': { translation: ptBR },
};
export const LANG_CACHE_KEY = 'berraco.lang';

export function normalizeLanguage(input: string | null | undefined): LanguageCode | undefined {
  if (!input) return undefined;
  const l = input.toLowerCase();
  if (l.startsWith('es')) return 'es-CO';
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('pt')) return 'pt-BR';
  return undefined;
}

/** Saved choice > ?lang= param > navigator.language > es-CO. */
export function detectLanguage(): LanguageCode {
  try {
    const saved = normalizeLanguage(localStorage.getItem(LANG_CACHE_KEY));
    if (saved) return saved;
  } catch { /* ignore */ }
  try {
    const q = normalizeLanguage(new URLSearchParams(location.search).get('lang'));
    if (q) return q;
  } catch { /* ignore */ }
  const nav = typeof navigator !== 'undefined' ? [...(navigator.languages ?? []), navigator.language] : [];
  for (const n of nav) { const c = normalizeLanguage(n); if (c) return c; }
  return 'es-CO';
}

export function applyLanguage(code: LanguageCode): void {
  void i18next.changeLanguage(code);
  try { localStorage.setItem(LANG_CACHE_KEY, code); } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = code;
}

export function initI18n(): typeof i18next {
  const lng = detectLanguage();
  void i18next.use(initReactI18next).init({
    resources, lng, fallbackLng: 'es-CO', nsSeparator: false, interpolation: { escapeValue: false }, returnNull: false,
  });
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
  return i18next;
}
export default i18next;
