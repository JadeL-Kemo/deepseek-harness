/** Translation controls for one expanded reasoning body. */
import { useMemo } from 'react'
import type { LocaleSnapshot } from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type { HostObservable, InjectFace, PropsLocale, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { CotTranslationPreferences } from '../preferences.ts'
import type { TranslateText } from './translation.ts'
import { TranslationToolbar } from './TranslationToolbar.tsx'
import { useReasoningTranslation } from './useReasoningTranslation.ts'
import { NS } from './locales.ts'

/** Registry-side values and callbacks bound for the reasoning contribution. */
export interface TranslationBodyInjected {
  hooks: {
    preferences: HostObservable<CotTranslationPreferences>
    translationLocale: HostObservable<LocaleSnapshot>
    translationLimit: HostObservable<number>
  }
  translate: TranslateText
}

export type TranslationBodyProps = PropsRuntime<'conversation.chat.reasoning.body'>
  & PropsRenderFactories & PropsLocale<typeof NS> & InjectFace<TranslationBodyInjected>

/**
 * Render translated reasoning, retaining the complete original until a failed request is retried.
 * @param props - display-ready reasoning, translation preferences, and cancellation-aware callback.
 * @returns compact Markdown and translation status with a retry action on failure.
 */
export function TranslationBody(props: TranslationBodyProps) {
  const { text, running, translate, t, renderFactorySlot } = props
  const preferences = props.usePreferences(value => value)
  const locale = props.useTranslationLocale(value => value.active)
  const maxTextChars = props.useTranslationLimit(value => value)
  const translation = useReasoningTranslation({ text, running, preferences, locale, maxTextChars, translate })
  const labels = useMemo(() => ({ code: {
    copyLabel: t('copy'),
    copiedLabel: t('copied'),
    toolbarLabels: { codeLabel: t('codeTitle'), wrapLabel: t('wrap'), unwrapLabel: t('unwrap') },
  }, footnotes: t('footnotes') }), [t])
  const showOriginal = translation.showOriginal
  return <div data-cot-translation="true" data-translation-state={translation.state.failed ? 'failed' : translation.state.pending ? 'pending' : 'ready'}
    data-translation-view={showOriginal ? 'original' : 'translated'}>
    <TranslationToolbar failed={translation.state.failed} pending={translation.state.pending}
      showOriginal={showOriginal} t={t} onToggle={() => { translation.toggle() }} onRetry={() => { translation.retry() }} />
    {renderFactorySlot('conversation.chat.reasoning.content', { text: showOriginal ? text : translation.state.text, running, labels })}
  </div>
}
