import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AUTH_TOKEN_KEY,
  createAccount as createAccountRequest,
  getCurrentUser,
  signIn as signInRequest,
  signOutRequest,
  type AuthUser,
  type CreateAccountInput,
} from './services/api'
import { useLang } from './LanguageContext'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  startupError: string
  signIn: (identifier: string, password: string) => Promise<void>
  createAccount: (input: CreateAccountInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
  )
  const [startupError, setStartupError] = useState('')

  useEffect(() => {
    let active = true
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (active) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          setStartupError(
            error instanceof Error && error.message.includes('expired')
              ? t('authSessionExpired')
              : t('authRestoreFailed')
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [t])

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null)
      setStartupError(t('authSessionExpired'))
    }
    window.addEventListener('disha-auth-expired', handleExpiredSession)
    return () => window.removeEventListener('disha-auth-expired', handleExpiredSession)
  }, [t])

  const signIn = useCallback(async (identifier: string, password: string) => {
    const session = await signInRequest(identifier, password)
    localStorage.setItem(AUTH_TOKEN_KEY, session.token)
    setStartupError('')
    setUser(session.user)
  }, [])

  const createAccount = useCallback(async (input: CreateAccountInput) => {
    const session = await createAccountRequest(input)
    localStorage.setItem(AUTH_TOKEN_KEY, session.token)
    setStartupError('')
    setUser(session.user)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await signOutRequest()
    } catch (error) {
      console.error('Unable to revoke the sign-in session:', error)
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, startupError, signIn, createAccount, signOut }),
    [user, loading, startupError, signIn, createAccount, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
