import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Interface languages. English text in the code is the key; each dictionary maps it to a
 * translation. A missing key falls back to English, so nothing ever shows up empty.
 * Placeholders look like {name} and are filled from the vars object.
 */
export type Lang = 'en' | 'hi' | 'ru' | 'kk';
export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'hi', short: 'हि', name: 'हिन्दी' },
  { id: 'ru', short: 'РУ', name: 'Русский' },
  { id: 'kk', short: 'ҚАЗ', name: 'Қазақша' },
];
// Dictionaries load on demand, so English visitors download none of them.
const dicts: Record<Lang, Record<string, string>> = { en: {}, hi: {}, ru: {}, kk: {} };
const loaders: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Record<string, string> }>> = {
  hi: () => import('../i18n/hi'),
  ru: () => import('../i18n/ru'),
  kk: () => import('../i18n/kk'),
};
const loaded = new Set<Lang>(['en']);
export async function loadDict(lang: Lang): Promise<void> {
  if (loaded.has(lang)) return;
  try {
    dicts[lang] = (await loaders[lang as Exclude<Lang, 'en'>]()).default;
    loaded.add(lang);
  } catch {
    /* offline and not cached: stay in English */
  }
}
const locales: Record<Lang, string> = { en: 'en-GB', hi: 'hi-IN', ru: 'ru-RU', kk: 'kk-KZ' };

const LANG_KEY = 'sg.lang';
function loadLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY) as Lang | null;
    return v && ['en', 'hi', 'ru', 'kk'].includes(v) ? v : 'en';
  } catch {
    return 'en';
  }
}

// Module-level copy so plain functions (dates, the offline engine) follow the chosen language.
let current: Lang = typeof window === 'undefined' ? 'en' : loadLang();
export const getLang = () => current;
export const getLocale = () => locales[current];

export type Vars = Record<string, string | number>;
export function tr(en: string, vars?: Vars, lang: Lang = current): string {
  let s = (lang !== 'en' && dicts[lang][en]) || en;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

/** "1 traveler" / "3 travelers" in the chosen language. */
export function plural(n: number, one: string, many: string, lang: Lang = current): string {
  if (lang === 'ru') {
    const few = dicts.ru[`${many}#few`];
    const m10 = n % 10;
    const m100 = n % 100;
    if (few && m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return tr(few, { n }, 'en');
    if (m10 === 1 && m100 !== 11) return tr(one, { n }, lang);
    return tr(many, { n }, lang);
  }
  return tr(n === 1 ? one : many, { n }, lang);
}

// kb.ts registers here to translate the knowledge base before the re-render.
let onLangChange: ((l: Lang) => void) | undefined;
export const setLangListener = (f: (l: Lang) => void) => {
  onLangChange = f;
};

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (en: string, vars?: Vars) => string;
}
const Ctx = createContext<LangState>({ lang: 'en', setLang: async () => undefined, t: (en, v) => tr(en, v, 'en') });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  current = lang;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback(async (l: Lang) => {
    await loadDict(l);
    current = l;
    onLangChange?.(l);
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const value = useMemo(() => ({ lang, setLang, t: (en: string, vars?: Vars) => tr(en, vars, lang) }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
