'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import type { EvaluationResponse, Step3EvaluationResponse } from '@/types/evaluation'

export function useEvaluation(sessionId: string) {
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitStep1 = async (answers: Record<string, string>): Promise<EvaluationResponse> => {
    setIsEvaluating(true)
    setError(null)
    try {
      const answerArray = Object.entries(answers).map(([item_id, user_input]) => ({
        item_id,
        user_input,
      }))
      const result = await api.evaluate.step1(sessionId, answerArray)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Evaluation failed'
      setError(msg)
      throw e
    } finally {
      setIsEvaluating(false)
    }
  }

  const submitStep2 = async (answers: Record<string, string>): Promise<EvaluationResponse> => {
    setIsEvaluating(true)
    setError(null)
    try {
      const answerArray = Object.entries(answers).map(([item_id, user_input]) => ({
        item_id,
        user_input,
      }))
      const result = await api.evaluate.step2(sessionId, answerArray)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Evaluation failed'
      setError(msg)
      throw e
    } finally {
      setIsEvaluating(false)
    }
  }

  const submitStep3 = async (fullText: string): Promise<Step3EvaluationResponse> => {
    setIsEvaluating(true)
    setError(null)
    try {
      const result = await api.evaluate.step3(sessionId, fullText)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Evaluation failed'
      setError(msg)
      throw e
    } finally {
      setIsEvaluating(false)
    }
  }

  return { isEvaluating, error, submitStep1, submitStep2, submitStep3 }
}
