import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { t, type CopyKey } from './i18n'
import type { Lang } from './types'

const STORAGE_KEY = 'disha-lang'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: CopyKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'kn' || saved === 'en' ? saved : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'kn' ? 'kn' : 'en'
    document.title = t(lang, 'brand')
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      setLang: (next: Lang) => setLangState(next),
      t: (key: CopyKey) => t(lang, key),
    }),
    [lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
