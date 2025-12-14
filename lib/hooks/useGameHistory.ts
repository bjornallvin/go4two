'use client'

import { useState, useEffect, useCallback } from 'react'

export interface GameHistoryEntry {
  code: string
  boardSize: number
  playerColor: 'black' | 'white' | null
  status: 'waiting' | 'active' | 'finished'
  createdAt: number
  lastPlayedAt: number
  isCreator: boolean
  singlePlayer?: boolean
}

const STORAGE_KEY = 'go4two_game_history'

export function useGameHistory() {
  const [games, setGames] = useState<GameHistoryEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as GameHistoryEntry[]
        // Sort by lastPlayedAt descending
        parsed.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
        setGames(parsed)
      }
    } catch (e) {
      console.error('Failed to load game history:', e)
    }
    setLoaded(true)
  }, [])

  // Save to localStorage whenever games change
  const saveGames = useCallback((newGames: GameHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGames))
      setGames(newGames)
    } catch (e) {
      console.error('Failed to save game history:', e)
    }
  }, [])

  // Add or update a game in history
  const saveGame = useCallback((entry: Omit<GameHistoryEntry, 'lastPlayedAt'> & { lastPlayedAt?: number }) => {
    setGames((current) => {
      const now = Date.now()
      const existing = current.find((g) => g.code === entry.code)

      let updated: GameHistoryEntry[]
      if (existing) {
        // Update existing entry
        updated = current.map((g) =>
          g.code === entry.code
            ? {
                ...g,
                ...entry,
                lastPlayedAt: entry.lastPlayedAt || now,
                // Keep original createdAt
                createdAt: g.createdAt,
              }
            : g
        )
      } else {
        // Add new entry
        updated = [
          {
            ...entry,
            createdAt: entry.createdAt || now,
            lastPlayedAt: entry.lastPlayedAt || now,
          } as GameHistoryEntry,
          ...current,
        ]
      }

      // Sort by lastPlayedAt descending
      updated.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)

      // Keep only last 50 games
      if (updated.length > 50) {
        updated = updated.slice(0, 50)
      }

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save game history:', e)
      }

      return updated
    })
  }, [])

  // Remove a game from history
  const removeGame = useCallback((code: string) => {
    setGames((current) => {
      const updated = current.filter((g) => g.code !== code)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save game history:', e)
      }
      return updated
    })
  }, [])

  // Update game status (useful when refreshing from API)
  const updateGameStatus = useCallback((code: string, status: GameHistoryEntry['status'], playerColor?: 'black' | 'white' | null) => {
    setGames((current) => {
      const updated = current.map((g) =>
        g.code === code
          ? {
              ...g,
              status,
              playerColor: playerColor !== undefined ? playerColor : g.playerColor,
              lastPlayedAt: Date.now(),
            }
          : g
      )
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save game history:', e)
      }
      return updated
    })
  }, [])

  // Clear all games from history
  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setGames([])
    } catch (e) {
      console.error('Failed to clear game history:', e)
    }
  }, [])

  return {
    games,
    loaded,
    saveGame,
    removeGame,
    updateGameStatus,
    clearAll,
  }
}
