import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import './App.css'
import { Layout } from './components/Layout'
import { LanguageProvider } from './LanguageContext'
import { ProfileProvider } from './ProfileContext'
import { Admissions } from './pages/Admissions'
import { Home } from './pages/Home'
import { Mentor } from './pages/Mentor'
import { ProfilePage } from './pages/Profile'
import { Restart } from './pages/Restart'
import { Roadmap } from './pages/Roadmap'
import { Scholarships } from './pages/Scholarships'
import { Discover } from './pages/Discover'
import { CareerMap } from './pages/CareerMap'
import { CareerDetail } from './pages/CareerDetail'
import { Journey } from './pages/Journey'
import { AuthPage } from './pages/AuthPage'
import { useLang } from './LanguageContext'

function ProtectedLayout() {
  const { user, loading } = useAuth()
  const { t } = useLang()
  if (loading) {
    return <main className="auth-loading" role="status">{t('authLoading')}</main>
  }
  return user ? <Layout /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/career-map" element={<CareerMap />} />
                <Route path="/career/:slug" element={<CareerDetail />} />
                <Route path="/journey" element={<Journey />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/mentor" element={<Mentor />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/admissions" element={<Admissions />} />
                <Route path="/restart" element={<Restart />} />
                <Route path="/scholarships" element={<Scholarships />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  )
}
