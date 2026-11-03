import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'
import { useAuth } from '../AuthContext'

const links = [
  { to: '/', key: 'navHome' as const },
  { to: '/discover', key: 'navDiscover' as const },
  { to: '/career-map', key: 'navCareerMap' as const },
  { to: '/mentor', key: 'navMentor' as const },
  { to: '/journey', key: 'navJourney' as const },
]

function BrandMark() {
  return <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 23 14.8 7.5a1.4 1.4 0 0 1 2.4-.1l7.6 13.1a1.5 1.5 0 0 1-1.3 2.2H7Z"/><path d="m13.1 18.8 5.9-3.4"/></svg>
}

export function Layout() {
  const { lang, setLang, t } = useLang()
  const { profile } = useProfile()
  const { user, signOut } = useAuth()
  const [showNotifications,setShowNotifications]=useState(false)
  return <div className="shell">
    <header className="topbar">
      <NavLink to="/" className="brand"><BrandMark /><span>{t('brand')}</span></NavLink>
      <nav className="nav" aria-label={t('mainNavigation')}>{links.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'}>{t(link.key)}</NavLink>)}</nav>
      <div className="header-actions">
        <div className="lang-switch" role="group" aria-label={t('language')}>
          <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>{lang === 'kn' ? t('langEn') : 'EN'}</button>
          <button type="button" className={lang === 'kn' ? 'active' : ''} onClick={() => setLang('kn')}>{t('langKn')}</button>
        </div>
        <div className="notification-wrap"><button type="button" className="icon-button notification-button" aria-label={t('notifications')} title={t('notifications')} aria-expanded={showNotifications} onClick={()=>setShowNotifications(value=>!value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span className="notification-dot" /></button>{showNotifications&&<div className="notification-popover"><strong>{t('notifications')}</strong><p>{t('notificationMessage')}</p><NavLink to="/discover" onClick={()=>setShowNotifications(false)}>{t('exploreCareers')} →</NavLink></div>}</div>
        <span className="account-name">{user?.name || user?.email || user?.phone}</span>
        <button className="sign-out-button" type="button" onClick={() => void signOut()}>{t('signOut')}</button>
        <NavLink className="avatar-link" to="/journey" aria-label={t('navJourney')}><span>{profile.name?profile.name.slice(0,2).toUpperCase():t('aiLabel')}</span></NavLink>
      </div>
    </header>
    <main className="main"><Outlet /></main>
    <footer className="footer">{t('footer')}</footer>
  </div>
}
