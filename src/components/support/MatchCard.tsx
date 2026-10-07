import { type ReactNode, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { DataBadge } from '@/components/DataBadge'
import { Icon } from '@/components/Icon'
import { cx } from '@/lib/cx'
import { conditionalField, isBlocking } from '@/services/supportMatch/eligibility'
import type { MatchResult, MatchVerdict, UserProfile } from '@/services/supportMatch/types'
import { Quote, RuleChecklist } from './RuleChecklist'

const won = (m: number) =>
  m >= 10000 ? `${(m / 10000).toFixed(1).replace(/\.0$/, '')}억원` : `${m.toLocaleString()}만원`

function DayBadge({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft == null) return <Badge tone="info">상시 모집</Badge>
  if (daysLeft <= 3) return <Badge tone="neg">D-{daysLeft}</Badge>
  if (daysLeft <= 7) return <Badge tone="warn">D-{daysLeft}</Badge>
  return <Badge tone="neutral">D-{daysLeft}</Badge>
}

// A. 신호등 4종 (명세 6-A). 색 점 + 글자 라벨, 이모지 대신 Badge
const VERDICT: Record<MatchVerdict, { tone: 'pos' | 'neutral' | 'warn' | 'neg'; label: string }> = {
  '자격 충족': { tone: 'pos', label: '자격 충족' },
  '확인 필요': { tone: 'neutral', label: '확인 필요' },
  조건부: { tone: 'warn', label: '한 걸음 더' },
  '자격 미달': { tone: 'neg', label: '해당 안 됨' },
}

// 조건부(노랑)는 풀 수 있는 조건 종류로 사유를 나눈다 (안내 톤, 권유 표현 없음)
const CONDITIONAL_LABEL = { bizStage: '개업 후 신청 가능', sigungu: '사업장 소재지 조건' } as const

export function VerdictBadge({ verdict, label }: { verdict: MatchVerdict; label?: string }) {
  const v = VERDICT[verdict]
  return (
    <Badge tone={v.tone}>
      <span aria-hidden="true" className="mr-1.5 size-1.5 rounded-full bg-current" />
      {label ?? v.label}
    </Badge>
  )
}

function Section({
  label,
  icon,
  cls,
  children,
}: {
  label: string
  icon: 'check' | 'info' | 'flag'
  cls: string
  children: ReactNode
}) {
  return (
    <section aria-label={label}>
      <p className={cx('flex items-center gap-1.5 text-xs font-bold', cls)}>
        <Icon name={icon} size={13} />
        {label}
      </p>
      <ul className="mt-2 flex flex-col gap-2.5">{children}</ul>
    </section>
  )
}

export function MatchCard({ result: r, profile }: { result: MatchResult; profile: UserProfile }) {
  const [open, setOpen] = useState(false)
  const p = r.program
  const failed = r.rules.filter(isBlocking)
  const cField = r.verdict === '조건부' ? conditionalField(r.rules, profile) : null
  const dup = p.duplicatePolicy
  const unknown = r.rules.filter((x) => x.result === 'unknown')
  const meta = [
    p.agency,
    p.amountMaxManwon != null ? `1인 최대 ${won(p.amountMaxManwon)}` : null,
    p.interestRate ?? null,
    p.supportDetail ?? null,
    p.totalBudgetText ? `사업 전체 예산 ${p.totalBudgetText}` : null,
  ].filter(Boolean)

  return (
    <Card
      className={cx(
        'flex flex-col gap-3.5',
        r.verdict === '자격 충족' && 'border-primary-100 bg-primary-50/40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <VerdictBadge verdict={r.verdict} label={cField ? CONDITIONAL_LABEL[cField] : undefined} />
        <DayBadge daysLeft={r.daysLeft} />
        {p.supportTypes.map((t) => (
          <Badge key={t} tone={t === '융자' ? 'violet' : 'info'}>
            {t}
          </Badge>
        ))}
        <Badge tone={dup.status === '불가' ? 'warn' : 'neutral'}>중복 지원 {dup.status}</Badge>
        {p.source === 'mock' && <Badge tone="neutral">샘플</Badge>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[17px] font-bold text-ink">{p.title}</h3>
          <p className="mt-1 text-[13px] text-muted">{meta.join(' · ')}</p>
        </div>
        {/* 조건부는 추천이 아니므로 매칭 점수를 보여주지 않는다 */}
        {r.verdict !== '조건부' && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-bold text-primary-600 tnum">매칭 {r.score}점</span>
            <DataBadge kind="self" />
          </div>
        )}
      </div>

      <p className="text-[15px] font-bold text-ink">{r.headline}</p>

      {failed.length > 0 && (
        <Section label="맞지 않는 조건" icon="flag" cls="text-warn">
          {failed.map((x) => (
            <li key={x.rule.kind + x.reason} className="text-sm leading-relaxed text-ink-soft">
              {x.reason}
              <Quote section={x.rule.section}>{x.rule.quote}</Quote>
            </li>
          ))}
        </Section>
      )}

      {r.reasons.length > 0 && (
        <Section label="왜 맞나요" icon="check" cls="text-pos">
          {r.reasons.map((x) => (
            <li key={x.chunkId + x.text} className="text-sm leading-relaxed text-ink-soft">
              {x.text}
              <Quote>{x.quote}</Quote>
            </li>
          ))}
        </Section>
      )}

      {unknown.length > 0 && (
        <Section label="확인이 필요해요" icon="info" cls="text-muted">
          {unknown.map((x) => (
            <li key={x.rule.kind + x.reason} className="text-sm text-ink-soft">
              {x.reason}
              <Quote section={x.rule.section}>{x.rule.quote}</Quote>
            </li>
          ))}
          {p.contact && <li className="text-xs text-muted">문의: {p.contact}</li>}
        </Section>
      )}

      {r.cautions.length > 0 && (
        <Section label="유의사항" icon="flag" cls="text-muted">
          {r.cautions.map((x) => (
            <li key={x.chunkId + x.text} className="text-sm leading-relaxed text-ink-soft">
              {x.text}
              <Quote>{x.quote}</Quote>
            </li>
          ))}
        </Section>
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
          조건 체크리스트
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} />
        </button>
      </div>

      {open && (
        <RuleChecklist rules={r.rules} profile={profile} duplicatePolicy={dup} exceptions={r.exceptions} />
      )}
    </Card>
  )
}
