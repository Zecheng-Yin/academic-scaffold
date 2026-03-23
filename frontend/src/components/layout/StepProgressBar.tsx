'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ScaffoldStep } from '@/types/scaffold'

interface StepProgressBarProps {
  currentStep: ScaffoldStep
  completedSteps: ScaffoldStep[]
}

const STEPS: { number: ScaffoldStep; label: string }[] = [
  { number: 1, label: 'Fill the Facts' },
  { number: 2, label: 'Fill the Structure' },
  { number: 3, label: 'Guided Retelling' },
]

export default function StepProgressBar({ currentStep, completedSteps }: StepProgressBarProps) {
  return (
    <div className="flex items-center w-full px-2" aria-label="Progress">
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.number)
        const isActive = step.number === currentStep

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200',
                  isCompleted
                    ? 'bg-accent border-accent text-white'
                    : isActive
                    ? 'bg-white border-accent text-accent'
                    : 'bg-white border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap transition-colors duration-200',
                  isActive ? 'text-accent' : isCompleted ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-3 mt-[-14px] transition-colors duration-300',
                  completedSteps.includes(STEPS[idx + 1]?.number) || isCompleted
                    ? 'bg-accent'
                    : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
