/** Compact reasoning Markdown and its owner-slot body for the Trajectory inspector. */
import { memo, useMemo } from 'react'
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  FactoryComponentPropsOf, PropsRenderFactories, PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: registers the Trajectory reasoning SlotMap and Factory rows.
import type {} from './trajectory-contract.ts'
import { markdownLabels } from './trajectory-markdown.ts'
import css from './TrajectoryTable.module.css'

/** Default compact Markdown for one expanded Trajectory reasoning block. */
export const TrajectoryReasoningContent = memo(function TrajectoryReasoningContent({
  text,
  running,
  preview = false,
  labels,
  t,
}: FactoryComponentPropsOf<'conversation.trajectory.reasoning.content'>) {
  const resolvedLabels = useMemo(() => labels ?? markdownLabels(t), [labels, t])
  return (
    <div className={preview ? css.markdownPreview : css.markdownPayload}>
      <MarkdownText text={text} streaming={running} labels={resolvedLabels} variant="compact" />
    </div>
  )
})

/** Props of the default Trajectory reasoning body. */
export type TrajectoryReasoningBodyProps =
  PropsRuntime<'conversation.trajectory.reasoning.body'> & PropsRenderFactories

/**
 * Render one expanded Trajectory reasoning block through the Content Factory,
 * so translation contributions keep the shipped compact typography.
 * @param props - owner-supplied reasoning text and the Factory renderer.
 * @returns the registered Content Factory occurrence.
 */
export function DefaultTrajectoryReasoningBody({
  text,
  running,
  preview,
  renderFactorySlot,
}: TrajectoryReasoningBodyProps) {
  return renderFactorySlot('conversation.trajectory.reasoning.content', { text, running, preview })
}
