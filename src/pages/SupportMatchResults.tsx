import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button, buttonClasses } from '@/components/Button'
import { Card } from '@/components/Card'
import { DataBadge } from '@/components/DataBadge'
import { Icon } from '@/components/Icon'
import { SectionTitle } from '@/components/SectionTitle'
import { ExcludedList } from '@/components/support/ExcludedList'
import { MatchCard } from '@/components/support/MatchCard'
import { NextSteps } from '@/components/support/NextSteps'
import { ProfileChips } from '@/components/support/ProfileChips'
import { cx } from '@/lib/cx'
import { Container } from '@/layout/Container'
import { PageHeader } from '@/layout/PageHeader'
import { fetchSupportMatch, SupportMatchApiError } from '@/services/supportMatch/client'
import type { SupportMatchRequest, SupportMatchResponse, UserProfile } from '@/services/supportMatch/types'
import { loadInput, saveInput } from '@/lib/supportMatchInput'

const LOADING_STEPS = ['조건 해석 중', '공고 검색 중', '자격 확인 중']

type Filter = 'all' | 'money' | 'edu' | 'space'
type Sort = 'recommend' | 'deadline'

const FILTERS: { key: Filter; label: string; types: string[] }[] = [
  { key: 'all', label: '전체', types: [] },
  { key: 'money', label: '자금', types: ['융자', '보조금', '사업화'] },
  { key: 'edu', label: '교육·멘토링', types: ['교육', '멘토링'] },
  { key: 'space', label: '공간', types: ['공간'] },
]

const tabCls = (active: boolean) =>
  cx(
    'min-h-10 rounded-chip px-3.5 text-[13px] font-semibold transition-colors',
    active ? 'bg-primary-500 text-white' : 'bg-bg-soft text-muted hover:bg-primary-50',
  )

function SkeletonCard() {
  return (
    <Card className="flex animate-pulse flex-col gap-3" aria-hidden="true">
      <div className="h-5 w-40 rounded-chip bg-bg-soft" />
      <div className="h-6 w-2/3 rounded-chip bg-bg-soft" />
      <div className="h-4 w-1/2 rounded-chip bg-bg-soft" />
      <div className="h-16 w-full rounded-panel bg-bg-soft" />
    </Card>
  )
}

