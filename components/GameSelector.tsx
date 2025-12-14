'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stone } from './Stone'
import type { GameHistoryEntry } from '@/lib/hooks/useGameHistory'

interface GameSelectorProps {
  currentCode: string
  games: GameHistoryEntry[]
}

export function GameSelector({ currentCode, games }: GameSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Filter out current game and only show active/waiting games
  const otherGames = games.filter(
    (g) => g.code !== currentCode && g.status !== 'finished'
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (otherGames.length === 0) {
    return null
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-stone-400 hover:text-amber-400 transition-colors p-2"
        title="Switch game"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
          {otherGames.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900 border border-stone-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-stone-700">
            <span className="text-xs text-stone-500 font-medium">Switch to another game</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {otherGames.map((game) => (
              <button
                key={game.code}
                onClick={() => {
                  setIsOpen(false)
                  router.push(`/game/${game.code}`)
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-stone-800 transition-colors text-left"
              >
                {game.playerColor ? (
                  <Stone color={game.playerColor} size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-stone-700" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-200 text-sm font-medium">
                      {game.boardSize}×{game.boardSize}
                    </span>
                    {game.status === 'waiting' && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                        Waiting
                      </span>
                    )}
                  </div>
                  <span className="text-stone-500 text-xs">
                    {formatTime(game.lastPlayedAt)}
                  </span>
                </div>
                <span className="text-stone-600 text-xs font-mono">
                  {game.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
