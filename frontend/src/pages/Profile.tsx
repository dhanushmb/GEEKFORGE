import { type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'
import type { Journey, Profile } from '../types'

export function ProfilePage() {
  const { t } = useLang()
  const { profile, setProfile } = useProfile()
  const navigate = useNavigate()

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile({ ...profile, [key]: value })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (profile.journey === 'admission') navigate('/admissions')
    else if (profile.journey === 'restart') navigate('/restart')
    else navigate('/roadmap')
  }

  const journeys: { id: Journey; title: 'schoolTitle' | 'admissionTitle' | 'restartTitle' }[] = [
    { id: 'school', title: 'schoolTitle' },
    { id: 'admission', title: 'admissionTitle' },
    { id: 'restart', title: 'restartTitle' },
  ]

  return (
    <section>
      <h1>{t('profileHeading')}</h1>
      <p className="lede">{t('profileLead')}</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t('name')}
          <input value={profile.name} onChange={(e) => update('name', e.target.value)} required />
        </label>
        <fieldset>
          <legend>{t('journey')}</legend>
          <div className="choice-row">
            {journeys.map((j) => (
              <label key={j.id} className={profile.journey === j.id ? 'chip on' : 'chip'}>
                <input
                  type="radio"
                  name="journey"
                  checked={profile.journey === j.id}
                  onChange={() => update('journey', j.id)}
                />
                {t(j.title)}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          {t('education')}
          <input value={profile.education} onChange={(e) => update('education', e.target.value)} required />
        </label>
        <label>
          {t('interest')}
          <input value={profile.interest} onChange={(e) => update('interest', e.target.value)} required />
        </label>
        <label>
          {t('location')}
          <input value={profile.location} onChange={(e) => update('location', e.target.value)} />
        </label>
        <label>
          {t('rank')}
          <input value={profile.rank} onChange={(e) => update('rank', e.target.value)} />
        </label>
        <label>
          {t('budget')}
          <input value={profile.budget} onChange={(e) => update('budget', e.target.value)} />
        </label>
        <button className="btn primary" type="submit">
          {t('saveProfile')}
        </button>
      </form>
    </section>
  )
}
