import { Link } from 'react-router-dom'
import heroImage from '../assets/disha-home-hero.png'
import { useLang } from '../LanguageContext'
import { careers } from '../data/careers'
import { localizeCareer } from '../data/careersKn'

export function Home() {
  const { lang, t } = useLang()
  return <div className="home-page">
    <section className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow"><span className="sparkle">✦</span>{t('heroEyebrow')}</span>
        <h1>{t('heroTitle')}</h1>
        <p>{t('heroSub')}</p>
        <div className="actions"><Link className="btn primary" to="/discover">{t('exploreCareers')} <span>→</span></Link><Link className="btn light" to="/mentor">{t('askAnything')} <span>✦</span></Link></div>
        <div className="hero-proof"><div className="avatar-stack"><span>AR</span><span>KN</span><span>DS</span></div><div><strong>{t('trustedBy')}</strong><small>{t('personalizedPaths')}</small></div></div>
      </div>
      <div className="hero-art"><img src={heroImage} alt={t('homeHeroAlt')}/><div className="float-card float-career"><span className="float-icon">✦</span><span>{t('exploreProfession')}</span></div><div className="float-card float-ai"><span className="float-icon">◌</span><span>{t('askAnything')}</span></div><div className="float-card float-roadmap"><span className="float-icon">↗</span><span>{t('roadmapLabel')}</span></div></div>
    </section>
    <section className="stats-row"><div><strong>500<span>+</span></strong><small>{t('careersCount')}</small></div><div><strong>50K<span>+</span></strong><small>{t('demos')}</small></div><div><strong>2</strong><small>{t('languages')}</small></div><div><strong>{t('aiLabel')}</strong><small>{t('guidanceLabel')}</small></div></section>
    <section className="home-feature-row"><div><span className="section-kicker">{t('homeSectionKicker')}</span><h2>{t('homeSectionTitle')}</h2></div><Link className="text-link" to="/discover">{t('viewAll')} <span>→</span></Link></section>
    <section className="featured-grid">{careers.slice(0,3).map(item=>{const career=localizeCareer(item,lang);return <Link to={`/career/${career.slug}`} className={`featured-card tone-${career.tone}`} key={career.slug}><span className="career-art-number">{career.mark}</span><span className="featured-card-copy"><small>{career.domain}</small><strong>{career.title}</strong><span>{career.description}</span></span><span className="arrow-bubble">↗</span></Link>})}</section>
  </div>
}
