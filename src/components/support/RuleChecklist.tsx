import { cx } from '@/lib/cx'
import { ageRange, shortSido } from '@/services/supportMatch/eligibility'
import type {
  DuplicatePolicy,
  EligibilityRule,
  ExceptionClause,
  RuleResult,
  UserProfile,
} from '@/services/supportMatch/types'

/** 공고 원문 인용 + 출처 항목 */
export function Quote({ children, section }: { children: string; section?: string }) {
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

const ROW = 'flex flex-col gap-1 px-3.5 py-2.5 text-sm'

/** 판정 기호 + 항목 + 조건 / 판정 글자 */
function Head({ mark, label, children }: { mark: (typeof MARK)[keyof typeof MARK]; label: string; children?: string }) {
  return (
    <span className="flex items-start justify-between gap-3">
      <span className="text-ink-soft">
        <span aria-hidden="true" className={cx('mr-1.5 font-bold', mark.cls)}>
          {mark.sym}
        </span>
        <span className="font-semibold text-ink">{label}</span> {children}
      </span>
      <span className={cx('shrink-0 text-xs font-bold', mark.cls)}>{mark.text}</span>
    </span>
  )
}

/** B. 조건 체크리스트: 규칙마다 판정 + 공고 조건 + 내 값 + 근거 (명세 6-B).
    아래에 판정에 넣지 않는 원문 조항(예외 조항·중복 지원)을 따로 붙인다 */
export function RuleChecklist({
  rules,
  profile,
  duplicatePolicy,
  exceptions,
}: {
  rules: RuleResult[]
  profile: UserProfile
  duplicatePolicy: DuplicatePolicy
  exceptions: ExceptionClause[]
}) {
  return (
    <ul className="flex flex-col divide-y divide-line rounded-panel border border-line bg-surface">
      {rules.map((x, i) => {
        const m = MARK[x.result]
        const my = mine(x.rule, profile)
        const groupStart = x.group && rules[i - 1]?.group?.id !== x.group.id
        return (
          <li key={x.rule.kind + x.rule.quote} className={cx(ROW, x.group && 'pl-6')}>
            {groupStart && (
              <span className="-ml-2.5 text-xs font-bold text-muted">
                아래 조건 중 하나만 맞으면 돼요 · 그룹 판정 {MARK[x.group!.result].text}
              </span>
            )}
            <Head mark={m} label={LABEL[x.rule.kind]}>
              {condition(x.rule)}
            </Head>
            <span className="text-xs text-muted">
              {x.rule.kind === 'other'
                ? '공고에서 직접 확인이 필요한 조건이에요'
                : `내 ${LABEL[x.rule.kind]}: ${my ?? '입력하지 않음'}`}
            </span>
            <Quote section={x.rule.section}>{x.rule.quote}</Quote>
          </li>
        )
      })}
      {/* 예외 조항: 규칙으로 바꾸지 않고 원문 그대로. 판정에 반영하지 않는다 */}
      {exceptions.map((c) => (
        <li key={c.section + c.quote} className={ROW}>
          <Head mark={MARK.unknown} label="예외 조항" />
          <span className="text-xs text-muted">본인이 해당하는지 공고 원문에서 확인이 필요해요</span>
          <Quote section={c.section}>{c.quote}</Quote>
        </li>
      ))}
      <li className={ROW}>
        <span className="flex items-start justify-between gap-3 text-ink-soft">
          <span className="font-semibold text-ink">중복 지원</span>
          <span className="shrink-0 text-xs font-bold text-muted">{duplicatePolicy.status}</span>
        </span>
        {duplicatePolicy.status === '미확인' ? (
          <span className="text-xs text-muted">공고 원문에 중복 수혜 관련 문구가 없어요. 운영기관에 확인이 필요해요</span>
        ) : (
          <Quote section={duplicatePolicy.section}>{duplicatePolicy.quote}</Quote>
        )}
      </li>
    </ul>
  )
}
