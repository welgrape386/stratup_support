/* =========================================================================
   UI 확인용 placeholder 응답 (Phase 3 의 API 가 생기면 삭제 대상).
   나이·창업 단계 두 규칙만 간단히 판정한다. 실제 판정 로직은 Phase 1 의
   eligibility.ts 가 담당하며, 이 파일은 화면 상태(충족/확인 필요/제외)를
   보여주기 위한 샘플이다. meta.dataSource='mock' 이므로 화면에 샘플 라벨이 뜬다.
   ========================================================================= */

import { extractCategory, extractManwon, extractRegion } from '@/lib/parse'
import type {
  BizStage,
  MatchResult,
  RuleResult,
  SupportMatchRequest,
  SupportMatchResponse,
  SupportProgram,
  UserProfile,
} from './types'

const TODAY = new Date()
const iso = (offsetDays: number) => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

type Sample = Pick<
  SupportProgram,
  'id' | 'title' | 'agency' | 'supportTypes' | 'amountMaxManwon' | 'interestRate' | 'summary' | 'url'
> & {
  ageMin: number
  ageMax: number
  ageQuote: string
  stages: BizStage[]
  stageQuote: string
  daysLeft: number | null
}

const SAMPLES: Sample[] = [
  {
    id: 'mock:youth-startup-fund',
    title: '청년전용창업자금',
    agency: '중소벤처기업진흥공단',
    supportTypes: ['융자'],
    amountMaxManwon: 10000,
    interestRate: '연 2.0% 고정(융자)',
    summary: '만 19~34세 예비창업자 및 창업 3년 이내 기업',
    url: 'https://www.k-startup.go.kr',
    ageMin: 19,
    ageMax: 34,
    ageQuote: '만 19~34세 예비창업자 및 창업 3년 이내 기업',
    stages: ['예비창업', '업력3년이하'],
    stageQuote: '만 19~34세 예비창업자 및 창업 3년 이내 기업',
    daysLeft: 12,
  },
  {
    id: 'mock:pre-startup-package',
    title: '예비창업패키지',
    agency: '창업진흥원',
    supportTypes: ['보조금', '사업화'],
    amountMaxManwon: 5000,
    summary: '만 19~39세, 업력 없는 예비창업자',
    url: 'https://www.k-startup.go.kr',
    ageMin: 19,
    ageMax: 39,
    ageQuote: '만 19~39세, 업력 없는 예비창업자',
    stages: ['예비창업'],
    stageQuote: '만 19~39세, 업력 없는 예비창업자',
    daysLeft: 5,
  },
  {
    id: 'mock:youth-startup-academy',
    title: '청년창업사관학교',
    agency: '중소벤처기업진흥공단',
    supportTypes: ['사업화', '멘토링', '교육'],
    amountMaxManwon: 10000,
    summary: '만 19~39세 청년 (예비)창업자',
    url: 'https://www.k-startup.go.kr',
    ageMin: 19,
    ageMax: 39,
    ageQuote: '만 19~39세 청년 (예비)창업자',
    stages: ['예비창업', '업력3년이하'],
    stageQuote: '만 19~39세 청년 (예비)창업자',
    daysLeft: null,
  },
]

function judge(s: Sample, age: number | null, stage: BizStage | null): RuleResult[] {
  const ageRule = { kind: 'age' as const, min: s.ageMin, max: s.ageMax, quote: s.ageQuote, section: '지원대상' as const }
  const stageRule = { kind: 'bizStage' as const, allowed: s.stages, quote: s.stageQuote, section: '지원대상' as const }
  return [
    age == null
      ? { rule: ageRule, result: 'unknown', reason: '나이를 입력하지 않았어요' }
      : age >= s.ageMin && age <= s.ageMax
        ? { rule: ageRule, result: 'pass', reason: `만 ${s.ageMin}~${s.ageMax}세 대상인데 ${age}세라 해당돼요` }
        : {
            rule: ageRule,
            result: 'fail',
            reason: age > s.ageMax ? `만 ${s.ageMax}세 초과` : `만 ${s.ageMin}세 미만`,
          },
    stage == null
      ? { rule: stageRule, result: 'unknown', reason: '창업 단계를 입력하지 않았어요' }
      : s.stages.includes(stage)
        ? { rule: stageRule, result: 'pass', reason: `${stage} 단계가 지원 대상에 포함돼요` }
        : { rule: stageRule, result: 'fail', reason: `${stage} 단계는 지원 대상이 아니에요` },
  ]
}

