"use client"

import { useCallback, useState } from "react"

interface SpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice
}

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(typeof window !== "undefined" && "speechSynthesis" in window)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (!isSupported) {
        console.warn("Speech synthesis not supported")
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set options
      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 0.8

      if (options.voice) {
        utterance.voice = options.voice
      }

      // Event listeners
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSupported],
  )

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const getVoices = useCallback(() => {
    if (isSupported) {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
      return availableVoices
    }
    return []
  }, [isSupported])

  return {
    speak,
    stop,
    getVoices,
    isSupported,
    isSpeaking,
    voices,
  }
}
