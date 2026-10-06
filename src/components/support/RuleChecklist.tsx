import { cx } from '@/lib/cx'
import { ageRange, shortSido } from '@/services/supportMatch/eligibility'
import type { EligibilityRule, RuleResult, RuleSection, UserProfile } from '@/services/supportMatch/types'

/** 공고 원문 인용 + 출처 항목 */
export function Quote({ children, section }: { children: string; section?: RuleSection }) {
  return (
    <p className="mt-1 border-l-2 border-line pl-3 text-xs text-faint">
      &ldquo;{children}&rdquo;
      {section && <span className="ml-1.5 whitespace-nowrap">· {section} 항목</span>}
    </p>
  )
}

const LABEL: Record<EligibilityRule['kind'], string> = {
  age: '나이',
  region: '지역',
  bizStage: '창업 단계',
  industry: '업종',
  targetGroup: '지원 대상',
  other: '기타 조건',
}

// 판정은 기호 + 글자 + 색을 함께 쓴다 (색만으로 구분하지 않음)
const MARK = {
  pass: { sym: '✔', text: '충족', cls: 'text-pos' },
  fail: { sym: '✘', text: '미충족', cls: 'text-neg' },
  unknown: { sym: '?', text: '확인 필요', cls: 'text-muted' },
} as const

/** 공고 조건을 사람이 읽는 문장으로 */
function condition(r: EligibilityRule): string {
  switch (r.kind) {
    case 'age':
      return `${ageRange(r.min, r.max)} (만 나이 기준)`
    case 'region':
      return r.sido.length ? [r.sido.map(shortSido).join('·'), r.sigungu?.join('·')].filter(Boolean).join(' ') : '전국'
    case 'bizStage':
      return r.allowed.includes('예비창업') ? r.allowed.join(', ') : `사업자 등록 필요 (${r.allowed.join(', ')})`
    case 'industry':
      return [r.include?.length && `대상 ${r.include.join(', ')}`, r.exclude?.length && `제외 ${r.exclude.join(', ')}`]
        .filter(Boolean)
        .join(' / ')
    case 'targetGroup':
      return r.anyOf.join(', ')
    case 'other':
      return r.text
  }
}

/** 이 규칙과 비교한 내 값. 없으면 null */
function mine(r: EligibilityRule, p: UserProfile): string | null {
  switch (r.kind) {
    case 'age':
      return p.age.value != null ? `${p.age.value}세` : null
    case 'region':
      return p.sido.value ? [shortSido(p.sido.value), p.sigungu.value].filter(Boolean).join(' ') : null
    case 'bizStage':
      return p.bizStage.value
    case 'industry':
      return p.industryCategory.value
    case 'targetGroup':
      return p.targetGroups.length ? p.targetGroups.join(', ') : null
    case 'other':
      return null
  }
}

/** B. 조건 체크리스트: 규칙마다 판정 + 공고 조건 + 내 값 + 근거 (명세 6-B) */
export function RuleChecklist({ rules, profile }: { rules: RuleResult[]; profile: UserProfile }) {
  return (
    <ul className="flex flex-col divide-y divide-line rounded-panel border border-line bg-surface">
      {rules.map((x) => {
        const m = MARK[x.result]
        const my = mine(x.rule, profile)
        return (
          <li key={x.rule.kind + x.rule.quote} className="flex flex-col gap-1 px-3.5 py-2.5 text-sm">
            <span className="flex items-start justify-between gap-3">
              <span className="text-ink-soft">
                <span aria-hidden="true" className={cx('mr-1.5 font-bold', m.cls)}>
                  {m.sym}
                </span>
                <span className="font-semibold text-ink">{LABEL[x.rule.kind]}</span> {condition(x.rule)}
              </span>
              <span className={cx('shrink-0 text-xs font-bold', m.cls)}>{m.text}</span>
            </span>
            <span className="text-xs text-muted">
              {x.rule.kind === 'other'
                ? '공고에서 직접 확인이 필요한 조건이에요'
                : `내 ${LABEL[x.rule.kind]}: ${my ?? '입력하지 않음'}`}
            </span>
            <Quote section={x.rule.section}>{x.rule.quote}</Quote>
          </li>
        )
      })}
    </ul>
  )
}
