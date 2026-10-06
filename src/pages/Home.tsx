import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/Button'
import { Card } from '@/components/Card'
import { Icon, type IconName } from '@/components/Icon'
import { Container } from '@/layout/Container'

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'user',
    title: '내 상황을 문장으로',
    body: '나이, 지역, 창업 단계, 필요한 지원을 편하게 적으면 조건을 알아서 정리해요.',
  },
  {
    icon: 'check',
    title: '자격이 맞는 공고만',
    body: '공고의 자격 조건을 하나씩 비교해서, 맞는 것과 확인이 필요한 것을 나눠 보여줘요.',
  },
  {
    icon: 'search',
    title: '근거는 공고 원문으로',
    body: '왜 맞는지를 공고 원문 문장과 함께 보여줘요. 근거가 없는 설명은 노출하지 않아요.',
  },
]

export function Home() {
  return (
    <Container className="flex flex-col gap-12 py-page-y">
      <section className="flex max-w-3xl flex-col gap-5 py-6">
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-ink sm:text-[44px]">
          받을 수 있는 창업 지원사업,
          <br />
          문장 하나로 찾아보세요
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">
          정부·지자체 창업 지원사업 공고 중에서 내 조건에 맞는 것만 골라, 왜 맞는지 근거와 함께
          보여드립니다.
        </p>
        <div>
          <Link to="/support-match" className={buttonClasses('primary', 'lg')}>
            지원사업 찾기
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {POINTS.map((p) => (
          <Card key={p.title} className="flex flex-col gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <Icon name={p.icon} size={22} />
            </span>
            <h2 className="text-[17px] font-bold text-ink">{p.title}</h2>
            <p className="text-[13px] leading-relaxed text-muted">{p.body}</p>
          </Card>
        ))}
      </section>
    </Container>
  )
}
