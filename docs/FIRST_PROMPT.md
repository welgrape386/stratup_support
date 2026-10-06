# Claude Code에 처음 넣을 프롬프트

VS Code에서 이 폴더를 열고 Claude Code 첫 메시지로 아래를 그대로 붙여 넣는다.
(`CLAUDE.md`는 Claude Code가 자동으로 읽는다.)

---

```text
이 레포는 "창업 지원사업 매칭" 웹서비스야. 먼저 CLAUDE.md와 docs/SPEC.md를 처음부터 끝까지 읽고,
src/ 아래 현재 코드(특히 src/pages/SupportMatch.tsx, src/components/support/*, src/services/supportMatch/*)도 훑어줘.

[프로젝트 목적]
- 사용자가 자유 문장으로 자기 상황(나이·지역·창업 단계·필요한 지원)을 쓰면, 실제 정부·지자체 창업 지원사업
  공고 중 자격이 맞는 것만 정확히 골라 근거와 함께 보여주는 서비스.
- 수업 팀프로젝트라서 "구현했다"에서 끝나면 안 되고, baseline 대비 무엇이 얼마나 개선됐는지 숫자로 측정할 수 있어야 해.

[지킬 것]
- CLAUDE.md의 6가지 원칙 (특히: 자격 판정은 규칙 코드로, LLM은 해석과 설명만)
- 공공데이터 API의 파라미터·필드명은 추측하지 말고 공식 문서를 확인한 뒤 구현. 확인 못 하면 나한테 물어봐.
- 평가 지표 숫자는 실제로 실행한 결과만 보고해줘.

[진행 방식]
SPEC 11장의 Phase 순서대로, 한 Phase가 끝나면 멈추고 내 확인을 받은 뒤 다음으로 가줘.
지금 이미 끝난 것은 프로젝트 뼈대와 1차 UI(샘플 데이터)야.

이번 턴에는 코드를 쓰지 말고 아래만 해줘:
1. 읽고 이해한 내용을 10줄 이내로 요약
2. SPEC에서 모호하거나 구현 전에 정해야 할 점 (예: 하이브리드 검색 결합 방식, 청크 분할 기준, 자격 규칙 추출 프롬프트 설계)
3. 내가 준비해야 할 것 목록 (API 키, 평가 라벨링 등)
4. Phase 1의 구체적인 작업 계획 (만들 파일, 순서, 테스트 방법)
그다음 내 확인을 기다려줘.
```

---

## 이후 Phase별로 쓸 짧은 프롬프트

**Phase 1**
```text
Phase 1 진행해줘. 먼저 types.ts를 SPEC 3-2a대로 보강하고, config.ts, eligibility.ts, score.ts, validate.ts, whatIf.ts를 만들고,
match.check.ts에 SPEC 10장의 테스트(#9 제외)를 넣어서 npm run check:support로 통과시켜줘.
mock 3건 + 테스트용 fixture만 쓰고 LLM은 쓰지 마. 끝나면 테스트 결과를 그대로 보여주고 멈춰줘.
```

**Phase 2**
```text
Phase 2 진행해줘. API는 쓰지 않고 data/raw/manual/*.json(포털 화면에서 수동 수집, _TEMPLATE.json 참고)을 읽어서
정규화 -> 자격 규칙 추출(LLM, quote 검증) -> 청크 -> 임베딩 -> data/programs.index.json 을 만들어줘.
먼저 incheon-samples.json 샘플로 규칙 추출이 제대로 되는지(특히 지원조건/지원제외기준 -> 규칙 변환, 지원규모를 amountMaxManwon에 넣지 않기, 연중=rolling)
보여주고 내 확인을 받은 뒤 전체를 돌려줘.
끝나면 수집 건수, quote 검증 통과율, 'other'로 빠진 비율을 보고해줘.
```

**Phase 3**
```text
Phase 3 진행해줘. pipeline.ts(단계 on/off 옵션 지원)와 api/support-match.ts를 만들고,
프로필 추출과 설명 생성에 LLM을 붙여줘. LLM 실패 시 규칙 파서로 degrade해야 해.
UI의 uiPlaceholder와 client.ts 폴백 분기는 삭제하고 실제 API로 동작하게 해줘.
```

**Phase 5**
```text
Phase 5 진행해줘. data/eval/users.json 스키마와 샘플 5건만 만들고(나머지는 팀이 라벨링),
scripts/eval-support.ts에서 B0~B3와 LLM-only를 돌려 SPEC 7장의 지표 4개를 markdown 표로 출력해줘.
```
