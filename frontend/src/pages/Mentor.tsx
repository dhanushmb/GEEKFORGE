
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { careers } from '../data/careers'
import { localizeCareer } from '../data/careersKn'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'
import type { CopyKey } from '../i18n'
import {
  ApiError,
  askMentor,
  analyzeImage,
  exploreVideo,
  isBackendConfigured,
} from '../services/api'
import { useVoice } from '../hooks/useVoice'

type Msg = {
  role: 'user' | 'assistant'
  text: string
}

const mentorErrorKeys: Record<string, CopyKey> = {
  mentor_network: 'mentorNetworkError',
  mentor_rate_limited: 'mentorRateLimitError',
  mentor_configuration: 'mentorConfigurationError',
  mentor_busy: 'mentorTemporarilyUnavailable',
}

export function Mentor() {
  const { lang, t } = useLang()
  const { profile } = useProfile()

  const voice = useVoice()
  const speechLanguage = lang === 'kn' ? 'kn-IN' : 'en-IN'

  // Modes
  const [imageMode, setImageMode] = useState(false)
  const [videoMode, setVideoMode] = useState(false)

  // Text chat states
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Image analysis states
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageQuestion, setImageQuestion] = useState('')
  const [imageResult, setImageResult] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const imagePreview = selectedImage
    ? URL.createObjectURL(selectedImage)
    : ''

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  // Video explorer states
  const [videoUrl, setVideoUrl] = useState('')
  const [videoQuestion, setVideoQuestion] = useState('')
  const [videoResult, setVideoResult] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)

  // Text chat
  async function send(e: FormEvent) {
    e.preventDefault()

    const q = input.trim()
    if (!q || loading) return

    const submittedMessage: Msg = { role: 'user', text: q }
    setMessages((m) => [...m, submittedMessage])
    setInput('')
    setError('')
    setLoading(true)

    try {
      const reply = await askMentor(q, lang, profile)

      setMessages((m) => [
        ...m,
        { role: 'assistant', text: reply },
      ])
    } catch (err) {
      const messageKey = err instanceof ApiError && err.code
        ? mentorErrorKeys[err.code]
        : undefined
      setError(t(messageKey ?? (err instanceof TypeError ? 'mentorNetworkError' : 'mentorServiceError')))
      // Keep newer text if the user has already started another question.
      setInput(current => current || q)
      setMessages(current => current.filter(message => message !== submittedMessage))
    } finally {
      setLoading(false)
    }
  }

  // Image analysis
  async function handleImageAnalysis() {
    if (!selectedImage || imageLoading) {
      return
    }

    setImageLoading(true)
    setImageResult('')
    setError('')

    try {
      const result = await analyzeImage(
        selectedImage,
        imageQuestion.trim() || t('explainImagePrompt'),
        lang
      )
      setImageResult(result.analysis)
    } catch (err) {
      console.error('Image analysis failed:', err)
      setError(t('imageAnalysisError'))
    } finally {
      setImageLoading(false)
    }
  }

  // Video exploration
  async function handleVideoAnalysis() {
    if (!videoUrl.trim() || videoLoading) {
      return
    }

    setVideoLoading(true)
    setVideoResult('')
    setError('')

    try {
      const result = await exploreVideo(
        videoUrl.trim(),
        videoQuestion.trim() || t('videoDefaultQuestion'),
        lang
      )

      const explanation =
        result.explanation ||
        result.analysis ||
        result.answer ||
        result.result

      if (!explanation) {
        throw new Error(t('emptyVideoExplanation'))
      }

      setVideoResult(explanation)
    } catch (err) {
      console.error('Video analysis failed:', err)
      setError(t('videoAnalysisError'))
    } finally {
      setVideoLoading(false)
    }
  }

  // Switch modes
  function openChat() {
    setImageMode(false)
    setVideoMode(false)
    setError('')
  }

  function openImage() {
    setImageMode(true)
    setVideoMode(false)
    setError('')
  }

  function openVideo() {
    setImageMode(false)
    setVideoMode(true)
    setError('')
  }

  return (
    <section className="mentor-page">

      {/* Sidebar */}
      <aside className="mentor-sidebar">
        <div className="mentor-brand">
          <span className="mentor-orb">✦</span>
          <div>
            <strong>{t('mentorBrand')}</strong>
            <small>{t('mentorBrandLead')}</small>
          </div>
        </div>

        <button
          className={`mentor-tool ${
            !imageMode && !videoMode ? 'active' : ''
          }`}
          onClick={openChat}
        >
          <span>▤</span> {t('chatText')}
        </button>

        <button
          className={`mentor-tool ${voice.listening ? 'active' : ''}`}
          onClick={() => {
            if (voice.listening) voice.stopListening()
            else void voice.startListening(speechLanguage)
          }}
          disabled={voice.processing}
          aria-pressed={voice.listening}
        >
          <span>♬</span>
          {voice.processing
            ? t('transcribing')
            : voice.listening
              ? t('stopRecording')
              : t('voiceConversation')}
        </button>
        <button
          className={`mentor-tool ${imageMode ? 'active' : ''}`}
          onClick={openImage}
        >
          <span>▧</span> {t('imageAnalysis')}
        </button>

        <button
          className={`mentor-tool ${videoMode ? 'active' : ''}`}
          onClick={openVideo}
        >
          <span>▷</span> {t('videoExplorer')}
        </button>

        <div className="mentor-sidebar-note">
          {isBackendConfigured()
            ? t('connectedService')
            : t('demoGuide')}
        </div>
      </aside>

      {/* Main */}
      <div className="mentor-main">
        <div className="mentor-heading">
          <div>
            <span className="section-kicker">
              {t('mentorYourCompanion')}
            </span>
            <h1>{t('mentorHeading')}</h1>
            <p className="lede">{t('mentorLead')}</p>
          </div>

          <div className="mentor-status">
            <span />
            {isBackendConfigured() ? t('apiConnected') : t('demoMode')}
          </div>
        </div>

        {/* Image Analysis */}
        {imageMode && (
          <section className="image-analysis-panel">
            <h2>{t('exploreImage')}</h2>
            <p>
              {t('imagePromptLead')}
            </p>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]

                if (file) {
                  setSelectedImage(file)
                  setImageResult('')
                  setError('')
                }

                e.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
            >
              📷 {t('chooseImage')}
            </button>

            {selectedImage && (
              <div className="image-preview">
                <img src={imagePreview} alt={t('selectedImageAlt')} />
                <p>{selectedImage.name}</p>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null)
                    setImageResult('')
                  }}
                >
                  {t('removeImage')}
                </button>
              </div>
            )}

            <textarea
              value={imageQuestion || t('explainImagePrompt')}
              onChange={(e) => setImageQuestion(e.target.value)}
              placeholder={t('chooseImageQuestion')}
              rows={3}
            />

            <button
              type="button"
              onClick={handleImageAnalysis}
              disabled={
                !selectedImage ||
                imageLoading
              }
            >
              {imageLoading
                ? `🔄 ${t('analyzingImage')}`
                : `✨ ${t('analyzeImage')}`}
            </button>

            {imageLoading && (
              <p>{t('imageAnalyzingStatus')}</p>
            )}

            {imageResult && (
              <div className="image-analysis-result">
                <span className="message-mark">✦ {t('brand')}</span>

                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {imageResult}
                </ReactMarkdown>

                <button
                  type="button"
                  className="voice-play"
                  onClick={() => voice.speak(imageResult, speechLanguage)}
                >
                  🔊 {t('listen')}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Video Explorer */}
        {videoMode && (
          <section className="image-analysis-panel video-explorer-panel">
            <h2>🎬 {t('videoHeading')}</h2>

            <p>
              {t('videoLead')}
            </p>

            <label htmlFor="disha-video-url">
              {t('videoUrl')}
            </label>

            <input
              id="disha-video-url"
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value)
                setVideoResult('')
                setError('')
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <label htmlFor="disha-video-question">
              {t('videoQuestion')}
            </label>

            <textarea
              id="disha-video-question"
              value={videoQuestion || t('videoDefaultQuestion')}
              onChange={(e) => setVideoQuestion(e.target.value)}
              rows={4}
              placeholder={t('videoQuestionPlaceholder')}
            />

            <button
              type="button"
              onClick={handleVideoAnalysis}
              disabled={
                !videoUrl.trim() ||
                videoLoading
              }
            >
              {videoLoading
                ? `🔄 ${t('exploringVideo')}`
                : `✨ ${t('exploringVideo')}`}
            </button>

            {videoLoading && (
              <p>
                {t('exploringVideoStatus')}
              </p>
            )}

            {videoResult && (
              <div className="image-analysis-result">
                <span className="message-mark">✦ {t('videoGuide')}</span>

                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {videoResult}
                </ReactMarkdown>

                <button
                  type="button"
                  className="voice-play"
                  onClick={() => voice.speak(videoResult, speechLanguage)}
                >
                  🔊 {t('listen')}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Conversation */}
        <div className="mentor-conversation">
          {messages.length === 0 ? (
            <div className="mentor-welcome">
              <span className="mentor-orb large">✦</span>

              <h2>
                {t('welcomeExplore')}{profile.name ? `, ${profile.name}` : ''}
              </h2>

              <p>
                {t('mentorWelcomeLead')}
              </p>

              <div className="suggestion-grid">
                {careers.slice(0, 4).map((item) => {
                  const c = localizeCareer(item, lang)
                  return (
                  <Link
                    key={c.slug}
                    to={`/career/${c.slug}`}
                    className="suggestion-card"
                  >
                    <span className={`suggestion-art tone-${c.tone}`}>
                      {c.mark}
                    </span>
                    <strong>{c.title}</strong>
                    <small>{c.domain}</small>
                    <span className="suggestion-arrow">→</span>
                  </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((m, i) => (
                <article
                  key={i}
                  className={`bubble ${m.role}`}
                >
                  {m.role === 'assistant' && (
                    <span className="message-mark">✦</span>
                  )}

                  {m.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  ) : (
                    m.text
                  )}

                  {m.role === 'assistant' && (
                    <button
                      type="button"
                      className="voice-play"
                      onClick={() => voice.speak(m.text, speechLanguage)}
                    >
                      🔊 {t('listen')}
                    </button>
                  )}
                </article>
              ))}

              {loading && (
                <article className="bubble assistant">
                  <span className="typing-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </article>
              )}
            </div>
          )}

          {error && (
            <p className="api-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Text Chat Composer */}
        <form
          className="composer mentor-composer"
          onSubmit={send}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('mentorPlaceholder')}
            aria-label={t('mentorPlaceholder')}
          />

          <button
            className="voice-button"
            type="button"
            onClick={() => {
              if (voice.listening) voice.stopListening()
              else void voice.startListening(speechLanguage)
            }}
            disabled={voice.processing}
            title={
              voice.listening
                ? t('stopRecording')
                : t('recordVoiceMessage')
            }
            aria-label={
              voice.listening
                ? t('stopVoiceRecording')
                : t('recordVoiceMessage')
            }
          >
            {voice.processing ? '⏳' : voice.listening ? '⏹' : '🎤'}
          </button>

          <button
            className="send-button"
            type="submit"
            disabled={!input.trim() || loading}
            aria-label={t('send')}
          >
            ↑
          </button>
        </form>

        {/* Voice input */}
        {voice.transcript && (
          <div className="voice-result">
            <p>🎤 {voice.transcript}</p>

            <button
              type="button"
              onClick={() => setInput(voice.transcript)}
            >
              {t('useVoiceInput')}
            </button>
          </div>
        )}

        {voice.processing && (
          <p className="voice-processing" role="status">
            {t('transcribeRecording')}
          </p>
        )}

        {voice.error && (
          <p className="api-error">{voice.error}</p>
        )}

        <button
          type="button"
          className="voice-play"
          onClick={voice.stopSpeaking}
        >
          ⏹ {t('stopSpeaking')}
        </button>

        <p className="mentor-disclaimer">
          {t('mentorDisclaimer')}
        </p>
      </div>
    </section>
  )
}
