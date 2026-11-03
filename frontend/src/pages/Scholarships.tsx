import { scholarships } from '../data/demoData'
import { scholarshipTranslations } from '../data/demoDataKn'
import { useLang } from '../LanguageContext'

export function Scholarships() {
  const { lang, t } = useLang()

  return (
    <section>
      <h1>{t('scholarshipsHeading')}</h1>
      <p className="lede">{t('sourceNote')}</p>
      <div className="card-grid">
        {scholarships.map((s, index) => {
          const translated = scholarshipTranslations[index]
          return (
          <article key={s.name} className="info-card">
            <strong>{lang === 'kn' ? translated.name : s.name}</strong>
            <p>{lang === 'kn' ? translated.who : s.who}</p>
            <p>{lang === 'kn' ? translated.action : s.action}</p>
            <p className="meta">{s.source}</p>
          </article>
        )})}
      </div>
    </section>
  )
}
