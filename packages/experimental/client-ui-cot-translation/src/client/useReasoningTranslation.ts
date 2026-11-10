/** Shared translation lifecycle and disclosure state for one expanded reasoning body. */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LocaleSnapshot } from '@deepseek-ai/dsh-client-locale/client'
import type { CotTranslationPreferences } from '../preferences.ts'
import { ReasoningTranslation, type TranslateText, type TranslationState } from './translation.ts'

/** Host values and callbacks bound to one expanded reasoning body. */
export interface ReasoningTranslationInput {
  readonly text: string
  readonly running: boolean
  readonly preferences: CotTranslationPreferences
  readonly locale: LocaleSnapshot['active']
  readonly maxTextChars: number
  readonly translate: TranslateText
}

/** Display state for translated reasoning plus its disclosure actions. */
export interface ReasoningTranslationView {
  /** Current display state, including completed translations for stable fragments. */
  readonly state: TranslationState
  /** Whether original text should be displayed because the reader chose it or a request failed. */
  readonly showOriginal: boolean
  /** Switch between the original and the translated text; ignored while a failure pins the original. */
  toggle(): void
  /** Retry failed fragments without leaving the disclosure. */
  retry(): void
}

/**
 * Own one translation controller for the mounted disclosure and expose its display state.
 * @param input - current original text, streaming flag, provider selection, limits, and Remote callback.
 * @returns display state and actions bound to the disclosure's controller.
 */
export function useReasoningTranslation(input: ReasoningTranslationInput): ReasoningTranslationView {
  const { text, running, translate } = input
  const targetLanguage = input.preferences.targetLanguage === 'auto'
    ? input.locale
    : input.preferences.targetLanguage
  const [state, setState] = useState<TranslationState>({ text, pending: false, failed: false })
  const [original, setOriginal] = useState(false)
  const translation = useRef<ReasoningTranslation>()
  useEffect(() => {
    const controller = new ReasoningTranslation(
      { provider: input.preferences.provider, targetLanguage },
      input.maxTextChars,
      translate,
      setState,
    )
    translation.current = controller
    return () => {
      controller.dispose()
      translation.current = undefined
    }
  }, [input.preferences.provider, targetLanguage, input.maxTextChars, translate])
  useEffect(() => {
    translation.current?.update(text, running)
  }, [text, running, input.preferences.provider, targetLanguage, input.maxTextChars, translate])
  const showOriginal = original || state.failed
  return useMemo(() => ({
    state,
    showOriginal,
    toggle: () => { setOriginal(!showOriginal) },
    retry: () => { translation.current?.retry() },
  }), [state, showOriginal])
}
