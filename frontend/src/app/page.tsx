'use client'

import UploadZone from '@/components/upload/UploadZone'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Academic Scaffold
          </h1>
          <p className="text-xl text-muted max-w-lg mx-auto leading-relaxed">
            Master academic English through structured retelling practice
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone />

        {/* 3-step description */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-accent-light text-accent font-bold text-lg flex items-center justify-center mx-auto mb-3">
              1
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Fill in the Facts</h3>
            <p className="text-sm text-muted leading-relaxed">
              Recall key facts and data from the paper by filling in blanks in sentence skeletons.
            </p>
          </div>
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-accent-light text-accent font-bold text-lg flex items-center justify-center mx-auto mb-3">
              2
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Fill in the Structure</h3>
            <p className="text-sm text-muted leading-relaxed">
              Practice academic sentence structures and phrasebank expressions guided by Chinese prompts.
            </p>
          </div>
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-accent-light text-accent font-bold text-lg flex items-center justify-center mx-auto mb-3">
              3
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Guided Retelling</h3>
            <p className="text-sm text-muted leading-relaxed">
              Write a full English retelling of the paper guided by a Chinese outline and receive detailed feedback.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
