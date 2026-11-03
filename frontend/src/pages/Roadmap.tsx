import { Link } from 'react-router-dom'
import { roadmaps } from '../data/demoData'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'

export function Roadmap() {
  const { lang, t } = useLang()
  const { profile } = useProfile()
  const map = roadmaps[profile.journey][lang]

  return (
    <section>
      <h1>{t('roadmapHeading')}</h1>
      <p className="lede">
        {profile.name ? `${profile.name} · ${profile.interest}` : map.title}
      </p>
      <h2>{map.title}</h2>
      <div className="steps">
        <article>
          <h3>{t('stepPrereq')}</h3>
          <ul>
            {map.prereq.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>{t('stepExams')}</h3>
          <ul>
            {map.exams.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>{t('stepCost')}</h3>
          <ul>
            {map.cost.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>{t('stepRelated')}</h3>
          <ul>
            {map.related.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
      <p className="note">{t('sourceNote')}</p>
      <div className="actions">
        <Link className="btn primary" to="/mentor">
          {t('askMentor')}
        </Link>
        <Link className="btn ghost" to="/scholarships">
          {t('navScholarships')}
        </Link>
      </div>
    </section>
  )
}
