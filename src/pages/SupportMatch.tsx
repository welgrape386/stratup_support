import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { DataBadge } from '@/components/DataBadge'
import { Icon } from '@/components/Icon'
import { SectionTitle } from '@/components/SectionTitle'
import { ExcludedList } from '@/components/support/ExcludedList'
import { MatchCard } from '@/components/support/MatchCard'
import { ProfileChips } from '@/components/support/ProfileChips'
import { cx } from '@/lib/cx'
import { Container } from '@/layout/Container'
import { PageHeader } from '@/layout/PageHeader'
import { fetchSupportMatch, SupportMatchApiError } from '@/services/supportMatch/client'
import { MAX_TEXT_LENGTH } from '@/services/supportMatch/config'
import type {
  SupportMatchRequest,
  SupportMatchResponse,
  UserProfile,
} from '@/services/supportMatch/types'
import { inputError } from '@/services/supportMatch/validate'

const EXAMPLES = [
  '29살이고 서울 마포구에서 디저트 카페를 준비 중인 예비창업자예요. 인테리어 자금이 3천만원 정도 모자라요.',
  '36살, 경기도에서 음식점 창업을 준비하고 있어요. 창업 교육과 멘토링을 받고 싶어요.',
  '카페 창업을 생각 중인데 어떤 지원을 받을 수 있는지 모르겠어요.',
]

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

export function SupportMatch() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [step, setStep] = useState(0)
  const [res, setRes] = useState<SupportMatchResponse | null>(null)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [overrides, setOverrides] = useState<NonNullable<SupportMatchRequest['overrides']>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recommend')
  const resultRef = useRef<HTMLDivElement>(null)

  const trimmed = text.trim()
  const canSubmit = !inputError(text) && status !== 'loading'

  // 로딩 단계 문구 (실제 서버 단계와 무관한 표시용 타이머)
  useEffect(() => {
    if (status !== 'loading') return
    setStep(0)
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 900)
    return () => window.clearInterval(id)
  }, [status])

  // 결과가 나오면 결과 영역으로 포커스·스크롤
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      resultRef.current?.focus()
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [status])

  const run = async (nextOverrides: typeof overrides) => {
    setStatus('loading')
    setError(null)
    try {
      const data = await fetchSupportMatch({
        text: trimmed,
        overrides: Object.keys(nextOverrides).length ? nextOverrides : undefined,
      })
      setRes(data)
      setStatus('success')
    } catch (e) {
      const err = e instanceof SupportMatchApiError ? e : null
      setError({ code: err?.code ?? 'INTERNAL', message: err?.message ?? '잠시 후 다시 시도해주세요.' })
      setStatus('error')
    }
  }

  const submit = () => {
    setOverrides({})
    setFilter('all')
    void run({})
  }

  const onOverride = (key: keyof UserProfile, value: unknown) => {
    const next = { ...overrides, [key]: value }
    setOverrides(next)
    void run(next)
  }

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

  const fullCount = res?.results.filter((r) => r.verdict === '자격 충족').length ?? 0
  const checkCount = res ? res.results.length - fullCount : 0
  const ageUnknownCount =
    res?.results.filter((r) => r.rules.some((x) => x.rule.kind === 'age' && x.result === 'unknown'))
      .length ?? 0

  return (
    <Container className="flex flex-col gap-6 py-page-y">
      <PageHeader
        breadcrumb={[{ label: '홈', to: '/' }, { label: '지원사업 찾기' }]}
        title="받을 수 있는 창업 지원사업을 찾아드릴게요"
        description="나이, 지역, 창업 단계, 필요한 지원을 편하게 적어주세요."
      />

      <Card className="flex flex-col gap-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={MAX_TEXT_LENGTH}
            aria-label="내 상황"
            placeholder="예) 29살이고 서울 마포구에서 디저트 카페를 준비 중인 예비창업자예요. 인테리어 자금이 3천만원 정도 모자라요."
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink-soft outline-none focus:border-primary-400"
          />
          <p className="mt-1 text-right text-xs text-faint tnum">
            {text.length}/{MAX_TEXT_LENGTH}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="min-h-10 rounded-chip bg-bg-soft px-3.5 text-[13px] font-semibold text-muted hover:bg-primary-50"
            >
              예시 {i + 1}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs text-faint">
            <Icon name="info" size={12} />
            나이·지역·창업 단계를 적으면 자격을 정확히 판정할 수 있어요
          </p>
          <Button size="lg" iconRight="arrow-right" onClick={submit} disabled={!canSubmit}>
            {status === 'loading' ? LOADING_STEPS[step] : '지원사업 찾기'}
          </Button>
        </div>
      </Card>

      <div ref={resultRef} tabIndex={-1} className="flex flex-col gap-6 outline-none" aria-live="polite">
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
            <Button variant="secondary" onClick={() => void run(overrides)} disabled={!trimmed}>
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
                샘플 데이터입니다. 실제 공고가 아니며 화면 구성을 확인하기 위한 예시예요.
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
              visible.map((r) => <MatchCard key={r.program.id} result={r} />)
            )}

            <ExcludedList items={res.excluded} defaultOpen={res.results.length === 0} />

            {res.meta.parser === 'rule' && res.meta.dataSource === 'live' && (
              <Badge tone="warn">간이 해석으로 판정한 결과예요</Badge>
            )}
          </>
        )}

        {status !== 'idle' && (
          <p className="text-xs leading-relaxed text-faint">
            자격 판정은 공고 문구를 기반으로 한 자동 분석이며, 최종 자격은 공고 기관 심사로 결정됩니다.
          </p>
        )}
      </div>
    </Container>
  )
}
