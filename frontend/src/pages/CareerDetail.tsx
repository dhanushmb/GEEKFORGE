
import { Link, useParams } from 'react-router-dom'
import { careers } from '../data/careers'
import { useEffect, useState } from 'react'
import { useLang } from '../LanguageContext'
import { useSavedCareers } from '../hooks/useSavedCareers'
import { getCareerCatalog } from '../services/api'
import type { Career } from '../data/careers'
import { localizeCareer } from '../data/careersKn'

export function CareerDetail() {
  const { slug } = useParams()

  const [, setCatalog] = useState<Career[]>(careers)

  const { lang, t } = useLang()
  const { saved, toggle } = useSavedCareers()

  useEffect(() => {
    let mounted = true

    getCareerCatalog()
      .then((items) => {
        if (mounted) setCatalog(items)
      })
      .catch((error) =>
        console.error(
          'Career catalog API unavailable; using demo catalog.',
          error
        )
      )

    return () => {
      mounted = false
    }
  }, [])

  const baseCareer = careers.find((item) => item.slug === slug)

  if (!baseCareer) {
    return (
      <section className="empty-state">
        <h1>{t('careerNotFound')}</h1>
        <Link className="btn primary" to="/discover">
          {t('exploreCareers')}
        </Link>
      </section>
    )
  }

  const career = localizeCareer(baseCareer, lang)
  const isSaved = saved.includes(career.slug)

  return (
    <section className="detail-page">
      <div className="breadcrumbs">
        <Link to="/discover">{t('navDiscover')}</Link>
        <span>›</span>
        <span>{career.domain}</span>
        <span>›</span>
        <span>{career.title}</span>
      </div>

      <div className="detail-hero">
        <div className={`detail-visual tone-${career.tone}`}>
          <img
            src={`/images/careers/${career.slug}.jpg`}
            alt={career.title}
            className="career-image"
          />

          <span className="career-art-number">{career.mark}</span>

          <span className="visual-caption">
            {career.domain} · {t('demand')}
          </span>
        </div>

        <div className="detail-copy">
          <span className="section-kicker">
            {career.domain} · {t('careerExplorer')}
          </span>

          <h1>{career.title}</h1>

          <p className="lede">{career.description}</p>

          <p>
            {t('careerDetailLead')}
          </p>

          <div className="actions">
            <Link className="btn primary" to="/mentor">
              ✦ {t('askAnything')}
            </Link>

            <button
              className="btn light"
              onClick={() => toggle(career.slug)}
            >
              {isSaved ? '♥' : '♡'}{' '}
              {isSaved ? t('savedCareer') : t('saveCareer')}
            </button>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        <a href="#overview">{t('overview')}</a>
        <a href="#skills">{t('skillsLabel')}</a>
        <a href="#education">{t('educationLabel')}</a>
        <a href="#opportunities">{t('opportunities')}</a>
      </div>

      <div className="detail-content">
        <article className="detail-info" id="overview">
          <span className="detail-icon">✦</span>
          <h2>{t('roleInvolves')}</h2>
          <p>
            {career.description} {t('careerResponsibilities')}
          </p>
        </article>

        <article className="detail-info" id="skills">
          <span className="detail-icon">⌘</span>
          <h2>{t('skillsLabel')}</h2>

          <div className="skill-tags">
            {career.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </article>

        <article className="detail-info" id="education">
          <span className="detail-icon">🎓</span>
          <h2>{t('educationLabel')}</h2>
          <p>{career.education}</p>

          <Link className="text-link" to="/roadmap">
            {t('buildRoadmap')}
          </Link>
        </article>

        <article className="detail-info" id="opportunities">
          <span className="detail-icon">↗</span>
          <h2>{t('salaryIndia')}</h2>
          <p>{career.salary}</p>
          <small>
            {t('salaryDisclaimer')}
          </small>
        </article>
      </div>
    </section>
  )
}
