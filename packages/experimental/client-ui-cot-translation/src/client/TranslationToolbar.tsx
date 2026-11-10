/** Translation status controls shared by Chat and Trajectory reasoning disclosures. */
import { Button, IconLoadingOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { CotTranslationKey } from './locales.ts'
import css from './Translation.module.css'

/** Display facts and actions one reasoning disclosure offers above its translated body. */
export interface TranslationToolbarProps {
  /** Whether the current provider request failed and the original is pinned. */
  readonly failed: boolean
  /** Whether at least one request is still in flight. */
  readonly pending: boolean
  /** Whether the original text is currently displayed. */
  readonly showOriginal: boolean
  /** Localized copy for the disclosure controls. */
  readonly t: (key: CotTranslationKey) => string
  /** Switch between original and translated text. */
  readonly onToggle: () => void
  /** Retry failed fragments. */
  readonly onRetry: () => void
}

/**
 * Render the reader's view switch plus translation progress or failure state.
 * @param props - disclosure flags, localized copy, and the reader's actions.
 * @returns one toolbar row that shares the Chat disclosure's spacing tokens.
 */
export function TranslationToolbar({ failed, pending, showOriginal, t, onToggle, onRetry }: TranslationToolbarProps) {
  return <div className={css.toolbar}>
    <Button className={css.viewToggle} size="sm" variant="ghost" disabled={failed}
      onClick={onToggle}>{t(showOriginal ? 'translation' : 'original')}</Button>
    {pending && <span role="status" aria-label={t('translating')}><IconLoadingOutlineRegular size={14} className={css.spinner} /></span>}
    {failed && <><span className={css.failure} role="status">{t('failed')}</span>
      <Button size="sm" variant="ghost" onClick={onRetry}>{t('retry')}</Button></>}
  </div>
}
