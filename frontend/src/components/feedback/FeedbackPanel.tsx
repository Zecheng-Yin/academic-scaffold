'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EvaluationResponse } from '@/types/evaluation'
import ScoreRing from './ScoreRing'
import Button from '@/components/ui/Button'
import { cn, formatScore, scoreColor } from '@/lib/utils'

interface FeedbackPanelProps {
  evaluation: EvaluationResponse
  onClose: () => void
  onContinue?: () => void
  continueLabel?: string
  isContinuing?: boolean
}

export default function FeedbackPanel({
  evaluation,
  onClose,
  onContinue,
  continueLabel = 'Continue',
  isContinuing = false,
}: FeedbackPanelProps) {
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null)

  const handleCopyPhrase = async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase)
      setCopiedPhrase(phrase)
      setTimeout(() => setCopiedPhrase(null), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-accent-light to-white">
          <div className="flex items-center gap-4">
            <ScoreRing score={evaluation.overall_score} size={64} strokeWidth={6} />
            <div>
              <div className={cn('text-xl font-bold', scoreColor(evaluation.overall_score))}>
                {formatScore(evaluation.overall_score)}
              </div>
              <div className="text-xs text-muted">Overall Score: {evaluation.overall_score}/100</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close feedback"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Global feedback */}
        <div className="px-6 py-4 bg-accent-light/40 border-b border-gray-100">
          <p className="text-sm text-gray-700 italic leading-relaxed">{evaluation.global_feedback}</p>
        </div>

        {/* Item feedback cards */}
        <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {evaluation.items.map((item, idx) => (
            <div key={item.item_id} className="bg-gray-50 rounded-xl p-4 space-y-3">
              {/* Item header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Item {idx + 1}</span>
                <div className="flex gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5">
                    Semantic: {item.semantic_score}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5">
                    Formality: {item.formality_score}
                  </span>
                </div>
              </div>

              {/* Your answer vs reference */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 shrink-0 font-medium w-24">Your answer:</span>
                  <span className="text-gray-800">{item.user_input || '(empty)'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 shrink-0 font-medium w-24">Reference:</span>
                  <span className="text-green-800">{item.reference_answer}</span>
                </div>
              </div>

              {/* Feedback text */}
              {item.feedback_text && (
                <p className="text-xs text-gray-600 leading-relaxed">{item.feedback_text}</p>
              )}

              {/* Suggested phrases */}
              {item.suggested_phrases.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">Academic phrases to try:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.suggested_phrases.map((phrase, pi) => (
                      <button
                        key={pi}
                        onClick={() => handleCopyPhrase(phrase)}
                        title="Click to copy"
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-all duration-150',
                          copiedPhrase === phrase
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-accent hover:text-accent hover:bg-accent-light'
                        )}
                      >
                        {copiedPhrase === phrase ? 'Copied!' : phrase}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {onContinue && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Review Answers
            </Button>
            <Button
              onClick={onContinue}
              isLoading={isContinuing}
              disabled={isContinuing}
              className="flex-1"
            >
              {continueLabel}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
