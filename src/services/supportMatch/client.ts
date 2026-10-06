import { extractAge } from '@/lib/parse'
import type { SupportMatchRequest, SupportMatchResponse } from './types'
import { buildUiPlaceholder } from './uiPlaceholder'
import { inputError } from './validate'

export class SupportMatchApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/**
 * POST /api/support-match.
 * Phase 3 에서 API 가 생기기 전까지는, 개발 모드에서 API 가 없을 때(404·네트워크 오류)만
 * UI 확인용 placeholder 응답을 돌려준다. meta.dataSource='mock' 이라 화면에 샘플 라벨이 뜬다.
 * 실제 자격 판정 결과가 아니다.
 */
export async function fetchSupportMatch(req: SupportMatchRequest): Promise<SupportMatchResponse> {
  const invalid = inputError(req.text)
  if (invalid) throw new SupportMatchApiError('INVALID_INPUT', invalid)
  const text = req.text.trim()

  let res: Response
  try {
    res = await fetch('/api/support-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req, text }),
    })
  } catch {
    if (import.meta.env.DEV) return buildUiPlaceholder(text, req.overrides, extractAge(text))
    throw new SupportMatchApiError('INTERNAL', '서버에 연결하지 못했어요.')
  }

  if (res.status === 404 && import.meta.env.DEV)
    return buildUiPlaceholder(text, req.overrides, extractAge(text))

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const e = body?.error
    throw new SupportMatchApiError(e?.code ?? 'INTERNAL', e?.message ?? '잠시 후 다시 시도해주세요.')
  }
  return body as SupportMatchResponse
}
