# 창업지원 매칭

자유 문장으로 내 상황을 적으면, 모집 중인 창업 지원사업 중 자격이 맞는 공고를 근거와 함께 찾아주는 웹서비스.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
```

- 설계: `docs/SPEC.md`
- Claude Code 지침: `CLAUDE.md`
- Claude Code 첫 프롬프트: `docs/FIRST_PROMPT.md`
- 환경 변수: `.env.example` → `.env.local` 로 복사해서 채우기 (서버 전용, 커밋 금지)

현재 `/support-match`는 **샘플 데이터(placeholder)** 로 동작합니다. 실제 공고 연동은 SPEC 11장 Phase 2~3.
