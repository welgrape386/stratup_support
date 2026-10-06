import { useState } from 'react'
import { Card } from '@/components/Card'
import { Icon } from '@/components/Icon'
import type { SupportMatchResponse } from '@/services/supportMatch/types'

/** 자격 미달로 제외된 공고와 사유 (접힘) */
export function ExcludedList({
  items,
  defaultOpen = false,
}: {
  items: SupportMatchResponse['excluded']
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (items.length === 0) return null
  return (
    <Card padded={false}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-6 py-3 text-left text-sm font-semibold text-ink-soft sm:px-7"
      >
        자격이 안 맞아 제외된 공고 {items.length}건 {open ? '접기' : '보기'}
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} />
      </button>
      {open && (
        <ul className="flex flex-col gap-2.5 border-t border-line px-6 py-4 sm:px-7">
          {items.map((x) => (
            <li key={x.programId} className="text-sm">
              <span className="font-semibold text-ink">{x.title}</span>
              <span className="ml-2 text-neg">{x.failedReasons.join(' · ')}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
