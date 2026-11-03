import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useLang } from '../LanguageContext'
import '../auth.css'

export function AuthPage() {
  const { lang, setLang, t } = useLang()
  const { user, loading, startupError, signIn, createAccount } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function localizeError(reason: unknown) {
    const message = reason instanceof Error ? reason.message : ''
    if (message.includes('already exists')) return t('authDuplicate')
    if (message.includes('incorrect')) return t('authInvalidCredentials')
    if (message.includes('expired')) return t('authSessionExpired')
    if (message.includes('VITE_API_BASE_URL')) return t('authServiceConfig')
    if (message.toLowerCase().includes('fetch')) return t('authServiceUnavailable')
    return message || t('authRequestFailed')
  }

  if (loading) {
    return <main className="auth-loading" role="status">{t('authLoading')}</main>
  }
  if (user) return <Navigate to="/" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (creating && !email.trim() && !phone.trim()) {
      setError(t('authIdentifierRequired'))
      return
    }

    setSubmitting(true)
    try {
      if (creating) {
        await createAccount({
          name,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
        })
      } else {
        await signIn(identifier.trim(), password)
      }
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(localizeError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-top">
          <Link className="auth-brand" to="/" aria-label={t('brand')}>
            <span className="auth-brand-mark">✦</span>
            <span>{t('brand')}</span>
          </Link>
          <div className="lang-switch" role="group" aria-label={t('language')}>
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >
              {lang === 'kn' ? t('langEn') : 'EN'}
            </button>
            <button
              type="button"
              className={lang === 'kn' ? 'active' : ''}
              onClick={() => setLang('kn')}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        <div className="auth-intro">
          <span className="section-kicker">{t('authKicker')}</span>
          <h1 id="auth-title">{creating ? t('authCreateTitle') : t('authLoginTitle')}</h1>
          <p>{creating ? t('authCreateLead') : t('authLoginLead')}</p>
        </div>

        {(startupError || error) && (
          <p className="api-error auth-error" role="alert">
            {error || startupError}
          </p>
        )}

        <form className="auth-form" onSubmit={submit}>
          {creating ? (
            <>
              <label>
                {t('name')}
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('authNamePlaceholder')}
                  maxLength={100}
                />
              </label>
              <p className="auth-field-hint">{t('authEitherIdentifier')}</p>
              <label>
                {t('email')}
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={lang === 'kn' ? 'ಉದಾ: ಹೆಸರು@example.com' : t('emailPlaceholder')}
                  maxLength={254}
                />
              </label>
              <label>
                {t('phone')}
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t('phonePlaceholder')}
                  maxLength={20}
                />
              </label>
            </>
          ) : (
            <label>
              {t('authIdentifier')}
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t('authIdentifierPlaceholder')}
                required
                maxLength={254}
              />
            </label>
          )}

          <label>
            {t('password')}
            <input
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('authPasswordPlaceholder')}
              minLength={6}
              maxLength={128}
              required
            />
          </label>

          <button className="btn primary auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? t('authSubmitting')
              : creating
                ? t('authCreateAction')
                : t('authLoginAction')}
          </button>
        </form>

        <div className="auth-switch">
          <span>{creating ? t('authExistingAccount') : t('authNewAccount')}</span>
          <button
            type="button"
            onClick={() => {
              setCreating((value) => !value)
              setError('')
            }}
          >
            {creating ? t('authLoginAction') : t('authCreateAction')}
          </button>
        </div>
      </section>
    </main>
  )
}
