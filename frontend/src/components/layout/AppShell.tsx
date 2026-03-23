'use client'

import React, { useState } from 'react'
import { ScaffoldSessionProvider } from '@/hooks/useScaffoldSession'
import PdfSidebar from './PdfSidebar'
import StepProgressBar from './StepProgressBar'
import ScaffoldOrchestrator from '@/components/scaffold/ScaffoldOrchestrator'
import { useScaffoldSession } from '@/hooks/useScaffoldSession'
import type { ScaffoldStep } from '@/types/scaffold'

interface AppShellProps {
  sessionId: string
}

function AppShellInner({ sessionId }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentStep, stepStatuses } = useScaffoldSession()

  const completedSteps = ([1, 2, 3] as ScaffoldStep[]).filter(
    s => stepStatuses[s] === 'complete' || stepStatuses[s] === 'submitted'
  )

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left sidebar (30%) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300
          md:relative md:w-[30%] md:min-w-[260px] md:max-w-[380px] md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <PdfSidebar sessionId={sessionId} />
      </aside>

      {/* Right main (70%) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open PDF sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>

          <div className="flex-1">
            <StepProgressBar currentStep={currentStep} completedSteps={completedSteps} />
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <ScaffoldOrchestrator />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AppShell({ sessionId }: AppShellProps) {
  return (
    <ScaffoldSessionProvider sessionId={sessionId}>
      <AppShellInner sessionId={sessionId} />
    </ScaffoldSessionProvider>
  )
}
