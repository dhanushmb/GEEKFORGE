
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { careers, domains } from '../data/careers'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'
import { useSavedCareers } from '../hooks/useSavedCareers'
import {
  getAIRecommendations,
  type AIRecommendedCareer,
  type DatasetEvidence,
} from '../services/api'
import type { Career } from '../data/careers'
import { localizeCareer } from '../data/careersKn'
import { CareerEvidence } from '../components/CareerEvidence'

const cutoffCategories = {
  KCET: ['1G', '1K', '1R', '2AG', '2AK', '2AR', '2BG', '2BK', '2BR', '3AG', '3AK', '3AR', '3BG', '3BK', '3BR', 'GM', 'GMK', 'GMP', 'GMR', 'NRI', 'OPN', 'OTH', 'S1G', 'S1K', 'S1R', 'S2G', 'S2K', 'S2R', 'S3G', 'S3K', 'S3R', 'S4G', 'S4K', 'S4R', 'STG', 'STK', 'STR'],
  PGCET: ['1G', '2AG', '2BG', '3AG', '3BG', 'GM', 'NKN', 'SCG', 'SPN', 'STG'],
}

const domainKeys: Record<string, string> = {
  'All careers': 'allCareers',
  Technology: 'technology',
  Healthcare: 'healthcare',
  'Business & Finance': 'business',
  'Creative & Media': 'creative',
  'Science & Research': 'science',
  'Public Service': 'publicService',
  Education: 'educationDomain',
}