/** /support-match/results — 입력 화면에서 저장한 문장으로 판정 결과를 보여준다 */
export function SupportMatchResults() {
  const location = useLocation()
  const [req, setReq] = useState<SupportMatchRequest | null>(
    () => loadInput() ?? (location.state as SupportMatchRequest | null),
  )
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [step, setStep] = useState(0)
  const [res, setRes] = useState<SupportMatchResponse | null>(null)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recommend')

  // 입력(문장·칩 수정)이 바뀔 때마다 다시 요청. 늦게 도착한 이전 응답은 버린다
  useEffect(() => {
    if (!req) return
    let alive = true
    setStatus('loading')
    setError(null)
    fetchSupportMatch(req).then(
      (data) => {
        if (!alive) return
        setRes(data)
        setStatus('success')
      },
      (e) => {
        if (!alive) return
        const err = e instanceof SupportMatchApiError ? e : null
        setError({ code: err?.code ?? 'INTERNAL', message: err?.message ?? '잠시 후 다시 시도해주세요.' })
        setStatus('error')
      },
    )
    return () => {
      alive = false
    }
  }, [req])

  // 로딩 단계 문구 (실제 서버 단계와 무관한 표시용 타이머)
  useEffect(() => {
    if (status !== 'loading') return
    setStep(0)
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 900)
    return () => window.clearInterval(id)
  }, [status])

  const visible = useMemo(() => {
    if (!res) return []
    const types = FILTERS.find((f) => f.key === filter)!.types
    const list = res.results.filter(
      (r) => types.length === 0 || r.program.supportTypes.some((t) => types.includes(t)),
    )
    if (sort === 'deadline')
      return [...list].sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))
    return list
  }, [res, filter, sort])

  if (!req) return <Navigate to="/support-match" replace />

  const onOverride = (key: keyof UserProfile, value: unknown) => {
    const next = { ...req, overrides: { ...req.overrides, [key]: value } }
    saveInput(next) // 새로고침해도 수정한 칩이 유지되도록
    setReq(next)
  }

  const fullCount = res?.results.filter((r) => r.verdict === '자격 충족').length ?? 0
  const checkCount = res ? res.results.length - fullCount : 0
  const ageUnknownCount =
    res?.results.filter((r) => r.rules.some((x) => x.rule.kind === 'age' && x.result === 'unknown'))
      .length ?? 0

  return (
    <Container className="flex flex-col gap-6 py-page-y">
      <PageHeader
        breadcrumb={[{ label: '홈', to: '/' }, { label: '지원사업 찾기', to: '/support-match' }, { label: '결과' }]}
        title="판정 결과"
        description={<>&ldquo;{req.text}&rdquo;</>}
        right={
          <Link to="/support-match" className={buttonClasses('secondary', 'md')}>
            조건 다시 입력
          </Link>
        }
      />

      <div className="flex flex-col gap-6" aria-live="polite">
        {status === 'loading' && (
          <>
            <p className="text-sm text-muted">
              {LOADING_STEPS.map((s, i) => (i <= step ? s : null))
                .filter(Boolean)
                .join(' → ')}
              …
            </p>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {status === 'error' && error && (
          <Card className="flex flex-col items-start gap-3">
            <p className="text-sm text-neg">{error.message}</p>
            {import.meta.env.DEV && <p className="text-xs text-faint">code: {error.code}</p>}
            <Button variant="secondary" onClick={() => setReq({ ...req })}>
              다시 시도
            </Button>
          </Card>
        )}

        {status === 'success' && res && (
          <>
            {res.meta.dataSource === 'mock' && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-panel bg-warn-soft px-4 py-3 text-sm font-semibold text-warn"
              >
                <Icon name="info" size={16} />
                샘플 데이터입니다. 실제 모집 공고 목록이 아니며 화면 구성을 확인하기 위한 예시예요.
              </div>
            )}

            <ProfileChips
              profile={res.profile}
              missing={res.missing}
              parser={res.meta.parser}
              onOverride={onOverride}
            />

            <Card className="flex flex-col gap-4">
              <SectionTitle icon="search" right={<DataBadge kind="self" />}>
                자격 충족 {fullCount}건 · 확인 필요 {checkCount}건
              </SectionTitle>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="지원 유형">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      role="tab"
                      aria-selected={filter === f.key}
                      onClick={() => setFilter(f.key)}
                      className={tabCls(filter === f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2" role="group" aria-label="정렬">
                  <button type="button" onClick={() => setSort('recommend')} className={tabCls(sort === 'recommend')}>
                    추천순
                  </button>
                  <button type="button" onClick={() => setSort('deadline')} className={tabCls(sort === 'deadline')}>
                    마감 임박순
                  </button>
                </div>
              </div>
              <p className="text-xs text-faint">
                매칭 점수는 이번 검색 결과 안에서 비교한 상대 점수예요. 공식 자격 심사가 아니에요.
              </p>
              {ageUnknownCount > 0 && (
                <p className="text-xs text-warn">
                  나이를 알려주시면 {ageUnknownCount}건을 더 정확히 판정할 수 있어요.
                </p>
              )}
            </Card>

            {res.results.length === 0 ? (
              <Card className="flex flex-col gap-3">
                <p className="text-[15px] font-bold text-ink">조건에 맞는 모집 중 공고가 없어요</p>
                <p className="text-sm text-muted">지역이나 창업 단계 조건을 바꿔서 다시 찾아보세요.</p>
              </Card>
            ) : visible.length === 0 ? (
              <p className="text-sm text-muted">이 유형에 해당하는 공고가 없어요. 다른 탭을 확인해보세요.</p>
            ) : (
              visible.map((r) => <MatchCard key={r.program.id} result={r} profile={res.profile} />)
            )}

            <NextSteps
              steps={res.nextSteps}
              conditional={res.conditional}
              profile={res.profile}
              counts={res.summary.conditional}
            />

            <ExcludedList items={res.excluded} defaultOpen={res.results.length === 0} />

            {res.meta.parser === 'rule' && res.meta.dataSource === 'live' && (
              <Badge tone="warn">간이 해석으로 판정한 결과예요</Badge>
            )}
          </>
        )}

        <p className="text-xs leading-relaxed text-faint">
          자격 판정은 공고 문구를 기반으로 한 자동 분석이며, 최종 자격은 공고 기관 심사로 결정됩니다.
        </p>
      </div>
    </Container>
  )
}
