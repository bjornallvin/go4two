'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Game, Move, PlayerColor } from '@/lib/types'

interface UseGameResult {
  game: Game | null
  moves: Move[]
  playerColor: PlayerColor | null
  isMyTurn: boolean
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setGameState: (game: Game, moves: Move[]) => void
  addOptimisticMove: (x: number, y: number, color: PlayerColor) => void
  removeOptimisticMove: (x: number, y: number) => void
}

export function useGame(code: string, playerId: string | null): UseGameResult {
  const [game, setGame] = useState<Game | null>(null)
  const [moves, setMoves] = useState<Move[]>([])
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const updatePlayerColor = useCallback((game: Game | null, playerId: string | null) => {
    if (!game || !playerId) {
      setPlayerColor(null)
      return
    }
    if (game.black_player_id === playerId) {
      setPlayerColor('black')
    } else if (game.white_player_id === playerId) {
      setPlayerColor('white')
    } else {
      setPlayerColor(null)
    }
  }, [])

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${code}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      setGame(data.game)
      setMoves(data.moves || [])
      updatePlayerColor(data.game, playerId)
      setLoading(false)
      setError(null)
    } catch (e) {
      setError('Failed to fetch game')
      setLoading(false)
    }
  }, [code, playerId, updatePlayerColor])

  // Initial fetch
  useEffect(() => {
    if (playerId) {
      fetchGame()
    }
  }, [fetchGame, playerId])

  // Update player color when game or playerId changes
  useEffect(() => {
    updatePlayerColor(game, playerId)
  }, [game, playerId, updatePlayerColor])

  // Function to update game state from PartySocket
  const setGameState = useCallback((newGame: Game, newMoves: Move[]) => {
    setGame(newGame)
    setMoves(newMoves)
    updatePlayerColor(newGame, playerId)
  }, [playerId, updatePlayerColor])

  // Optimistic move - immediately add stone to board
  const addOptimisticMove = useCallback((x: number, y: number, color: PlayerColor) => {
    const optimisticMove: Move = {
      id: `optimistic-${Date.now()}`,
      game_id: game?.id || '',
      player_color: color,
      move_type: 'place',
      x,
      y,
      move_number: moves.length + 1,
      created_at: new Date().toISOString(),
    }
    setMoves(prev => [...prev, optimisticMove])
    // Also toggle turn optimistically
    if (game) {
      setGame(prev => prev ? {
        ...prev,
        current_turn: prev.current_turn === 'black' ? 'white' : 'black'
      } : null)
    }
  }, [game, moves.length])

  // Remove optimistic move if API call fails
  const removeOptimisticMove = useCallback((x: number, y: number) => {
    setMoves(prev => prev.filter(m => !(m.x === x && m.y === y && m.id.startsWith('optimistic'))))
    // Revert turn
    if (game) {
      setGame(prev => prev ? {
        ...prev,
        current_turn: prev.current_turn === 'black' ? 'white' : 'black'
      } : null)
    }
  }, [game])

  const isMyTurn = game?.status === 'active' && game?.current_turn === playerColor

  return {
    game,
    moves,
    playerColor,
    isMyTurn,
    loading,
    error,
    refetch: fetchGame,
    setGameState,
    addOptimisticMove,
    removeOptimisticMove,
  }
}
