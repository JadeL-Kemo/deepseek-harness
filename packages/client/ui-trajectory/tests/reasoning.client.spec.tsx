// @vitest-environment jsdom
/** Trajectory reasoning Content Factory and its default Body entry. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createElement, type ComponentProps } from 'react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { en as commonEn } from '@deepseek-ai/dsh-client-locale/src/locales/en.ts'
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRenderFactories } from '@deepseek-ai/dsh-client-ui-slots'
import type { TrajectoryReasoningContentInput } from '../src/client/trajectory-contract.ts'
import {
  DefaultTrajectoryReasoningBody, TrajectoryReasoningContent,
  type TrajectoryReasoningBodyProps,
} from '../src/client/TrajectoryReasoning.tsx'
import { en } from '../src/client/locales.ts'

const CODE = '```text\nfirst line\nsecond line\n```'
const labels: MarkdownLabels = {
  code: {
    copyLabel: 'Copy snippet', copiedLabel: 'Snippet copied',
    toolbarLabels: { codeLabel: 'Snippet', wrapLabel: 'Wrap snippet', unwrapLabel: 'Unwrap snippet' },
  },
  footnotes: 'References',
}
const t = makeTranslate(en, commonEn)

function content(input: TrajectoryReasoningContentInput) {
  // The component only reads these inputs; the unused framework seats are
  // exercised through the real runtime in the view acceptance suite.
  return createElement(TrajectoryReasoningContent, { ...input, t } as ComponentProps<typeof TrajectoryReasoningContent>)
}

afterEach(cleanup)

describe('Trajectory reasoning Content Factory', () => {
  it('renders compact Markdown with the current Trajectory labels by default', () => {
    const view = render(content({ text: CODE, running: false }))
    expect(view.getByRole('button', { name: 'Copy' })).toBeTruthy()
    expect(view.container.querySelector('[data-markdown-variant="compact"]')).not.toBeNull()
  })

  it('uses complete caller labels and keeps the preview container separate from the inspector payload', () => {
    const payload = render(content({ text: CODE, running: false }))
    const preview = render(content({ text: CODE, running: false, preview: true, labels }))
    expect(preview.getByRole('button', { name: 'Copy snippet' })).toBeTruthy()
    expect(preview.getByRole('button', { name: 'Wrap snippet' })).toBeTruthy()
    expect(preview.container.firstElementChild?.className)
      .not.toBe(payload.container.firstElementChild?.className)
  })

  it('passes the recorded reasoning state and preview flag through the default Body to the Factory', () => {
    const renderFactorySlot = vi.fn<PropsRenderFactories['renderFactorySlot']>(() => <span data-testid="factory" />)
    const props = {
      text: 'Expanded reasoning', running: true, preview: false, renderFactorySlot,
    } as TrajectoryReasoningBodyProps
    const view = render(createElement(DefaultTrajectoryReasoningBody, props))
    expect(view.getByTestId('factory')).toBeTruthy()
    expect(renderFactorySlot).toHaveBeenCalledWith('conversation.trajectory.reasoning.content', {
      text: 'Expanded reasoning', running: true, preview: false,
    })
  })
})
