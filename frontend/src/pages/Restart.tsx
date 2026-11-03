import { Link } from 'react-router-dom'
import { restartOptions } from '../data/demoData'
import { useLang } from '../LanguageContext'

export function Restart() {
  const { lang, t } = useLang()

  return (
    <section>
      <h1>{t('restartHeading')}</h1>
      <p className="lede">{t('restartLead')}</p>
      <div className="card-grid">
        {restartOptions.map((opt) => (
          <article key={opt.titleEn} className="info-card">
            <strong>{lang === 'kn' ? opt.titleKn : opt.titleEn}</strong>
            <p>{lang === 'kn' ? opt.detailKn : opt.detailEn}</p>
          </article>
        ))}
      </div>
      <p className="note">{t('sourceNote')}</p>
      <div className="actions">
        <Link className="btn primary" to="/roadmap">
          {t('viewRoadmap')}
        </Link>
        <Link className="btn ghost" to="/scholarships">
          {t('navScholarships')}
        </Link>
      </div>
    </section>
  )
}
