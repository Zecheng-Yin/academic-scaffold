'use client'

import React, { useEffect } from 'react'
import { useScaffoldSession } from '@/hooks/useScaffoldSession'
import Step1Facts from './Step1Facts'
import Step2Structure from './Step2Structure'
import Step3Paraphrase from './Step3Paraphrase'
import Spinner from '@/components/ui/Spinner'

export default function ScaffoldOrchestrator() {
  const { sessionId, currentStep, isGenerating, error, initStep1, stepStatuses } = useScaffoldSession()

  // Auto-trigger step 1 generation on mount
  useEffect(() => {
    if (stepStatuses[1] === 'idle') {
      initStep1()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isGenerating && stepStatuses[currentStep] === 'loading') {
    const loadingMessages: Record<number, string> = {
      1: 'Generating fill-in-the-facts exercises...',
      2: 'Generating fill-in-the-structure exercises...',
      3: 'Generating guided retelling outline...',
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="lg" className="text-accent" />
        <p className="text-sm text-muted animate-pulse">
          {loadingMessages[currentStep] || 'Generating content...'}
        </p>
      </div>
    )
  }

  if (error && stepStatuses[currentStep] === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-center max-w-md">
          <p className="font-medium mb-1">Something went wrong</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => initStep1()}
          className="text-sm text-accent underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div>
      {currentStep === 1 && <Step1Facts sessionId={sessionId} />}
      {currentStep === 2 && <Step2Structure sessionId={sessionId} />}
      {currentStep === 3 && <Step3Paraphrase sessionId={sessionId} />}
    </div>
  )
}
