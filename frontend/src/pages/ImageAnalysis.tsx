
import { useState, type ChangeEvent } from 'react'
import { useLang } from '../LanguageContext'
import { analyzeImage as requestImageAnalysis } from '../services/api'

export default function ImageAnalysis() {
  const { lang, t } = useLang()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [error, setError] = useState('')

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(t('imageInvalid'))
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult('')
    setError('')
  }

  function removeImage() {
    setImage(null)
    setPreview('')
    setResult('')
    setError('')
  }

  async function analyzeImage() {
    if (!image) {
      setError(t('uploadImageFirst'))
      return
    }

    setImageLoading(true)
    setResult('')
    setError('')

    try {
      const data = await requestImageAnalysis(
        image,
        question.trim() || t('explainImagePrompt'),
        lang
      )
      setResult(data.analysis || t('noExplanation'))
    } catch (err) {
      console.error('Image analysis error:', err)

      setError(
        t('connectDisha')
      )
    } finally {
      setImageLoading(false)
    }
  }

  return (
    <section className="image-analysis-page">
      <div className="image-analysis-panel">
        <h1>{t('exploreImage')}</h1>

        <p>
          {t('imagePromptLead')}
        </p>

        <label className="image-upload-button">
          📷 {t('chooseImage')}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </label>

        {preview && (
          <div className="image-preview">
            <img
              src={preview}
              alt={t('uploadedImage')}
            />

            <p>{image?.name}</p>

            <button
              type="button"
              onClick={removeImage}
              disabled={imageLoading}
            >
              {t('removeImage')}
            </button>
          </div>
        )}

        <textarea
          className="image-analysis-panel-textarea"
          value={question || t('explainImagePrompt')}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('askImagePrompt')}
          disabled={imageLoading}
        />

        <button
          type="button"
          className="image-analyze-button"
          onClick={analyzeImage}
          disabled={!image || imageLoading}
        >
          {imageLoading
            ? `🔄 ${t('analyzingImage')}`
            : `✨ ${t('analyzeImage')}`}
        </button>

        {imageLoading && (
          <p>{t('imageLoading')}</p>
        )}

        {error && (
          <div className="api-error" role="alert">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="image-analysis-result">
            <h2>✨ {t('imageExplanationTitle')}</h2>

            <div>{result}</div>
          </div>
        )}
      </div>
    </section>
  )
}
