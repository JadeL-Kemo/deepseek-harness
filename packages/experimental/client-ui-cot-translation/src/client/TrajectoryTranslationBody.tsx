/** Translation controls for one expanded Trajectory reasoning body. */
import { useMemo } from 'react'
import type { LocaleSnapshot } from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-trajectory/client'
import type { HostObservable, InjectFace, PropsLocale, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { CotTranslationPreferences } from '../preferences.ts'
import type { TranslateText } from './translation.ts'
import { TranslationToolbar } from './TranslationToolbar.tsx'
import { useReasoningTranslation } from './useReasoningTranslation.ts'
import { NS } from './locales.ts'

/** Registry-side values and callbacks bound for the Trajectory reasoning contribution. */
export interface TrajectoryTranslationBodyInjected {
  hooks: {
    preferences: HostObservable<CotTranslationPreferences>
    translationLocale: HostObservable<LocaleSnapshot>
    translationLimit: HostObservable<number>
  }
  translate: TranslateText
}

export type TrajectoryTranslationBodyProps = PropsRuntime<'conversation.trajectory.reasoning.body'>
  & PropsRenderFactories & PropsLocale<typeof NS> & InjectFace<TrajectoryTranslationBodyInjected>

/**
 * Render translated Trajectory reasoning with the same compact Markdown and original-access rules as Chat.
 * @param props - display-ready reasoning, translation preferences, and cancellation-aware callback.
 * @returns translated compact Markdown with a retry action on failure.
 */
export function TrajectoryTranslationBody(props: TrajectoryTranslationBodyProps) {
  const { text, running, preview, translate, t, renderFactorySlot } = props
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
  return <div data-cot-translation="true" data-cot-translation-surface="trajectory"
    data-translation-state={translation.state.failed ? 'failed' : translation.state.pending ? 'pending' : 'ready'}
    data-translation-view={showOriginal ? 'original' : 'translated'}>
    <TranslationToolbar failed={translation.state.failed} pending={translation.state.pending}
      showOriginal={showOriginal} t={t} onToggle={() => { translation.toggle() }} onRetry={() => { translation.retry() }} />
    {renderFactorySlot('conversation.trajectory.reasoning.content', {
      text: showOriginal ? text : translation.state.text, running, preview, labels,
    })}
  </div>
}
