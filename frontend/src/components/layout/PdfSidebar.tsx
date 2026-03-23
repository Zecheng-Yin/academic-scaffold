'use client'

import React, { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { api } from '@/lib/api'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
/*pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()*/

interface PdfSidebarProps {
  sessionId: string
}

export default function PdfSidebar({ sessionId }: PdfSidebarProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const pdfUrl = api.document.getPdfUrl(sessionId)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    setLoadError(error.message)
    setIsLoading(false)
  }, [])

  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(numPages, p + 1))

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">Source Paper</h2>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-4 px-2">
        {isLoading && !loadError && (
          <div className="flex items-center justify-center h-40 text-muted text-sm">
            Loading PDF...
          </div>
        )}
        {loadError && (
          <div className="flex items-center justify-center h-40 text-red-500 text-sm text-center px-4">
            Failed to load PDF: {loadError}
          </div>
        )}
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={currentPage}
            width={280}
            renderAnnotationLayer={false}
            renderTextLayer={true}
            loading={
              <div className="w-[280px] h-[360px] bg-gray-100 animate-pulse rounded" />
            }
          />
        </Document>
      </div>

      {/* Navigation */}
      {numPages > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 shrink-0 flex items-center justify-between">
          <button
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-muted font-medium">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
