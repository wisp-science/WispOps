import { useId } from 'react'
import type { ReactNode } from 'react'
import { tr } from './i18n'

/**
 * Explanatory text behind a small ⓘ, shown on hover or keyboard focus (a tap focuses it on touch screens), so
 * descriptions do not crowd the page. Warnings and the effects of an action stay visible instead.
 * `end` opens the bubble leftward, for icons near the right edge.
 */
export function Hint({ text, align = 'start' }: { text: ReactNode; align?: 'start' | 'end' }) {
  const id = useId()
  return <span className={`wo-hint ${align}`} tabIndex={0} role="button" aria-label={tr('hint.label')} aria-describedby={id}>
    <span className="wo-hint-icon" aria-hidden="true">i</span>
    <span role="tooltip" id={id} className="wo-hint-pop">{text}</span>
  </span>
}
