import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { DataBadge } from '@/components/DataBadge'
import { Icon } from '@/components/Icon'
import { cx } from '@/lib/cx'
import type { MatchResult } from '@/services/supportMatch/types'

const won = (m: number) =>
  m >= 10000 ? `${(m / 10000).toFixed(1).replace(/\.0$/, '')}억원` : `${m.toLocaleString()}만원`

function DayBadge({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft == null) return <Badge tone="info">상시 모집</Badge>
  if (daysLeft <= 3) return <Badge tone="neg">D-{daysLeft}</Badge>
  if (daysLeft <= 7) return <Badge tone="warn">D-{daysLeft}</Badge>
  return <Badge tone="neutral">D-{daysLeft}</Badge>
}

const RESULT_LABEL = { pass: '충족', fail: '미충족', unknown: '확인 필요' } as const
const RESULT_CLS = { pass: 'text-pos', fail: 'text-neg', unknown: 'text-warn' } as const

function Quote({ children }: { children: string }) {
  return <p className="mt-1 border-l-2 border-line pl-3 text-xs text-faint">&ldquo;{children}&rdquo;</p>
}

export function MatchCard({ result: r }: { result: MatchResult }) {
  const [open, setOpen] = useState(false)
  const p = r.program
  const unknown = r.rules.filter((x) => x.result === 'unknown')
  const meta = [
    p.agency,
    p.amountMaxManwon != null ? `최대 ${won(p.amountMaxManwon)}` : null,
    p.interestRate ?? null,
  ].filter(Boolean)

  return (
    <Card
      className={cx(
        'flex flex-col gap-3.5',
        r.verdict === '자격 충족' && 'border-primary-100 bg-primary-50/40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={r.verdict === '자격 충족' ? 'pos' : 'warn'}>{r.verdict}</Badge>
        <DayBadge daysLeft={r.daysLeft} />
        {p.supportTypes.map((t) => (
          <Badge key={t} tone={t === '융자' ? 'violet' : 'info'}>
            {t}
          </Badge>
        ))}
        {p.source === 'mock' && <Badge tone="neutral">샘플</Badge>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[17px] font-bold text-ink">{p.title}</h3>
          <p className="mt-1 text-[13px] text-muted">{meta.join(' · ')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-primary-600 tnum">매칭 {r.score}점</span>
          <DataBadge kind="self" />
        </div>
      </div>

      <p className="text-[15px] font-bold text-ink">{r.headline}</p>

      {r.reasons.length > 0 && (
        <section aria-label="왜 맞나요">
          <p className="flex items-center gap-1.5 text-xs font-bold text-pos">
            <Icon name="check" size={13} />왜 맞나요
          </p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {r.reasons.map((x) => (
              <li key={x.chunkId + x.text} className="text-sm leading-relaxed text-ink-soft">
                {x.text}
                <Quote>{x.quote}</Quote>
              </li>
            ))}
          </ul>
        </section>
      )}

      {unknown.length > 0 && (
        <section aria-label="확인이 필요해요">
          <p className="flex items-center gap-1.5 text-xs font-bold text-warn">
            <Icon name="info" size={13} />확인이 필요해요
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {unknown.map((x) => (
              <li key={x.rule.kind + x.reason} className="text-sm text-ink-soft">
                {x.reason}
                <Quote>{x.rule.quote}</Quote>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.cautions.length > 0 && (
        <section aria-label="유의사항">
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
            <Icon name="flag" size={13} />유의사항
          </p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {r.cautions.map((x) => (
              <li key={x.chunkId + x.text} className="text-sm leading-relaxed text-ink-soft">
                {x.text}
                <Quote>{x.quote}</Quote>
              </li>
            ))}
          </ul>
        </section>
      )}


      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary-600"
        >
          공고 원문 보기
          <Icon name="arrow-right" size={14} />
        </a>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-muted"
        >
          조건별 판정 자세히
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} />
        </button>
      </div>

      {open && (
        <ul className="flex flex-col divide-y divide-line rounded-panel border border-line bg-surface">
          {r.rules.map((x) => (
            <li key={x.rule.kind + x.reason} className="flex flex-col gap-0.5 px-3.5 py-2.5 text-sm">
              <span className="flex items-center justify-between gap-3">
                <span className="text-ink-soft">{x.reason}</span>
                <span className={cx('shrink-0 text-xs font-bold', RESULT_CLS[x.result])}>
                  {RESULT_LABEL[x.result]}
                </span>
              </span>
              <Quote>{x.rule.quote}</Quote>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
