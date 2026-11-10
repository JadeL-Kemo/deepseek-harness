// @vitest-environment jsdom
/** Translated Trajectory reasoning keeps the recorded original and its preview state. */
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { bindSnapshotSelector, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { LocaleSnapshot } from '@deepseek-ai/dsh-client-locale/client'
import type { PropsRenderFactories } from '@deepseek-ai/dsh-client-ui-slots'
import {
  TrajectoryTranslationBody, type TrajectoryTranslationBodyProps,
} from '../src/client/TrajectoryTranslationBody.tsx'
import type { CotTranslationPreferences } from '../src/preferences.ts'
import { en } from '../src/client/locales.ts'
import type { TranslateText } from '../src/client/translation.ts'

afterEach(cleanup)

function fixture(text = 'Original trajectory reasoning') {
  const preferences = createSnapshotStore<CotTranslationPreferences>({ provider: 'google', targetLanguage: 'auto' })
  const locale = createSnapshotStore<LocaleSnapshot>({ active: 'zh', locales: [], revision: 0 })
  const translationLimit = createSnapshotStore(4000)
  const translate = vi.fn<TranslateText>(async request => `${request.provider}:${request.targetLanguage}:${request.text}`)
  const calls: Array<{ name: string; text: string; preview: boolean | undefined }> = []
  const renderFactorySlot = vi.fn<PropsRenderFactories['renderFactorySlot']>((name, input) => {
    const factoryInput = input as { text: string; preview?: boolean }
    calls.push({ name, text: factoryInput.text, preview: factoryInput.preview })
    return <span data-testid="factory">{factoryInput.text}</span>
  })
  const props = {
    text, running: false, preview: true, translate, renderFactorySlot, t: makeTranslate(en),
    usePreferences: bindSnapshotSelector(preferences), useTranslationLocale: bindSnapshotSelector(locale),
    useTranslationLimit: bindSnapshotSelector(translationLimit),
  } as TrajectoryTranslationBodyProps
  return { props, preferences, locale, translationLimit, translate, calls, renderFactorySlot }
}

it('renders translated Trajectory reasoning through its own Content Factory and switches back to the original', async () => {
  const b = fixture(), view = render(<TrajectoryTranslationBody {...b.props} />)
  await view.findByText('google:zh:Original trajectory reasoning')
  expect(b.translate).toHaveBeenCalledWith(
    { text: 'Original trajectory reasoning', provider: 'google', targetLanguage: 'zh' },
    expect.any(AbortSignal),
  )
  expect(view.container.querySelector('[data-cot-translation-surface="trajectory"]')).not.toBeNull()
  expect(view.container.querySelector('[data-translation-view]')?.getAttribute('data-translation-view')).toBe('translated')
  expect(b.calls.at(-1)).toEqual({
    name: 'conversation.trajectory.reasoning.content',
    text: 'google:zh:Original trajectory reasoning',
    preview: true,
  })

  fireEvent.click(view.getByRole('button', { name: 'View original' }))
  expect(view.getByText('Original trajectory reasoning')).toBeTruthy()
  expect(b.calls.at(-1)).toEqual({
    name: 'conversation.trajectory.reasoning.content',
    text: 'Original trajectory reasoning',
    preview: true,
  })
  fireEvent.click(view.getByRole('button', { name: 'View translation' }))
  expect(view.getByText('google:zh:Original trajectory reasoning')).toBeTruthy()
  expect(b.translate).toHaveBeenCalledTimes(1)
})

it('keeps the original visible after a failure and retries on the reader action', async () => {
  const b = fixture()
  b.translate.mockRejectedValueOnce(new Error('provider unavailable'))
  const view = render(<TrajectoryTranslationBody {...b.props} />)
  await view.findByText(en.failed)
  expect(view.getByText('Original trajectory reasoning')).toBeTruthy()
  expect(view.getByRole('button', { name: 'View translation' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(view.getByRole('button', { name: 'Retry' }))
  await view.findByText('google:zh:Original trajectory reasoning')
  expect(view.queryByText(en.failed)).toBeNull()
})

it('stops translating while the disclosure is collapsed by a later source update', async () => {
  const b = fixture('Unfinished'), pending = Promise.withResolvers<string>()
  b.translate.mockImplementationOnce(() => pending.promise)
  const view = render(<TrajectoryTranslationBody {...b.props} running />)
  expect(b.translate).not.toHaveBeenCalled()
  act(() => {
    view.rerender(<TrajectoryTranslationBody {...b.props} text={'First\n\nTail'} running />)
  })
  expect(view.getByRole('status', { name: en.translating })).toBeTruthy()
  expect(b.translate.mock.calls[0]?.[0].text).toBe('First')
  const signal = b.translate.mock.calls[0]![1]
  view.unmount()
  expect(signal.aborted).toBe(true)
  pending.resolve('ignored')
  await pending.promise
})

