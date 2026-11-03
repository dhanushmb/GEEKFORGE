import { useEffect, useState } from 'react'

const KEY = 'disha-saved-careers'

export function useSavedCareers() {
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') as string[] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(saved)) }, [saved])
  function toggle(slug: string) {
    setSaved(current => current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug])
  }
  return { saved, toggle }
}