export function buildUiPlaceholder(
  text: string,
  overrides: SupportMatchRequest['overrides'],
  parsedAge: number | null,
): SupportMatchResponse {
  const region = extractRegion(text)
  const age = (overrides?.age as number | undefined) ?? parsedAge
  const stage =
    (overrides?.bizStage as BizStage | undefined) ?? (/예비/.test(text) ? ('예비창업' as const) : null)
  const sido = (overrides?.sido as string | undefined) ?? region.sido
  const category =
    (overrides?.industryCategory as string | undefined) ?? extractCategory(text)

  const profile: UserProfile = {
    age: { value: age ?? null },
    sido: { value: sido },
    sigungu: { value: region.sigungu },
    bizStage: { value: stage },
    industryCategory: { value: category },
    industryText: { value: null },
    targetGroups: age != null && age <= 39 ? ['청년'] : [],
    needs: /모자라|부족|자금|대출|지원금/.test(text) ? ['융자', '보조금'] : [],
    fundingGapManwon: { value: extractManwon(text) },
    budgetManwon: { value: null },
    experienceYears: { value: null },
    freeText: text,
  }

  const results: MatchResult[] = []
  const excluded: SupportMatchResponse['excluded'] = []

  SAMPLES.forEach((s, i) => {
    const rules = judge(s, age, stage)
    const failed = rules.filter((r) => r.result === 'fail')
    if (failed.length) {
      excluded.push({ programId: s.id, title: s.title, failedReasons: failed.map((f) => f.reason) })
      return
    }
    const unknown = rules.filter((r) => r.result === 'unknown')
    const passes = rules.filter((r) => r.result === 'pass')
    const { daysLeft } = s
    results.push({
      program: {
        id: s.id,
        title: s.title,
        agency: s.agency,
        supportTypes: s.supportTypes,
        amountMaxManwon: s.amountMaxManwon,
        interestRate: s.interestRate,
        summary: s.summary,
        url: s.url,
        source: 'mock',
        sourceId: s.id,
        applyEnd: daysLeft == null ? undefined : iso(daysLeft),
        status: '모집중',
        rolling: daysLeft == null,
        fields: {},
        fetchedAt: TODAY.toISOString(),
        reviewed: false,
      },
      verdict: unknown.length ? '확인 필요' : '자격 충족',
      score: 82 - i * 7 - unknown.length * 5,
      rules,
      headline: unknown.length
        ? '입력하신 조건으로는 지금까지 어긋나는 부분이 없어요'
        : '입력하신 조건이 모두 지원 대상에 해당해요',
      reasons: passes.map((p) => ({
        text: p.reason,
        quote: p.rule.quote,
        chunkId: `${s.id}#0`,
      })),
      cautions: [],
      daysLeft,
    })
  })

  results.sort((a, b) => (a.verdict === b.verdict ? b.score - a.score : a.verdict === '자격 충족' ? -1 : 1))

  const missing: (keyof UserProfile)[] = []
  if (age == null) missing.push('age')
  if (!sido) missing.push('sido')
  if (!stage) missing.push('bizStage')
  if (!category) missing.push('industryCategory')

  return {
    profile,
    missing,
    results,
    excluded,
    conditional: [],
    nextSteps: [],
    meta: {
      dataSource: 'mock',
      parser: 'rule',
      indexBuiltAt: TODAY.toISOString(),
      totalPrograms: SAMPLES.length,
      droppedClaims: 0,
    },
  }
}
