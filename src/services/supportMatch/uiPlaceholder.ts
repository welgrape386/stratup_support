/* =========================================================================
   UI 확인용 placeholder 응답 (Phase 3 의 API 가 생기면 삭제 대상).
   판정·점수·한 걸음만 더는 Phase 1 의 실제 규칙 코드(eligibility·score·whatIf)를 그대로 쓴다.
   프로필은 LLM 없이 규칙 파서(parse.ts)로만 만들고, 의미 검색이 없으므로 유사도는 0 으로 둔다.
   meta.dataSource='mock' 이므로 화면에 "샘플 데이터" 라벨이 뜬다.
   ========================================================================= */

import { ruleProfile } from '@/lib/parse'
import { kstDate, partition } from './eligibility'
import { mockPrograms } from './mock'
import { daysLeft, scoreMatch, sortResults } from './score'
import type {
  MatchResult,
  SupportMatchRequest,
  SupportMatchResponse,
  SupportProgram,
  UserProfile,
} from './types'
import { buildSummary, coverageOf } from './summary'
import { ruleHeadline } from './validate'
import { nextSteps } from './whatIf'

/** "한 걸음만 더" 화면 확인용 표본. data/raw/manual/incheon-samples.json 의 소상공인보증지원을
    data/eval/rule-gold.json 정답 규칙대로 옮긴 것 (mock 3건만으로는 조건부가 생기지 않음) */
const bojeungSample = (fetchedAt: string): SupportProgram => ({
  id: 'mock:incheon-sosang-bojeung',
  source: 'mock',
  portal: '인천시 혜택·지원',
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
  // 포털 원문 항목 (incheon-samples.json 그대로). 요약의 주의 문장 quote 를 이 원문과 대조한다
  fields: {
    사업소개: '담보력이 부족한 인천 소재 소상공인의 채무를 보증함으로써 자금융통을 원활히 하여 소상공인 경영안정 도모',
    신청기간: '2026.1.1.~ 2026.12.31. (연중)',
    지원대상: '인천시에 사업장을 둔 소상공인(특례보증 별 상이)',
    지원규모: '3,250억원',
    지원내용: '소상공인 특례보증 및 이차보전 지원(연1.5~2%, 3년간)',
    지원조건: '인천시에 사업자 등록을 한 소상공인',
    지원제외기준: '타시도 소상공인',
  },
  fetchedAt,
  reviewed: true,
})


export function buildUiPlaceholder(
  text: string,
  overrides: SupportMatchRequest['overrides'],
): SupportMatchResponse {
  const today = kstDate(new Date())
  const profile = ruleProfile(text, overrides)
  const programs = [...mockPrograms(today), bojeungSample(today)]
  const { eligible, conditional, excluded, rejected } = partition(programs, profile, today)

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

  const results = sortResults(eligible.map(toResult))
  const conditionalResults = sortResults(conditional.map(toResult))
  return {
    profile,
    missing,
    results,
    conditional: conditionalResults,
    excluded,
    nextSteps: nextSteps(programs, profile, today),
    summary: buildSummary({ results, conditional: conditionalResults, rejected }),
    coverage: coverageOf(programs),
    meta: {
      dataSource: 'mock',
      parser: 'rule',
      indexBuiltAt: today,
      totalPrograms: programs.length,
      droppedClaims: 0,
    },
  }
}
