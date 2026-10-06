/* 지원사업 매칭 공용 타입 (명세 3-2, 3-4, 5장). 클라이언트·서버 공용 */

export type SupportType = '융자' | '보조금' | '보증' | '교육' | '멘토링' | '공간' | '사업화' | '기타'
export type BizStage = '예비창업' | '업력3년이하' | '업력7년이하' | '기창업'
export type TargetGroup = '청년' | '여성' | '장애인' | '중장년' | '소상공인' | '재창업' | '전체'

/** 근거가 나온 포털 항목 (명세 3-2a) */
export type RuleSection = '지원대상' | '지원조건' | '지원제외기준' | '기타'

/** 자격 조건 하나. 공고 원문 근거(quote)와 출처 항목(section)을 반드시 같이 저장한다 */
export type EligibilityRule = { quote: string; section: RuleSection } & (
  | { kind: 'age'; min?: number; max?: number }
  | { kind: 'region'; sido: string[]; sigungu?: string[] } // 빈 배열 = 전국
  | { kind: 'bizStage'; allowed: BizStage[] }
  | { kind: 'industry'; include?: string[]; exclude?: string[] }
  | { kind: 'targetGroup'; anyOf: TargetGroup[] }
  | { kind: 'other'; text: string } // 구조화 불가 → 항상 unknown
)

export type SupportProgram = {
  id: string
  source: 'manual' | 'kstartup' | 'bizinfo' | 'mock'
  sourceId: string
  title: string
  agency: string
  operator?: string
  supportTypes: SupportType[]
  /** 1인(1건)당 한도만. 포털 '지원규모'(사업 전체 예산)는 넣지 않는다 */
  amountMaxManwon?: number
  /** 사업 전체 예산 원문 (표시 전용, 점수·검증 근거로 쓰지 않음) */
  totalBudgetText?: string
  interestRate?: string
  /** 이차보전 등 금리가 아닌 지원 조건 원문 */
  supportDetail?: string
  applyStart?: string
  applyEnd?: string
  /** 연중·수시 모집 → daysLeft=null, "상시 모집" */
  rolling: boolean
  status: '모집중' | '모집예정' | '마감'
  eligibility: EligibilityRule[]
  summary: string
  url: string
  contact?: string
  /** 포털 원문 항목 그대로 (quote 검증 대상) */
  fields: Record<string, string>
  fetchedAt: string
  reviewed: boolean
}

export type ProgramChunk = {
  id: string
  programId: string
  section: '지원대상' | '지원내용' | '신청방법' | '기타'
  text: string
  embedding: number[]
}

export type Extracted<T> = { value: T | null; evidence?: string }

export type UserProfile = {
  age: Extracted<number>
  sido: Extracted<string>
  sigungu: Extracted<string>
  bizStage: Extracted<BizStage>
  industryCategory: Extracted<string>
  industryText: Extracted<string>
  targetGroups: TargetGroup[]
  needs: SupportType[]
  fundingGapManwon: Extracted<number>
  budgetManwon: Extracted<number>
  experienceYears: Extracted<number>
  freeText: string
}

export type SupportMatchRequest = {
  text: string
  overrides?: Partial<Record<keyof UserProfile, unknown>>
}

export type MatchVerdict = '자격 충족' | '확인 필요' | '조건부' | '자격 미달'
export type RuleResult = {
  rule: EligibilityRule
  result: 'pass' | 'fail' | 'unknown'
  reason: string
}

export type MatchResult = {
  program: Omit<SupportProgram, 'eligibility'>
  verdict: MatchVerdict
  score: number
  rules: RuleResult[]
  headline: string
  reasons: { text: string; quote: string; chunkId: string }[]
  cautions: { text: string; quote: string; chunkId: string }[]
  daysLeft: number | null
}

export type SupportMatchResponse = {
  profile: UserProfile
  missing: (keyof UserProfile)[]
  /** 추천 목록. 자격 충족·확인 필요만 (평가 하네스의 "추천"도 이것만, 명세 7장) */
  results: MatchResult[]
  /** 조건부 공고. "한 걸음만 더" 영역에만 표시하고 추천으로 세지 않는다 */
  conditional: MatchResult[]
  excluded: { programId: string; title: string; failedReasons: string[] }[]
  nextSteps: NextStep[]
  meta: {
    dataSource: 'live' | 'mock'
    parser: 'llm' | 'rule'
    indexBuiltAt: string
    totalPrograms: number
    droppedClaims: number
  }
}

/** 한 걸음만 더 (명세 6-C). 사업자 등록 또는 같은 시도 안 시군구만 patch 로 바꿔 재판정한 결과 */
export type NextStep = {
  field: 'bizStage' | 'sigungu'
  value: string
  label: string
  patch: Partial<Record<'bizStage' | 'sigungu', string>>
  programIds: string[]
  /** 공고별, 바꾼 뒤에도 남는 unknown 규칙 수 */
  unknownAfter: Record<string, number>
}

export type SupportMatchError = {
  error: {
    code: 'INVALID_INPUT' | 'LLM_UNAVAILABLE' | 'INDEX_MISSING' | 'INTERNAL'
    message: string
  }
}
