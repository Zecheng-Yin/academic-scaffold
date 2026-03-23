'use client'

import React, { useEffect, useRef } from 'react'
import { scoreRingColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

export default function ScoreRing({ score, size = 80, strokeWidth = 7 }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const clampedScore = Math.min(100, Math.max(0, score))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedScore / 100) * circumference
  const color = scoreRingColor(clampedScore)

  useEffect(() => {
    const el = circleRef.current
    if (!el) return
    // Animate from full offset (empty) to the target offset
    el.style.transition = 'none'
    el.style.strokeDashoffset = String(circumference)
    // Force reflow
    void el.getBoundingClientRect()
    el.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.strokeDashoffset = String(offset)
  }, [score, circumference, offset])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      {/* Score label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{ fontSize: size * 0.26, color }}
        >
          {clampedScore}
        </span>
        <span className="text-gray-400 leading-none" style={{ fontSize: size * 0.13 }}>
          /100
        </span>
      </div>
    </div>
  )
}
