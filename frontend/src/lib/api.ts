//import type { EvaluationResponse, Step3EvaluationResponse } from '@/types/evaluation'
//import type { Step1Response, Step2Response, Step3Response } from '@/types/scaffold'

//const BASE = '/api'
import type { EvaluationResponse, Step3EvaluationResponse } from '@/types/evaluation'
import type { Step2Response, Step3Response, Step1Response } from '@/types/scaffold'

// 关键修改：如果配置了环境变量就用它，否则默认本地开发地址
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const BASE = `${API_URL}/api`

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      message = data.detail || data.message || message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  document: {
    upload: async (file: File): Promise<{ session_id: string; status: string; title_hint: string; text_preview: string }> => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${BASE}/document/upload`, {
        method: 'POST',
        body: formData,
      })
      return handleResponse(res)
    },

    getStatus: async (sessionId: string): Promise<{ session_id: string; status: string; error_message?: string }> => {
      const res = await fetch(`${BASE}/document/${sessionId}/status`)
      return handleResponse(res)
    },

    getPdfUrl: (sessionId: string): string => `${BASE}/document/${sessionId}/pdf`,
  },

  scaffold: {
    generateStep1: async (sessionId: string): Promise<Step1Response> => {
      const res = await fetch(`${BASE}/scaffold/${sessionId}/step1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return handleResponse<Step1Response>(res)
    },

    generateStep2: async (sessionId: string): Promise<Step2Response> => {
      const res = await fetch(`${BASE}/scaffold/${sessionId}/step2/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return handleResponse<Step2Response>(res)
    },

    generateStep3: async (sessionId: string): Promise<Step3Response> => {
      const res = await fetch(`${BASE}/scaffold/${sessionId}/step3/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return handleResponse<Step3Response>(res)
    },
  },

  evaluate: {
    step1: async (
      sessionId: string,
      answers: Array<{ item_id: string; user_input: string }>
    ): Promise<EvaluationResponse> => {
      const res = await fetch(`${BASE}/evaluate/${sessionId}/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      return handleResponse<EvaluationResponse>(res)
    },

    step2: async (
      sessionId: string,
      answers: Array<{ item_id: string; user_input: string }>
    ): Promise<EvaluationResponse> => {
      const res = await fetch(`${BASE}/evaluate/${sessionId}/step2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      return handleResponse<EvaluationResponse>(res)
    },

    step3: async (
      sessionId: string,
      fullText: string
    ): Promise<Step3EvaluationResponse> => {
      const res = await fetch(`${BASE}/evaluate/${sessionId}/step3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_text: fullText }),
      })
      return handleResponse<Step3EvaluationResponse>(res)
    },
  },
}
