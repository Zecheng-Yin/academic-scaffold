'use client'

import React, { useState } from 'react'
import { useScaffoldSession } from '@/hooks/useScaffoldSession'
import { useEvaluation } from '@/hooks/useEvaluation'
import ClozeItemComponent from './ClozeItem'
import Button from '@/components/ui/Button'
import FeedbackPanel from '@/components/feedback/FeedbackPanel'
import type { EvaluationResponse } from '@/types/evaluation'

interface Step1FactsProps {
  sessionId: string
}

export default function Step1Facts({ sessionId }: Step1FactsProps) {
  const { step1Items, setStep1Evaluation, step1Evaluation, initStep2 } = useScaffoldSession()
  const { isEvaluating, submitStep1, error: evalError } = useEvaluation(sessionId)

  // answers: itemId -> array of blank answers
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [localEvaluation, setLocalEvaluation] = useState<EvaluationResponse | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const handleAnswerChange = (itemId: string, newAnswers: string[]) => {
    setAnswers(prev => ({ ...prev, [itemId]: newAnswers }))
  }

  const handleSubmit = async () => {
    // Build flat answers: join multi-blank answers with '; '
    const flatAnswers: Record<string, string> = {}
    for (const item of step1Items) {
      const itemAnswers = answers[item.item_id] || []
      flatAnswers[item.item_id] = itemAnswers.join('; ')
    }

    try {
      const result = await submitStep1(flatAnswers)
      setLocalEvaluation(result)
      setStep1Evaluation(result)
      setSubmitted(true)
      setShowFeedback(true)
    } catch {
      // error handled by hook
    }
  }

  const handleContinue = async () => {
    setIsAdvancing(true)
    setShowFeedback(false)
    await initStep2()
    setIsAdvancing(false)
  }

  const allAnswered = step1Items.every(item => {
    const blanksCount = (item.sentence_skeleton || '').split('___').length - 1 +
      ((item.sentence_skeleton || '').match(/\[BLANK_\d+\]/g)?.length || 0)
    const itemAnswers = answers[item.item_id] || []
    return blanksCount === 0 || itemAnswers.some(a => a.trim().length > 0)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Step 1: Fill in the Facts</h2>
        <p className="text-sm text-muted mt-1">
          Recall key facts and data from the paper. Fill in the blanks in each sentence.
        </p>
      </div>

      {step1Items.length === 0 ? (
        <div className="text-sm text-muted text-center py-8">No items generated yet.</div>
      ) : (
        <div className="space-y-4">
          {step1Items.map((item, idx) => (
            <div key={item.item_id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-accent-light text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <ClozeItemComponent
                  itemId={item.item_id}
                  sentence={item.sentence_skeleton || '___'}
                  blankLabels={item.blank_labels}
                  answers={answers[item.item_id] || []}
                  onAnswerChange={vals => handleAnswerChange(item.item_id, vals)}
                  disabled={submitted}
                  referenceAnswers={submitted ? (item.correct_facts || []) : []}
                  showReference={submitted}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {evalError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {evalError}
        </div>
      )}

      {!submitted && step1Items.length > 0 && (
        <Button
          onClick={handleSubmit}
          isLoading={isEvaluating}
          disabled={isEvaluating || !allAnswered}
          className="w-full"
        >
          Submit Answers
        </Button>
      )}

      {submitted && !showFeedback && (
        <Button
          onClick={handleContinue}
          isLoading={isAdvancing}
          disabled={isAdvancing}
          className="w-full"
        >
          Continue to Step 2
        </Button>
      )}

      {showFeedback && localEvaluation && (
        <FeedbackPanel
          evaluation={localEvaluation}
          onClose={() => setShowFeedback(false)}
          onContinue={handleContinue}
          continueLabel="Continue to Step 2"
          isContinuing={isAdvancing}
        />
      )}
    </div>
  )
}
