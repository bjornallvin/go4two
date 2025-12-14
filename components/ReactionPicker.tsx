'use client'

import { useState, useEffect, useRef } from 'react'

const REACTIONS = ['👍', '😊', '🤔', '😮', '👏', '🔥']

const EXTRA_REACTIONS = [
  '😂', '🥲', '😍', '🥳', '😎', '🤩', '😤',
  '😱', '🤯', '😴', '🙄', '😏', '🤭', '😬',
  '😅', '🫡', '🤝', '💪', '👀', '💀', '🎉',
  '✨', '💯', '🏆', '❤️', '💔', '😢', '😭',
  '🙏', '👋', '🤷', '🫠', '😈', '👻', '🤖',
  '🥰', '😘',
]

interface ReactionPickerProps {
  onReaction: (emoji: string) => void
  disabled?: boolean
}

export function ReactionPicker({ onReaction, disabled }: ReactionPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  const handleReaction = (emoji: string) => {
    onReaction(emoji)
    setIsExpanded(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1 bg-stone-800/30 px-3 py-2 rounded-xl border border-stone-700/30">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={disabled}
            className={`text-2xl p-1.5 rounded-lg transition-all ${
              disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-stone-700/50 hover:scale-110 active:scale-95'
            }`}
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={`p-1.5 rounded-lg transition-all ml-1 ${
            disabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-stone-700/50'
          } ${isExpanded ? 'bg-stone-700/50' : ''}`}
          title="More reactions"
        >
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown grid */}
      {isExpanded && !disabled && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-stone-800 border border-stone-700 rounded-xl p-3 shadow-xl z-30">
          <div className="grid grid-cols-7 gap-1">
            {EXTRA_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-2xl p-1.5 rounded-lg hover:bg-stone-700/50 hover:scale-110 active:scale-95 transition-all"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
