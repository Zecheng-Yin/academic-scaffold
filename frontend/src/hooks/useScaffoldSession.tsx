'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ClozeItem, ScaffoldStep, StepStatus } from '@/types/scaffold'
import type { EvaluationResponse, Step3EvaluationResponse } from '@/types/evaluation'
import { api } from '@/lib/api'

interface ScaffoldSessionState {
  sessionId: string
  currentStep: ScaffoldStep
  stepStatuses: Record<ScaffoldStep, StepStatus>
  step1Items: ClozeItem[]
  step2Items: ClozeItem[]
  step3Outline: string[]
  step1Evaluation: EvaluationResponse | null
  step2Evaluation: EvaluationResponse | null
  step3Evaluation: Step3EvaluationResponse | null
  isGenerating: boolean
  error: string | null
  // Actions
  initStep1: () => Promise<void>
  initStep2: () => Promise<void>
  initStep3: () => Promise<void>
  advanceToStep: (step: ScaffoldStep) => void
  setStep1Evaluation: (r: EvaluationResponse) => void
  setStep2Evaluation: (r: EvaluationResponse) => void
  setStep3Evaluation: (r: Step3EvaluationResponse) => void
  resetSession: () => void
}

const ScaffoldSessionContext = createContext<ScaffoldSessionState | null>(null)

interface ScaffoldSessionProviderProps {
  sessionId: string
  children: React.ReactNode
}

export function ScaffoldSessionProvider({ sessionId, children }: ScaffoldSessionProviderProps) {
  const [currentStep, setCurrentStep] = useState<ScaffoldStep>(1)
  const [stepStatuses, setStepStatuses] = useState<Record<ScaffoldStep, StepStatus>>({
    1: 'idle',
    2: 'idle',
    3: 'idle',
  })
  const [step1Items, setStep1Items] = useState<ClozeItem[]>([])
  const [step2Items, setStep2Items] = useState<ClozeItem[]>([])
  const [step3Outline, setStep3Outline] = useState<string[]>([])
  const [step1Evaluation, setStep1EvaluationState] = useState<EvaluationResponse | null>(null)
  const [step2Evaluation, setStep2EvaluationState] = useState<EvaluationResponse | null>(null)
  const [step3Evaluation, setStep3EvaluationState] = useState<Step3EvaluationResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStepStatus = useCallback((step: ScaffoldStep, status: StepStatus) => {
    setStepStatuses(prev => ({ ...prev, [step]: status }))
  }, [])

  const initStep1 = useCallback(async () => {
    if (stepStatuses[1] !== 'idle') return
    setIsGenerating(true)
    setError(null)
    updateStepStatus(1, 'loading')
    try {
      const response = await api.scaffold.generateStep1(sessionId)
      setStep1Items(response.items)
      updateStepStatus(1, 'active')
      setCurrentStep(1)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate Step 1'
      setError(msg)
      updateStepStatus(1, 'idle')
    } finally {
      setIsGenerating(false)
    }
  }, [sessionId, stepStatuses, updateStepStatus])

  const initStep2 = useCallback(async () => {
    if (stepStatuses[2] !== 'idle') return
    setIsGenerating(true)
    setError(null)
    updateStepStatus(2, 'loading')
    try {
      const response = await api.scaffold.generateStep2(sessionId)
      setStep2Items(response.items)
      updateStepStatus(1, 'complete')
      updateStepStatus(2, 'active')
      setCurrentStep(2)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate Step 2'
      setError(msg)
      updateStepStatus(2, 'idle')
    } finally {
      setIsGenerating(false)
    }
  }, [sessionId, stepStatuses, updateStepStatus])

  const initStep3 = useCallback(async () => {
    if (stepStatuses[3] !== 'idle') return
    setIsGenerating(true)
    setError(null)
    updateStepStatus(3, 'loading')
    try {
      const response = await api.scaffold.generateStep3(sessionId)
      setStep3Outline(response.chinese_outline)
      updateStepStatus(2, 'complete')
      updateStepStatus(3, 'active')
      setCurrentStep(3)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate Step 3'
      setError(msg)
      updateStepStatus(3, 'idle')
    } finally {
      setIsGenerating(false)
    }
  }, [sessionId, stepStatuses, updateStepStatus])

  const advanceToStep = useCallback((step: ScaffoldStep) => {
    setCurrentStep(step)
  }, [])

  const setStep1Evaluation = useCallback((r: EvaluationResponse) => {
    setStep1EvaluationState(r)
    updateStepStatus(1, 'submitted')
  }, [updateStepStatus])

  const setStep2Evaluation = useCallback((r: EvaluationResponse) => {
    setStep2EvaluationState(r)
    updateStepStatus(2, 'submitted')
  }, [updateStepStatus])

  const setStep3Evaluation = useCallback((r: Step3EvaluationResponse) => {
    setStep3EvaluationState(r)
    updateStepStatus(3, 'submitted')
  }, [updateStepStatus])

  const resetSession = useCallback(() => {
    setCurrentStep(1)
    setStepStatuses({ 1: 'idle', 2: 'idle', 3: 'idle' })
    setStep1Items([])
    setStep2Items([])
    setStep3Outline([])
    setStep1EvaluationState(null)
    setStep2EvaluationState(null)
    setStep3EvaluationState(null)
    setError(null)
  }, [])

  const value: ScaffoldSessionState = {
    sessionId,
    currentStep,
    stepStatuses,
    step1Items,
    step2Items,
    step3Outline,
    step1Evaluation,
    step2Evaluation,
    step3Evaluation,
    isGenerating,
    error,
    initStep1,
    initStep2,
    initStep3,
    advanceToStep,
    setStep1Evaluation,
    setStep2Evaluation,
    setStep3Evaluation,
    resetSession,
  }

  return (
    <ScaffoldSessionContext.Provider value={value}>
      {children}
    </ScaffoldSessionContext.Provider>
  )
}

export function useScaffoldSession(): ScaffoldSessionState {
  const ctx = useContext(ScaffoldSessionContext)
  if (!ctx) {
    throw new Error('useScaffoldSession must be used within a ScaffoldSessionProvider')
  }
  return ctx
}
