import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { Container } from '@/layout/Container'
import { PageHeader } from '@/layout/PageHeader'
import { MAX_TEXT_LENGTH } from '@/services/supportMatch/config'
import { inputError } from '@/services/supportMatch/validate'
import { loadInput, saveInput } from './supportMatchInput'

const EXAMPLES = [
  '29살이고 서울 마포구에서 디저트 카페를 준비 중인 예비창업자예요. 인테리어 자금이 3천만원 정도 모자라요.',
  '36살, 경기도에서 음식점 창업을 준비하고 있어요. 창업 교육과 멘토링을 받고 싶어요.',
  '카페 창업을 생각 중인데 어떤 지원을 받을 수 있는지 모르겠어요.',
  '31살 예비창업자예요. 인천에서 소상공인으로 분식집을 열려고 하는데 보증 지원이 필요해요.',
]

/** /support-match — 입력만 받는다. 결과는 /support-match/results */
export function SupportMatch() {
  const navigate = useNavigate()
  // "조건 다시 입력"으로 돌아오면 이전 문장이 채워져 있다
  const [text, setText] = useState(() => loadInput()?.text ?? '')
  const canSubmit = !inputError(text)

  const submit = () => {
    if (!canSubmit) return
    const req = { text: text.trim() } // 새 문장이면 이전 칩 수정(overrides)은 버린다
    saveInput(req)
    navigate('/support-match/results', { state: req })
  }

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
            지원사업 찾기
          </Button>
        </div>
      </Card>
    </Container>
  )
}
