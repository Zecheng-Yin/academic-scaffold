'use client'

import React, { useState } from 'react'
import { useScaffoldSession } from '@/hooks/useScaffoldSession'
import { useEvaluation } from '@/hooks/useEvaluation'
import Button from '@/components/ui/Button'
import ScoreRing from '@/components/feedback/ScoreRing'
import AnnotatedText from '@/components/feedback/AnnotatedText'
import { formatScore, scoreColor, countWords } from '@/lib/utils'
import type { Step3EvaluationResponse } from '@/types/evaluation'

interface Step3ParaphraseProps {
  sessionId: string
}

export default function Step3Paraphrase({ sessionId }: Step3ParaphraseProps) {
  const { step3Outline, setStep3Evaluation, step3Evaluation, resetSession } = useScaffoldSession()
  const { isEvaluating, submitStep3, error: evalError } = useEvaluation(sessionId)

  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [localEval, setLocalEval] = useState<Step3EvaluationResponse | null>(null)

  const wordCount = countWords(text)

  const handleSubmit = async () => {
    if (!text.trim()) return
    try {
      const result = await submitStep3(text)
      setLocalEval(result)
      setStep3Evaluation(result)
      setSubmitted(true)
    } catch {
      // error handled by hook
    }
  }

  const handleReset = () => {
    setText('')
    setSubmitted(false)
    setLocalEval(null)
    resetSession()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Step 3: Guided Retelling</h2>
        <p className="text-sm text-muted mt-1">
          Use the Chinese outline below to write an English retelling of the paper's key content.
        </p>
      </div>

      {/* Chinese outline */}
      {step3Outline.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-teal-800 mb-3">写作提示 (Writing Outline)</h3>
          <ol className="space-y-2">
            {step3Outline.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-teal-900">
                <span className="shrink-0 w-5 h-5 rounded-full bg-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                {point}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Text input */}
      {!submitted && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your English retelling here, following the outline above..."
              rows={10}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            <span>Aim for 150–250 words</span>
          </div>
        </div>
      )}

      {evalError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {evalError}
        </div>
      )}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          isLoading={isEvaluating}
          disabled={isEvaluating || wordCount < 30}
          className="w-full"
        >
          Submit for Evaluation
        </Button>
      )}

      {/* Step 3 Evaluation Results */}
      {submitted && localEval && (
        <div className="space-y-6">
          {/* Score overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <ScoreRing score={localEval.overall_score} size={100} />
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className={`text-2xl font-bold ${scoreColor(localEval.overall_score)}`}>
                  {formatScore(localEval.overall_score)}
                </div>
                <div className="text-sm text-muted">Overall Score: {localEval.overall_score}/100</div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center sm:justify-start">
                  <div className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1">
                    Semantic: {localEval.semantic_score}
                  </div>
                  <div className="text-xs bg-purple-50 text-purple-700 rounded-full px-3 py-1">
                    Formality: {localEval.formality_score}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Key Point Coverage</h3>
              <span className="text-sm font-bold text-accent">{localEval.coverage_percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${localEval.coverage_percentage}%` }}
              />
            </div>
            {localEval.covered_points.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Covered:</p>
                <ul className="space-y-1">
                  {localEval.covered_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <svg className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {localEval.missing_points.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Missing:</p>
                <ul className="space-y-1">
                  {localEval.missing_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Formality issues */}
          {localEval.formality_issues.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Formality Suggestions</h3>
              <div className="space-y-3">
                {localEval.formality_issues.map((issue, i) => (
                  <div key={i} className="text-xs border border-yellow-200 bg-yellow-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-yellow-800 shrink-0">Original:</span>
                      <span className="text-yellow-900 italic">&ldquo;{issue.original}&rdquo;</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-green-700 shrink-0">Suggested:</span>
                      <span className="text-green-800">&ldquo;{issue.suggested_text}&rdquo;</span>
                    </div>
                    {issue.reason && (
                      <p className="text-gray-500">{issue.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global feedback */}
          <div className="bg-accent-light border border-accent/20 rounded-xl p-5">
            <p className="text-sm text-gray-800 italic leading-relaxed">{localEval.global_feedback}</p>
          </div>

          {/* Annotated text */}
          {localEval.annotated_text && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Your Text (Annotated)</h3>
              <AnnotatedText text={localEval.annotated_text} issues={localEval.formality_issues} />
            </div>
          )}

          {/* Practice again */}
          <Button variant="secondary" onClick={handleReset} className="w-full">
            Practice Again
          </Button>
        </div>
      )}
    </div>
  )
}
