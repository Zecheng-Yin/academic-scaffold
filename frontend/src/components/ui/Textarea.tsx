'use client'

import React, { useRef, useEffect, useId } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  showCharCount?: boolean
  maxLength?: number
}

export default function Textarea({
  label,
  showCharCount = false,
  maxLength,
  value,
  onChange,
  className,
  ...props
}: TextareaProps) {
  const id = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize on content change
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const charCount = typeof value === 'string' ? value.length : 0

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        rows={4}
        className={cn(
          'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400 resize-none overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'transition-shadow duration-150',
          className
        )}
        {...props}
      />
      {showCharCount && (
        <div className="flex justify-end">
          <span
            className={cn(
              'text-xs',
              maxLength && charCount > maxLength * 0.9
                ? 'text-warning'
                : 'text-muted'
            )}
          >
            {charCount}
            {maxLength ? ` / ${maxLength}` : ''} characters
          </span>
        </div>
      )}
    </div>
  )
}
