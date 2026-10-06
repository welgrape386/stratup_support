/* =========================================================================
   UI 확인용 placeholder 응답 (Phase 3 의 API 가 생기면 삭제 대상).
   판정·점수·한 걸음만 더는 Phase 1 의 실제 규칙 코드(eligibility·score·whatIf)를 그대로 쓴다.
   프로필은 LLM 없이 규칙 파서(parse.ts)로만 만들고, 의미 검색이 없으므로 유사도는 0 으로 둔다.
   meta.dataSource='mock' 이므로 화면에 "샘플 데이터" 라벨이 뜬다.
   ========================================================================= */

import { extractAge, extractCategory, extractManwon, extractRegion } from '@/lib/parse'
import { kstDate, partition } from './eligibility'
import { mockPrograms } from './mock'
import { daysLeft, scoreMatch, sortResults } from './score'
import type {
  BizStage,
  MatchResult,
  SupportMatchRequest,
  SupportMatchResponse,
  SupportProgram,
  SupportType,
  TargetGroup,
  UserProfile,
} from './types'
import { ruleHeadline } from './validate'
import { nextSteps } from './whatIf'

/** "한 걸음만 더" 화면 확인용 표본. data/raw/manual/incheon-samples.json 의 소상공인보증지원을
    data/eval/rule-gold.json 정답 규칙대로 옮긴 것 (mock 3건만으로는 조건부가 생기지 않음) */
const bojeungSample = (fetchedAt: string): SupportProgram => ({
  id: 'mock:incheon-sosang-bojeung',
  source: 'mock',
  sourceId: 'incheon-sosang-bojeung',
  title: '소상공인보증지원',
  agency: '인천광역시',
  operator: '인천신용보증재단',
  supportTypes: ['보증'],
  totalBudgetText: '3,250억원',
  supportDetail: '이차보전 지원(연1.5~2%, 3년간)',
  applyStart: '2026-01-01',
  applyEnd: '2026-12-31',
  rolling: true,
  status: '모집중',
  eligibility: [
    { kind: 'region', sido: ['인천광역시'], quote: '타시도 소상공인', section: '지원제외기준' },
    {
      kind: 'bizStage',
      allowed: ['업력3년이하', '업력7년이하', '기창업'],
      quote: '인천시에 사업자 등록을 한 소상공인',
      section: '지원조건',
    },
    { kind: 'targetGroup', anyOf: ['소상공인'], quote: '인천시에 사업장을 둔 소상공인', section: '지원대상' },
  ],
  summary: '담보력이 부족한 인천 소재 소상공인의 채무를 보증',
  url: 'https://www.incheon.go.kr/eco/ECO030201',
  contact: '소상공인정책과 / 인천신용보증재단 보증사업부/ 032-260-1543',
  fields: {},
  fetchedAt,
  reviewed: true,
})

function ruleProfile(text: string, overrides: SupportMatchRequest['overrides']): UserProfile {
  const o = overrides ?? {}
  const region = extractRegion(text)
  const age = (o.age as number | undefined) ?? extractAge(text)
  const sido = (o.sido as string | undefined) ?? region.sido
  const targetGroups: TargetGroup[] = []
  if (age != null && age <= 39) targetGroups.push('청년')
  if (/소상공인|자영업/.test(text)) targetGroups.push('소상공인')
  const needs: SupportType[] = []
  if (/모자라|부족|자금|대출|지원금/.test(text)) needs.push('융자', '보조금')
  if (/교육/.test(text)) needs.push('교육')
  if (/멘토링/.test(text)) needs.push('멘토링')
  return {
    age: { value: age },
    sido: { value: sido },
    // 시도를 칩으로 고치면 문장 속 시군구는 더 이상 맞지 않을 수 있으므로 비운다
    sigungu: { value: o.sido ? null : region.sigungu },
    bizStage: { value: (o.bizStage as BizStage | undefined) ?? (/예비/.test(text) ? '예비창업' : null) },
    industryCategory: { value: (o.industryCategory as string | undefined) ?? extractCategory(text) },
    industryText: { value: null },
    targetGroups,
    needs,
    fundingGapManwon: { value: extractManwon(text) },
    budgetManwon: { value: null },
    experienceYears: { value: null },
    freeText: text,
  }
}

export function buildUiPlaceholder(
  text: string,
  overrides: SupportMatchRequest['overrides'],
): SupportMatchResponse {
  const today = kstDate(new Date())
  const profile = ruleProfile(text, overrides)
  const programs = [...mockPrograms(today), bojeungSample(today)]
  const { eligible, conditional, excluded } = partition(programs, profile, today)

  const toResult = ({ program, verdict, rules }: (typeof eligible)[number]): MatchResult => {
    const { eligibility: _, ...rest } = program
    return {
      program: rest,
      verdict,
      // 의미 검색이 없으므로(Phase 3) 유사도 0. 규칙 충족률·니즈 일치만 반영된다
      score: scoreMatch({ similarity: 0, rules, needs: profile.needs, supportTypes: program.supportTypes }),
      rules,
      headline: ruleHeadline(verdict),
      reasons: rules
        .filter((x) => x.result === 'pass')
        .map((x) => ({ text: x.reason, quote: x.rule.quote, chunkId: '' })),
      cautions: [],
      daysLeft: daysLeft(program, today),
    }
  }

  const missing: (keyof UserProfile)[] = []
  if (profile.age.value == null) missing.push('age')
  if (!profile.sido.value) missing.push('sido')
  if (!profile.bizStage.value) missing.push('bizStage')
  if (!profile.industryCategory.value) missing.push('industryCategory')

  return {
    profile,
    missing,
    results: sortResults(eligible.map(toResult)),
    conditional: sortResults(conditional.map(toResult)),
    excluded,
    nextSteps: nextSteps(programs, profile, today),
    meta: {
      dataSource: 'mock',
      parser: 'rule',
      indexBuiltAt: today,
      totalPrograms: programs.length,
      droppedClaims: 0,
    },
  }
}
