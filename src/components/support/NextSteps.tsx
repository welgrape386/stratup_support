import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { SectionTitle } from '@/components/SectionTitle'
import type { MatchResult, MatchSummary, NextStep, UserProfile } from '@/services/supportMatch/types'
import { MatchCard } from './MatchCard'

/** C. 한 걸음만 더 (명세 6-C). 조건부 공고는 추천 목록(results)과 분리해 여기서만 보여준다.
    숫자는 전부 whatIf 계산 결과이고, 정보 제공용이라 권유 표현을 쓰지 않는다 */
export function NextSteps({
  steps,
  conditional,
  profile,
  counts,
}: {
  steps: NextStep[]
  conditional: MatchResult[]
  profile: UserProfile
  /** 사유별 공고 수. 공고마다 사유가 하나라 합이 조건부 공고 수와 같다 */
  counts: MatchSummary['conditional']
}) {
  if (steps.length === 0 && conditional.length === 0) return null
  const title = (id: string) => conditional.find((r) => r.program.id === id)?.program.title ?? id

  return (
    <section aria-label="한 걸음만 더" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <SectionTitle icon="flag">한 걸음만 더</SectionTitle>
        <p className="text-sm text-muted">
          조건 하나만 맞지 않는 공고예요. 추천 목록에는 넣지 않았어요. 아래 조건이 달라지면 지원 대상이 될 수
          있지만, 다른 조건은 공고에서 확인이 필요해요.
        </p>
        {conditional.length > 0 && (
          <p className="text-sm text-ink-soft">
            {[
              counts.bizStage && `개업 후 신청 가능 ${counts.bizStage}건`,
              counts.sigungu && `사업장 소재지 조건 ${counts.sigungu}건`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {steps.length > 0 && (
          <ul className="flex flex-col gap-3">
            {steps.map((s) => (
              <li key={s.field + s.value} className="flex flex-col gap-1.5 rounded-panel bg-bg-soft px-4 py-3">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  {s.label}
                  <Badge tone="warn">+{s.programIds.length}개</Badge>
                </span>
                <span className="text-xs text-muted">
                  {s.programIds
                    .map((id) => {
                      const n = s.unknownAfter[id]
                      return n ? `${title(id)} (확인 필요 조건 ${n}개 남음)` : title(id)
                    })
                    .join(', ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {conditional.map((r) => (
        <MatchCard key={r.program.id} result={r} profile={profile} />
      ))}
    </section>
  )
}
