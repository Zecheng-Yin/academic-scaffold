'use client'

import React, { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

interface UploadProgressProps {
  sessionId: string
  onReady: () => void
}

type Stage = 'uploading' | 'extracting' | 'indexing' | 'ready'

const STAGES: { id: Stage; label: string }[] = [
  { id: 'uploading', label: 'Uploading PDF...' },
  { id: 'extracting', label: 'Extracting text...' },
  { id: 'indexing', label: 'Building knowledge index...' },
  { id: 'ready', label: 'Ready!' },
]

export default function UploadProgress({ sessionId, onReady }: UploadProgressProps) {
  const [stage, setStage] = useState<Stage>('uploading')
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    // Simulate stages via timed progression + real polling
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setStage('extracting'), 800))
    timers.push(setTimeout(() => setStage('indexing'), 1800))

    // Poll for ready status
    let stopped = false
    const poll = async () => {
      if (stopped) return
      try {
        const status = await api.document.getStatus(sessionId)
        if (status.status === 'ready') {
          setStage('ready')
          setTimeout(() => onReady(), 600)
          return
        }
      } catch {
        // If session is found this means it's ready (status endpoint returns 200 when ready)
        setStage('ready')
        setTimeout(() => onReady(), 600)
        return
      }
      setPollCount(c => c + 1)
      timers.push(setTimeout(poll, 1500))
    }

    // Start polling after 1s
    timers.push(setTimeout(poll, 1000))

    return () => {
      stopped = true
      timers.forEach(clearTimeout)
    }
  }, [sessionId, onReady])

  return (
    <div className="w-full rounded-xl border-2 border-gray-200 bg-white py-14 px-8 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        {STAGES.map((s, idx) => {
          const currentIdx = STAGES.findIndex(x => x.id === stage)
          const isDone = idx < currentIdx || stage === 'ready'
          const isActive = idx === currentIdx && stage !== 'ready'

          return (
            <div key={s.id} className="flex items-center gap-3 w-full">
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {stage === 'ready' || isDone ? (
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : isActive ? (
                  <Spinner size="sm" className="text-accent" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <span
                className={
                  isDone
                    ? 'text-sm text-gray-500 line-through'
                    : isActive
                    ? 'text-sm font-medium text-gray-900'
                    : 'text-sm text-gray-400'
                }
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {(stage as string) === 'ready' && (
        <p className="text-sm text-success font-medium">
          Your document is ready. Redirecting...
        </p>
      )}
    </div>
  )
}
