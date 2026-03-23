'use client'

import React, { useState } from 'react'
import { useScaffoldSession } from '@/hooks/useScaffoldSession'
import { useEvaluation } from '@/hooks/useEvaluation'
import ClozeItemComponent from './ClozeItem'
import Button from '@/components/ui/Button'
import FeedbackPanel from '@/components/feedback/FeedbackPanel'
import type { EvaluationResponse } from '@/types/evaluation'

interface Step2StructureProps {
  sessionId: string
}

export default function Step2Structure({ sessionId }: Step2StructureProps) {
  const { step2Items, setStep2Evaluation, initStep3 } = useScaffoldSession()
  const { isEvaluating, submitStep2, error: evalError } = useEvaluation(sessionId)

  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [localEvaluation, setLocalEvaluation] = useState<EvaluationResponse | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const handleAnswerChange = (itemId: string, newAnswers: string[]) => {
    setAnswers(prev => ({ ...prev, [itemId]: newAnswers }))
  }

  const handleSubmit = async () => {
    const flatAnswers: Record<string, string> = {}
    for (const item of step2Items) {
      const itemAnswers = answers[item.item_id] || []
      flatAnswers[item.item_id] = itemAnswers.join('; ')
    }

    try {
      const result = await submitStep2(flatAnswers)
      setLocalEvaluation(result)
      setStep2Evaluation(result)
      setSubmitted(true)
      setShowFeedback(true)
    } catch {
      // error handled by hook
    }
  }

  const handleContinue = async () => {
    setIsAdvancing(true)
    setShowFeedback(false)
    await initStep3()
    setIsAdvancing(false)
  }

  const allAnswered = step2Items.every(item => {
    const sentence = item.sentence_with_blanks || ''
    const blanksCount = sentence.split('___').length - 1 +
      (sentence.match(/\[BLANK_\d+\]/g)?.length || 0)
    const itemAnswers = answers[item.item_id] || []
    return blanksCount === 0 || itemAnswers.some(a => (a || '').trim().length > 0)
    //return blanksCount === 0 || itemAnswers.some(a => a.trim().length > 0)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Step 2: Fill in the Structure</h2>
        <p className="text-sm text-muted mt-1">
          Use academic sentence structures. The facts are given — fill in the structural phrases and connectives.
        </p>
      </div>

      {step2Items.length === 0 ? (
        <div className="text-sm text-muted text-center py-8">No items generated yet.</div>
      ) : (
        <div className="space-y-5">
          {step2Items.map((item, idx) => (
            <div key={item.item_id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-accent-light text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 space-y-3">
                  {/* Given facts badge */}
                  {item.given_facts && (
                    <div className="inline-flex items-start gap-1.5 text-xs bg-gray-100 text-gray-600 rounded-md px-3 py-2 leading-relaxed">
                      <span className="font-semibold shrink-0">Given facts:</span>
                      <span>{item.given_facts}</span>
                    </div>
                  )}

                  {/* Cloze sentence */}
                  <ClozeItemComponent
                    itemId={item.item_id}
                    sentence={item.sentence_with_blanks || '___'}
                    blankLabels={item.correct_structure?.map(() => 'academic phrase')}
                    answers={answers[item.item_id] || []}
                    onAnswerChange={vals => handleAnswerChange(item.item_id, vals)}
                    disabled={submitted}
                    referenceAnswers={submitted ? (item.correct_structure || []) : []}
                    showReference={submitted}
                  />

                  {/* Chinese prompt */}
                  {item.chinese_prompt && (
                    <div className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-3 py-2">
                      <span className="font-medium">提示: </span>
                      {item.chinese_prompt}
                    </div>
                  )}

                  {/* Phrasebank source */}
                  {item.phrasebank_source && (
                    <div className="text-xs text-purple-600">
                      Phrasebank: {item.phrasebank_source}
                    </div>
                  )}
                </div>
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

      {!submitted && step2Items.length > 0 && (
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
          Continue to Step 3
        </Button>
      )}

      {showFeedback && localEvaluation && (
        <FeedbackPanel
          evaluation={localEvaluation}
          onClose={() => setShowFeedback(false)}
          onContinue={handleContinue}
          continueLabel="Continue to Step 3"
          isContinuing={isAdvancing}
        />
      )}
    </div>
  )
}
