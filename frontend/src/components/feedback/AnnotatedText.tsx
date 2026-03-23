'use client'

import React, { useMemo } from 'react'

interface AnnotatedTextProps {
  text: string
  issues?: Array<{
    original: string
    suggested_text: string
    reason: string
  }>
}

export default function AnnotatedText({ text, issues = [] }: AnnotatedTextProps) {
  // Build annotated segments by finding issue originals in the text
  const segments = useMemo(() => {
    if (!issues.length) {
      return [{ type: 'normal', text }]
    }

    type Segment = { type: 'normal' | 'issue'; text: string; suggestion?: string; reason?: string }
    const result: Segment[] = []
    let remaining = text

    // Sort issues by their first occurrence in text
    const located = issues
      .map(issue => ({ ...issue, idx: remaining.indexOf(issue.original) }))
      .filter(i => i.idx >= 0)
      .sort((a, b) => a.idx - b.idx)

    let cursor = 0
    for (const issue of located) {
      const actualIdx = remaining.indexOf(issue.original, cursor)
      if (actualIdx < 0) continue
      if (actualIdx > cursor) {
        result.push({ type: 'normal', text: remaining.slice(cursor, actualIdx) })
      }
      result.push({
        type: 'issue',
        text: issue.original,
        suggestion: issue.suggested_text,
        reason: issue.reason,
      })
      cursor = actualIdx + issue.original.length
    }
    if (cursor < remaining.length) {
      result.push({ type: 'normal', text: remaining.slice(cursor) })
    }

    return result
  }, [text, issues])

  return (
    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
      {segments.map((seg, i) => {
        if (seg.type === 'normal') {
          return <span key={i}>{seg.text}</span>
        }
        return (
          <span key={i} className="group relative">
            <span className="bg-yellow-200 text-yellow-900 rounded px-0.5 cursor-help border-b border-dashed border-yellow-500">
              {seg.text}
            </span>
            {/* Tooltip on hover */}
            <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10 w-56 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg pointer-events-none">
              <span className="font-medium block mb-0.5">Suggested:</span>
              {seg.suggestion}
              {seg.reason && (
                <span className="block mt-1 text-gray-400">{seg.reason}</span>
              )}
            </span>
          </span>
        )
      })}
    </div>
  )
}
