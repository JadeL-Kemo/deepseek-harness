/** Locale-owned Markdown chrome shared by every Trajectory Markdown surface. */
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { TrajectoryTranslate } from './locales.ts'

/**
 * Build Markdown chrome labels from the Trajectory dictionary.
 * @param t - Trajectory locale translator.
 * @returns labels for Markdown rendering and code controls.
 */
export function markdownLabels(t: TrajectoryTranslate): MarkdownLabels {
  return {
    code: { copyLabel: t('copy'), copiedLabel: t('copied') },
    footnotes: t('markdown.footnotes'),
  }
}
