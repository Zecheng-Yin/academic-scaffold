'use client'

import React, { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ClozeItemProps {
  itemId: string
  sentence: string
  blankLabels?: string[]
  answers?: string[]
  onAnswerChange: (answers: string[]) => void
  disabled?: boolean
  referenceAnswers?: string[]
  showReference?: boolean
}

function AutoSizeInput({
  value,
  placeholder,
  onChange,
  disabled,
  isCorrect,
  showRef,
}: {
  value: string
  placeholder: string
  onChange: (v: string) => void
  disabled: boolean
  isCorrect?: boolean
  showRef?: boolean
}) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (spanRef.current && inputRef.current) {
      const w = Math.max(80, spanRef.current.offsetWidth + 8)
      inputRef.current.style.width = `${w}px`
    }
  }, [value, placeholder])

  return (
    <span className="relative inline-flex items-end">
      {/* Hidden span to measure text width */}
      <span
        ref={spanRef}
        className="absolute invisible whitespace-pre text-sm px-1"
        aria-hidden
      >
        {value || placeholder}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'cloze-blank text-sm',
          disabled && showRef && isCorrect === true && 'border-green-500 text-green-700',
          disabled && showRef && isCorrect === false && 'border-red-400 text-red-600'
        )}
        style={{ minWidth: 80 }}
      />
    </span>
  )
}

export default function ClozeItemComponent({
  itemId,
  sentence,
  blankLabels = [],
  answers = [],
  onAnswerChange,
  disabled = false,
  referenceAnswers = [],
  showReference = false,
}: ClozeItemProps) {
  // Split sentence on ___ (three underscores)
  const parts = sentence.split('___')

  const handleChange = (idx: number, val: string) => {
    const updated = [...answers]
    updated[idx] = val
    onAnswerChange(updated)
  }

  // Also support [BLANK_N] pattern
  const blankPattern = /\[BLANK_\d+\]/g
  const hasBracketBlanks = blankPattern.test(sentence)

  const renderSentence = () => {
    if (hasBracketBlanks) {
      const segments = sentence.split(/\[BLANK_\d+\]/g)
      const blanks = sentence.match(/\[BLANK_\d+\]/g) || []
      return segments.map((seg, i) => (
        <React.Fragment key={i}>
          <span className="text-gray-800">{seg}</span>
          {i < blanks.length && (
            <AutoSizeInput
              value={answers[i] || ''}
              placeholder={blankLabels[i] || '...'}
              onChange={v => handleChange(i, v)}
              disabled={disabled}
              isCorrect={showReference ? answers[i]?.trim().length > 0 : undefined}
              showRef={showReference}
            />
          )}
        </React.Fragment>
      ))
    }

    return parts.map((part, i) => (
      <React.Fragment key={i}>
        <span className="text-gray-800">{part}</span>
        {i < parts.length - 1 && (
          <AutoSizeInput
            value={answers[i] || ''}
            placeholder={blankLabels[i] || '...'}
            onChange={v => handleChange(i, v)}
            disabled={disabled}
            isCorrect={showReference ? answers[i]?.trim().length > 0 : undefined}
            showRef={showReference}
          />
        )}
      </React.Fragment>
    ))
  }

  return (
    <div className="space-y-2">
      <p className="text-sm leading-8">{renderSentence()}</p>
      {showReference && referenceAnswers.length > 0 && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <span className="font-medium">Reference: </span>
          {referenceAnswers.join(' / ')}
        </div>
      )}
    </div>
  )
}
