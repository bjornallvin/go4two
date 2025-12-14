'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Stone } from './Stone'
import type { GameHistoryEntry } from '@/lib/hooks/useGameHistory'

interface GameHistoryProps {
  games: GameHistoryEntry[]
  onRemove: (code: string) => void
  onClearAll: () => void
  onRefresh: (code: string, status: GameHistoryEntry['status'], playerColor?: 'black' | 'white' | null) => void
}

export function GameHistory({ games, onRemove, onClearAll, onRefresh }: GameHistoryProps) {
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set())

  // Refresh game statuses on mount
  useEffect(() => {
    const refreshGames = async () => {
      for (const game of games) {
        if (game.status !== 'finished') {
          try {
            const res = await fetch(`/api/games/${game.code}`)
            const data = await res.json()
            if (data.error) {
              // Game not found, could remove or mark as stale
              continue
            }
            if (data.game) {
              const playerColor = data.game.black_player_id === localStorage.getItem('go4two_player_id')
                ? 'black'
                : data.game.white_player_id === localStorage.getItem('go4two_player_id')
                  ? 'white'
                  : null
              onRefresh(game.code, data.game.status, playerColor)
            }
          } catch {
            // Ignore errors
          }
        }
      }
    }

    if (games.length > 0) {
      refreshGames()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (games.length === 0) {
    return null
  }

  const formatRelativeTime = (timestamp: number) => {
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: GameHistoryEntry['status']) => {
    switch (status) {
      case 'waiting':
        return <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">Waiting</span>
      case 'active':
        return <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">In Progress</span>
      case 'finished':
        return <span className="text-xs px-2 py-0.5 bg-stone-500/20 text-stone-400 rounded-full">Finished</span>
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-stone-400 text-sm font-medium">Your Games</h2>
        <button
          onClick={onClearAll}
          className="text-stone-500 hover:text-red-400 text-xs transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-2">
        {games.map((game) => (
          <div
            key={game.code}
            className="flex items-center bg-stone-800/50 border border-stone-700/50 rounded-xl p-3 hover:bg-stone-800/70 transition-colors group"
          >
            <Link href={`/game/${game.code}`} className="flex items-center gap-3 flex-1 min-w-0">
              {/* Player color indicator */}
              <div className="flex-shrink-0">
                {game.playerColor ? (
                  <Stone color={game.playerColor} size={24} />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center">
                    <span className="text-stone-500 text-xs">?</span>
                  </div>
                )}
              </div>

              {/* Game info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-stone-200 font-medium">{game.boardSize}×{game.boardSize}</span>
                  {getStatusBadge(game.status)}
                </div>
                <div className="text-stone-500 text-xs mt-0.5 flex flex-wrap gap-x-2">
                  <span title={`Created: ${formatDate(game.createdAt)}`}>
                    Created {formatRelativeTime(game.createdAt)}
                  </span>
                  {game.lastPlayedAt !== game.createdAt && (
                    <span title={`Last played: ${formatDate(game.lastPlayedAt)}`}>
                      • Played {formatRelativeTime(game.lastPlayedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Game code */}
              <div className="text-stone-500 text-xs font-mono hidden sm:block">
                {game.code}
              </div>
            </Link>

            {/* Remove button */}
            <button
              onClick={() => onRemove(game.code)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 transition-all p-2 ml-1"
              title="Remove from history"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
