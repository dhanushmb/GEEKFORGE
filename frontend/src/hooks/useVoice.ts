
import { useEffect, useRef, useState } from 'react'
import { transcribeVoice } from '../services/api'
import { useLang } from '../LanguageContext'

const MAX_RECORDING_MS = 30_000
const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

function encodeWav(audio: AudioBuffer): Blob {
  const sampleCount = audio.length
  const channels = audio.numberOfChannels
  const bytesPerSample = 2
  const buffer = new ArrayBuffer(44 + sampleCount * bytesPerSample)
  const view = new DataView(buffer)
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeText(0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * bytesPerSample, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, audio.sampleRate, true)
  view.setUint32(28, audio.sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeText(36, 'data')
  view.setUint32(40, sampleCount * bytesPerSample, true)

  const channelData = Array.from(
    { length: channels },
    (_, channel) => audio.getChannelData(channel)
  )

  for (let index = 0; index < sampleCount; index += 1) {
    let sample = 0
    for (const channel of channelData) sample += channel[index]
    sample = Math.max(-1, Math.min(1, sample / channels))
    view.setInt16(
      44 + index * bytesPerSample,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    )
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

async function toWav(recording: Blob): Promise<Blob> {
  const context = new AudioContext()
  try {
    const audio = await context.decodeAudioData(await recording.arrayBuffer())
    return encodeWav(audio)
  } finally {
    await context.close()
  }
}

export function useVoice() {
  const { t } = useLang()
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<number | null>(null)
  const cancelledRef = useRef(false)

  const supported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined' &&
    typeof AudioContext !== 'undefined'

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      const recorder = recorderRef.current
      if (recorder?.state === 'recording') recorder.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function startListening(language = 'en-IN') {
    if (listening || processing) return

    if (!supported) {
      setError(t('voiceUnsupported'))
      return
    }

    setError('')
    setTranscript('')

    try {
      cancelledRef.current = false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const mimeType = MIME_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type)
      )
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )

      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        setListening(false)

        if (cancelledRef.current) return

        const recording = new Blob(chunksRef.current, {
          type: recorder.mimeType,
        })
        chunksRef.current = []
        if (!recording.size) {
          setError(t('voiceEmpty'))
          return
        }

        setProcessing(true)
        try {
          const wav = await toWav(recording)
          const text = await transcribeVoice(wav, language)
          if (!cancelledRef.current) {
            setTranscript(text)
            if (!text.trim()) {
              setError(t('voiceNoSpeech'))
            }
          }
        } catch {
          if (!cancelledRef.current) setError(t('voiceTranscriptionFailed'))
        } finally {
          if (!cancelledRef.current) setProcessing(false)
        }
      }
      recorder.start()
      setListening(true)
      timeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, MAX_RECORDING_MS)
    } catch (startError) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setListening(false)
      setError(
        startError instanceof DOMException &&
          startError.name === 'NotAllowedError'
          ? t('microphoneDenied')
          : t('microphoneUnavailable')
      )
    }
  }

  function stopListening() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  function speak(text: string, language = 'en-IN') {
    if (!('speechSynthesis' in window)) {
      setError(t('speechUnsupported'))
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.95
    utterance.pitch = 1

    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
  }

  return {
    listening,
    processing,
    transcript,
    error,
    supported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