const educationLevels = [
  ...Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`),
  'Undergraduate',
  'Other',
]

const educationLevelLabels: Record<string, string> = {
  ...Object.fromEntries(Array.from({ length: 12 }, (_, index) =>
    [`Class ${index + 1}`, `${index + 1}ನೇ ತರಗತಿ`],
  )),
  Undergraduate: 'ಪದವಿ',
  Other: 'ಇತರೆ',
}

function splitList(value: string) {
  return value
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function Discover() {
  const { lang, t } = useLang()
  const { profile } = useProfile()
  const { saved, toggle } = useSavedCareers()

  // Use the original local career dataset.
  const [catalog, setCatalog] = useState<Career[]>(careers)

  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('All careers')

  const [interests, setInterests] = useState(profile.interest || '')
  const [subjects, setSubjects] = useState('')
  const [skills, setSkills] = useState('')
  const [exam, setExam] = useState<'' | 'KCET' | 'PGCET'>('')
  const [rank, setRank] = useState('')
  const [category, setCategory] = useState('')
  const [cutoffReferences, setCutoffReferences] = useState<DatasetEvidence[]>([])
  const [cutoffRequested, setCutoffRequested] = useState(false)
  const [classLevel, setClassLevel] = useState(
    profile.education || 'Class 12'
  )

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [recommendations, setRecommendations] =
    useState<AIRecommendedCareer[]>([])

  // Keep local careers instead of overwriting them with API data.
  useEffect(() => {
    setCatalog(careers)
  }, [])

  const filtered = useMemo(() => {
    return catalog.filter((career) => {
      const matchesDomain =
        domain === 'All careers' || career.domain === domain

      const searchableText = [
        career.title,
        career.domain,
        career.description,
        ...(career.skills ?? []),
        localizeCareer(career, lang).title,
        localizeCareer(career, lang).domain,
        localizeCareer(career, lang).description,
        ...(localizeCareer(career, lang).skills ?? []),
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = searchableText.includes(
        query.toLowerCase()
      )

      return matchesDomain && matchesSearch
    })
  }, [catalog, domain, lang, query])

  async function findCareers(event: FormEvent) {
    event.preventDefault()

    const interestList = splitList(interests)
    const subjectList = splitList(subjects)
    const skillList = splitList(skills)
    const education = classLevel.trim()

    if (
      !interestList.length ||
      !subjectList.length ||
      !skillList.length ||
      !education
    ) {
      setAiError(
        t('questionRequired')
      )
      return
    }

    setAiError('')
    setAiLoading(true)

    try {
      const results = await getAIRecommendations({
        interests: interestList,
        subjects: subjectList,
        skills: skillList,
        class_level: education,
        language: lang === 'kn' ? 'Kannada' : 'English',
        ...(exam ? { exam, category, ...(rank ? { rank: Number(rank) } : {}) } : {}),
      })

      setRecommendations(results.recommendations)
      setCutoffReferences(results.cutoffReferences)
      setCutoffRequested(Boolean(exam))
    } catch {
      setRecommendations([])
      setCutoffReferences([])
      setCutoffRequested(false)

      setAiError(
        t('discoveryFallback')
      )
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <section className="page-section discover-page">

      {/* Page heading */}
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            {t('discoverHeading')}
          </span>

          <h1>{t('discoverHeading')}</h1>

          <p className="lede">{t('discoverLead')}</p>
        </div>

        <span className="result-count">{filtered.length} {t('careerCount')}</span>
      </div>

      {/* AI Career Finder */}
      <section
        className="ai-career-finder"
        aria-labelledby="ai-career-finder-heading"
      >
        <div className="ai-finder-heading">
          <span className="section-kicker">
            {t('aiCareerMatch')}
          </span>

          <h2 id="ai-career-finder-heading">
            {t('aiCareerFinder')}
          </h2>

          <p className="lede">
            {t('aiCareerFinderLead')}
          </p>
        </div>

        <form
          className="ai-finder-form"
          onSubmit={findCareers}
        >
          <label>
            {t('interestsLabel')}
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={lang === 'kn' ? 'ಜನರಿಗೆ ಸಹಾಯ ಮಾಡುವುದು, ಸಂಕೇತ ಬರೆಯುವುದು, ವಿನ್ಯಾಸ…' : 'Helping people, coding, design…'}
            />
          </label>

          <label>
            {t('favouriteSubjects')}
            <input
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder={lang === 'kn' ? 'ಜೀವವಿಜ್ಞಾನ, ಗಣಿತ, ಗಣಕ ವಿಜ್ಞಾನ…' : 'Biology, Maths, Computer Science…'}
            />
          </label>

          <label>
            {t('skillsLabelInput')}
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={lang === 'kn' ? 'ಸಂವಹನ, ಚಿತ್ರಕಲೆ, ಸಮಸ್ಯೆ ಪರಿಹಾರ…' : 'Communication, drawing, problem solving…'}
            />
          </label>

          <label>
            {t('educationLevel')}
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
            >
              {!educationLevels.includes(classLevel) && (
                <option value={classLevel}>{classLevel}</option>
              )}
              {educationLevels.map((level) => (
                <option key={level} value={level}>
                  {lang === 'kn' ? educationLevelLabels[level] : level}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="admission-match-options">
            <legend>{t('datasetAdmissionOptions')}</legend>
            <p>{t('datasetAdmissionHelp')}</p>
            <div className="admission-match-fields">
              <label>{t('datasetExam')}
                <select value={exam} onChange={event => { setExam(event.target.value as typeof exam); setCategory(''); setRank('') }}>
                  <option value="">{t('datasetSkipCutoffs')}</option>
                  <option value="KCET">{t('kcetExam')}</option>
                  <option value="PGCET">{t('pgcetExam')}</option>
                </select>
              </label>
              {exam && <>
                <label>{t('category')}
                  <select value={category} required onChange={event => setCategory(event.target.value)}>
                    <option value="">{t('datasetChooseCategory')}</option>
                    {cutoffCategories[exam].map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label>{t('datasetRank')}
                  <input type="number" min="0.01" step="any" value={rank} onChange={event => setRank(event.target.value)} />
                </label>
              </>}
            </div>
          </fieldset>

          <button
            className="btn primary"
            type="submit"
            disabled={aiLoading}
          >
            {aiLoading
              ? t('findingCareers')
              : t('findMyCareers')}
          </button>
        </form>
        <p className="dataset-notice">{t('datasetSnapshotNote')}</p>

        {aiError && (
          <p className="api-error" role="alert">
            {aiError}
          </p>
        )}

        {aiLoading && !recommendations.length && (
          <p className="ai-finder-status">
            {t('aiMatchingCareers')}
          </p>
        )}

        {/* AI recommendations */}
        {recommendations.length > 0 && (
          <div className="ai-recommend-grid">
            {recommendations.map((item, index) => (
              <article
                className="ai-recommend-card"
                key={`${item.career}-${index}`}
              >
                <span className="ai-recommend-mark">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <h3>{item.career}</h3>

                <p>{item.description}</p>

                {item.why_suitable && (
                  <p>
                    <strong>{t('whyItFits')}</strong>{' '}
                    {item.why_suitable}
                  </p>
                )}

                {(item.skills_to_learn ?? []).length > 0 && (
                  <div className="skill-tags">
                    {(item.skills_to_learn ?? []).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}

                {item.education_pathway && (
                  <p>
                    <strong>{t('educationPathway')}</strong>{' '}
                    {item.education_pathway}
                  </p>
                )}

                {item.first_step && (
                  <p className="ai-first-step">
                    <strong>{t('firstStep')}</strong>{' '}
                    {item.first_step}
                  </p>
                )}
                <CareerEvidence records={item.evidence} />
              </article>
            ))}
          </div>
        )}
        {recommendations.length > 0 && cutoffRequested && (
          cutoffReferences.length
            ? <CareerEvidence records={cutoffReferences} title={t('datasetCollegeMatches')} />
            : <p className="dataset-notice">{t('datasetNoCutoffs')}</p>
        )}
      </section>

      {/* Discover layout */}
      <div className="discover-layout">

        {/* Career domains */}
        <aside className="domain-panel">
          <h3>{t('careerDomains')}</h3>

          {domains.map((item) => (
            <button
              className={
                domain === item
                  ? 'domain-option selected'
                  : 'domain-option'
              }
              key={item}
              onClick={() => setDomain(item)}
            >
              <span className="domain-dot" />

              {t(domainKeys[item] as never)}

              <span className="domain-arrow">›</span>
            </button>
          ))}
        </aside>

        {/* Career results */}
        <div className="career-results">

          {/* Search */}
          <label className="search-box">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchCareers')}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('clearSearch')}
              >
                ×
              </button>
            )}
          </label>

          {/* Career cards */}
          <div className="career-grid">
            {filtered.map((item) => {
              const career = localizeCareer(item, lang)
              return (
              <article
                className="career-card"
                key={career.slug}
              >

                {/* Career image */}
                <Link
                  className={`career-visual tone-${career.tone}`}
                  to={`/career/${career.slug}`}
                >
                  <img
                    className="career-image"
                    src={`/images/careers/${career.slug}.jpg`}
                    alt={career.title}
                    loading="lazy"
                  />

                  <span className="career-art-number">
                    {career.mark}
                  </span>

                  <span className="visual-caption">
                    {career.domain}
                  </span>
                </Link>

                {/* Career information */}
                <div className="career-card-content">

                  <div className="career-title-row">
                    <Link to={`/career/${career.slug}`}>
                      <h3>{career.title}</h3>
                    </Link>

                    <button
                      type="button"
                      className={
                        saved.includes(career.slug)
                          ? 'save-icon saved'
                          : 'save-icon'
                      }
                      onClick={() => toggle(career.slug)}
                      aria-label={
                        saved.includes(career.slug)
                          ? t('savedCareer')
                          : t('saveCareer')
                      }
                    >
                      {saved.includes(career.slug)
                        ? '♥'
                        : '♡'}
                    </button>
                  </div>

                  <p>{career.description}</p>

                  <span className="tag-demand">
                    {t('demand')}
                  </span>

                  <Link
                    className="career-card-link"
                    to={`/career/${career.slug}`}
                  >
                    {t('details')} <span>→</span>
                  </Link>
                </div>
              </article>
            )})}
          </div>

          {/* Empty state */}
          {!filtered.length && (
            <div className="empty-state">
              <h3>{t('noMatches')}</h3>

              <p>
                {t('noMatchesHelp')}
              </p>

              <button
                className="btn light"
                onClick={() => {
                  setQuery('')
                  setDomain('All careers')
                }}
              >
                {t('resetFilters')}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
