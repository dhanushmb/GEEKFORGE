
import { careers as demoCareers, type Career } from '../data/careers'
import { mentorReply } from '../data/demoData'
import type { Lang, Profile } from '../types'

const baseUrl = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/$/, '')

export const AUTH_TOKEN_KEY = 'disha-auth-token'

export class ApiError extends Error {
  readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export type AuthUser = {
  id: number
  name: string
  email: string | null
  phone: string | null
}

export type AuthSession = {
  token: string
  expires_at: number
  user: AuthUser
}

export type CreateAccountInput = {
  name: string
  email?: string
  phone?: string
  password: string
}

function authHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers)
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) result.set('Authorization', `Bearer ${token}`)
  return result
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    headers: authHeaders(init.headers),
  })
  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    window.dispatchEvent(new Event('disha-auth-expired'))
  }
  return response
}

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  if (!baseUrl) {
    throw new Error('Sign-in service is not configured. Set VITE_API_BASE_URL.')
  }
  const response = await fetch(`${baseUrl}/api/auth${path}`, {
    method: path === '/me' ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return readJson<T>(response)
}

export async function createAccount(
  input: CreateAccountInput
): Promise<AuthSession> {
  return authRequest<AuthSession>('/signup', input)
}

export async function signIn(
  identifier: string,
  password: string
): Promise<AuthSession> {
  return authRequest<AuthSession>('/login', { identifier, password })
}

export async function getCurrentUser(): Promise<AuthUser> {
  if (!baseUrl) {
    throw new Error('Sign-in service is not configured. Set VITE_API_BASE_URL.')
  }
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) throw new Error('No active sign-in session.')
  const response = await authenticatedFetch(`${baseUrl}/api/auth/me`)
  const data = await readJson<{ user: AuthUser }>(response)
  return data.user
}

export async function signOutRequest(): Promise<void> {
  if (!baseUrl || !localStorage.getItem(AUTH_TOKEN_KEY)) return
  const response = await authenticatedFetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
  })
  if (!response.ok && response.status !== 401) await readJson(response)
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `DISHA API returned ${response.status}`
    let code: string | undefined

    try {
      const errorData = await response.json()
      code = typeof errorData.code === 'string' ? errorData.code : undefined
      const detail = errorData.detail
      message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg).filter(Boolean).join(' ')
          : message
    } catch {
      // Keep default error message
    }

    throw new ApiError(message, code)
  }

  return response.json() as Promise<T>
}

// CAREER CATALOG

export async function getCareerCatalog(): Promise<Career[]> {
  if (!baseUrl) return demoCareers

  const response = await authenticatedFetch(`${baseUrl}/api/careers`)
  const data = await readJson<Career[] | { careers: Career[] }>(response)

  return Array.isArray(data) ? data : data.careers
}

// AI MENTOR CHAT

