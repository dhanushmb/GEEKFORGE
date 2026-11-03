import { Link } from 'react-router-dom'
import { colleges } from '../data/demoData'
import { collegeTranslations } from '../data/demoDataKn'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'

export function Admissions() {
  const { lang, t } = useLang()
  const { profile } = useProfile()
  const rank = Number(profile.rank) || 12480

  return (
    <section>
      <h1>{t('admissionsHeading')}</h1>
      <p className="lede">{t('admissionsLead')}</p>
      <p className="meta">
        {t('admissionRankLabel')} {rank} · {profile.location || t('karnataka')}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('college')}</th>
              <th>{t('course')}</th>
              <th>{t('cutoff')}</th>
              <th>{t('category')}</th>
              <th>{t('fees')}</th>
              <th>{t('locationCol')}</th>
              <th>{t('yearLabel')}</th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((row) => {
              const inRange = rank <= row.cutoff * 1.35
              const localized = collegeTranslations[row.college]
              return (
                <tr key={row.college} className={inRange ? 'ok' : ''}>
                  <td>{row.college}</td>
                  <td>{lang === 'kn' ? localized.course : row.course}</td>
                  <td>{row.cutoff.toLocaleString()}</td>
                  <td>{row.category}</td>
                  <td>{lang === 'kn' ? localized.fees : row.fees}</td>
                  <td>{row.location}</td>
                  <td>{lang === 'kn' ? localized.year : row.year}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="note">{t('sourceNote')}</p>
      <div className="actions">
        <Link className="btn primary" to="/roadmap">
          {t('viewRoadmap')}
        </Link>
        <Link className="btn ghost" to="/mentor">
          {t('askMentor')}
        </Link>
      </div>
    </section>
  )
}
