import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Tone = 'pos' | 'neg' | 'warn' | 'info' | 'neutral' | 'violet'

const TONE: Record<Tone, string> = {
  pos: 'bg-pos-soft text-pos',
  neg: 'bg-neg-soft text-neg',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-primary-600',
  neutral: 'bg-bg-soft text-muted',
  violet: 'bg-[#f1ecfe] text-[#7c3aed]',
}

/** 상태 뱃지 — 옅은 배경 + 의미색 텍스트 (DESIGN.md 5) */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