export async function askMentor(
  message: string,
  lang: Lang,
  profile: Profile
): Promise<string> {
  if (!baseUrl) {
    return mentorReply(message, profile.journey, lang)
  }

  const question = `
Student profile: ${JSON.stringify(profile)}
Student question: ${message}

Answer as DISHA AI, a friendly career guide for Indian school students.
Use simple language, explain career pathways and practical next steps.
`

  const response = await authenticatedFetch(`${baseUrl}/api/career/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      language: lang === 'kn' ? 'Kannada' : 'English',
    }),
  })

  const data = await readJson<{ answer: string; source?: string }>(response)

  return data.answer
}

// BACKEND STATUS

export function isBackendConfigured() {
  return Boolean(baseUrl)
}

// AI CAREER RECOMMENDATIONS

export interface AIRecommendedCareer {
  career: string
  description: string
  why_suitable: string
  skills_to_learn: string[]
  education_pathway: string
  first_step: string
  evidence: DatasetEvidence[]
}

export interface DatasetEvidence {
  id: string
  kind: 'pathway' | 'course' | 'cutoff'
  title: string
  source_file: string
  source_row: number
  eligibility?: string
  starting_point?: string
  entrance_exam_or_admission?: string
  offered_by?: string
  source_platform?: string
  duration?: string
  cost?: string
  start_date?: string
  end_date?: string
  url?: string
  college?: string
  exam?: string
  exam_basis?: string
  year?: number | null
  round?: string | null
  quota?: string
  category?: string
  cutoff_rank?: number
  rank_comparison?: 'within_historical_cutoff' | 'above_historical_cutoff'
}

export interface CareerRecommendInput {
  interests: string[]
  subjects: string[]
  skills: string[]
  class_level: string
  language: string
  exam?: 'KCET' | 'PGCET'
  rank?: number
  category?: string
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseEvidence(value: unknown): DatasetEvidence[] {
  return Array.isArray(value)
    ? value.filter((record): record is DatasetEvidence =>
        record !== null && typeof record === 'object' &&
        ['pathway', 'course', 'cutoff'].includes(record.kind) &&
        typeof record.id === 'string' && typeof record.title === 'string' &&
        typeof record.source_file === 'string' && typeof record.source_row === 'number')
    : []
}

function asSkillList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[,;/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function unwrapJsonPayload(raw: string): unknown {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }

    const listStart = trimmed.indexOf('[')
    const listEnd = trimmed.lastIndexOf(']')

    if (listStart >= 0 && listEnd > listStart) {
      return JSON.parse(trimmed.slice(listStart, listEnd + 1))
    }

    throw new Error('Could not parse career recommendations')
  }
}

function normalizeRecommendation(
  item: unknown
): AIRecommendedCareer | null {
  if (!item || typeof item !== 'object') return null

  const record = item as Record<string, unknown>

  const career =
    asText(record.career) ||
    asText(record.title) ||
    asText(record.name)

  if (!career) return null

  return {
    career,
    description: asText(record.description),
    why_suitable:
      asText(record.why_suitable) ||
      asText(record.whySuitable),
    skills_to_learn: asSkillList(
      record.skills_to_learn ??
        record.skillsToLearn ??
        record.skills
    ),
    education_pathway:
      asText(record.education_pathway) ||
      asText(record.educationPathway),
    first_step:
      asText(record.first_step) ||
      asText(record.firstStep),
    evidence: parseEvidence(record.evidence),
  }
}

export function parseCareerRecommendations(
  raw: unknown
): AIRecommendedCareer[] {
  let value: unknown = raw

  if (typeof value === 'string') {
    value = unwrapJsonPayload(value)
  }

  const nested =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { recommendations?: unknown }).recommendations
      : undefined

  const list = Array.isArray(value)
    ? value
    : Array.isArray(nested)
      ? nested
      : typeof nested === 'string'
        ? parseCareerRecommendations(nested)
        : []

  return list
    .map(normalizeRecommendation)
    .filter(
      (item): item is AIRecommendedCareer => item !== null
    )
}

export async function getAIRecommendations(
  input: CareerRecommendInput
): Promise<{ recommendations: AIRecommendedCareer[]; cutoffReferences: DatasetEvidence[] }> {
  if (!baseUrl) {
    throw new Error('Career recommendation API is not configured')
  }

  const response = await authenticatedFetch(`${baseUrl}/api/career/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = await readJson<{
    recommendations:
      | string
      | AIRecommendedCareer[]
      | { recommendations?: unknown }
    source?: string
    message?: string
    cutoff_references?: unknown
  }>(response)

  const recommendations = parseCareerRecommendations(
    data.recommendations
  )

  if (!recommendations.length) {
    throw new Error(
      data.message ||
        'Career recommendations are temporarily unavailable.'
    )
  }

  return { recommendations, cutoffReferences: parseEvidence(data.cutoff_references) }
}

// IMAGE ANALYSIS

export interface ImageAnalysisResult {
  success: boolean
  question: string
  analysis: string
  source: string
}

export async function analyzeImage(
  image: File,
  question: string,
  language: Lang
): Promise<ImageAnalysisResult> {
  if (!baseUrl) {
    throw new Error('DISHA AI backend is not configured')
  }

  const formData = new FormData()
  formData.append('image', image)
  formData.append('question', question)
  formData.append('language', language === 'kn' ? 'Kannada' : 'English')

  const response = await authenticatedFetch(`${baseUrl}/api/image/analyze`, {
    method: 'POST',
    body: formData,
  })

  return readJson<ImageAnalysisResult>(response)
}

// VIDEO EXPLORER

export interface VideoAnalysisResult {
  success?: boolean
  url?: string
  explanation?: string
  analysis?: string
  answer?: string
  result?: string
  source?: string
}

export async function exploreVideo(
  url: string,
  question: string,
  language: Lang
): Promise<VideoAnalysisResult> {
  if (!baseUrl) {
    throw new Error('DISHA AI backend is not configured')
  }

  const response = await authenticatedFetch(`${baseUrl}/api/video/explore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      question,
      language: language === 'kn' ? 'Kannada' : 'English',
    }),
  })

  return readJson<VideoAnalysisResult>(response)
}

export async function transcribeVoice(
  audio: Blob,
  language: string
): Promise<string> {
  if (!baseUrl) {
    throw new Error('DISHA AI backend is not configured')
  }

  const formData = new FormData()
  formData.append('audio', audio, 'voice.wav')
  formData.append('language', language)

  const response = await authenticatedFetch(`${baseUrl}/api/voice/transcribe`, {
    method: 'POST',
    body: formData,
  })
  const data = await readJson<{ transcript: string }>(response)

  return data.transcript
}
