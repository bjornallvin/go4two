'use client'

import { useEffect, useState } from 'react'
import type { ActiveReaction } from '@/lib/hooks/usePartySocket'

interface ReactionOverlayProps {
  reaction: ActiveReaction | null
  onComplete: () => void
}

export function ReactionOverlay({ reaction, onComplete }: ReactionOverlayProps) {
  const [key, setKey] = useState(0)

  // Reset animation when reaction changes
  useEffect(() => {
    if (reaction) {
      setKey((k) => k + 1)
      // Clear after animation completes
      const timer = setTimeout(onComplete, 3500)
      return () => clearTimeout(timer)
    }
  }, [reaction, onComplete])

  if (!reaction) return null

  return (
    <div
      key={key}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
    >
      <span className="animate-reaction text-[min(50vw,200px)] leading-none select-none">
        {reaction.emoji}
      </span>
    </div>
  )
}
