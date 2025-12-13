'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePlayerId } from '@/lib/hooks/usePlayerId'
import { useGame } from '@/lib/hooks/useGame'
import { usePartySocket } from '@/lib/hooks/usePartySocket'
import { DroppableBoard } from '@/components/DroppableBoard'
import { GameInfo } from '@/components/GameInfo'
import { GameControls } from '@/components/GameControls'
import { ShareLink } from '@/components/ShareLink'
import type { Game, Move } from '@/lib/types'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const playerId = usePlayerId()

  const { game, moves, playerColor, isMyTurn, loading, error, refetch, setGameState, addOptimisticMove, removeOptimisticMove } = useGame(
    code,
    playerId
  )

  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)

  // Handle game updates from PartySocket
  const handleGameUpdate = useCallback(
    (newGame: unknown, newMoves: unknown[]) => {
      setGameState(newGame as Game, newMoves as Move[])
    },
    [setGameState]
  )

  // PartySocket for real-time cursor and game updates
  const { connected, opponentCursor, sendCursor, sendGameUpdate } = usePartySocket({
    gameCode: code,
    playerId,
    onGameUpdate: handleGameUpdate,
  })

  // Auto-join game when playerId is available
  useEffect(() => {
    if (!playerId || joined || joining) return

    const doJoin = async () => {
      setJoining(true)
      try {
        const res = await fetch(`/api/games/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        })
        const data = await res.json()
        if (data.error) {
          console.error('Join error:', data.error)
        } else if (data.game) {
          // Fetch full game state and broadcast to other players
          const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
          if (updated.game) {
            setGameState(updated.game, updated.moves)
            sendGameUpdate(updated.game, updated.moves)
          }
        }
        setJoined(true)
      } catch (e) {
        console.error('Failed to join:', e)
      } finally {
        setJoining(false)
      }
    }

    doJoin()
  }, [playerId, code, joined, joining, setGameState, sendGameUpdate])

  const handleMove = async (x: number, y: number) => {
    if (!playerId || !game || !playerColor) return

    setMoveError(null)

    // Optimistic update - immediately show the stone
    addOptimisticMove(x, y, playerColor)

    try {
      const res = await fetch(`/api/games/${code}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, x, y }),
      })
      const data = await res.json()
      if (data.error) {
        // Rollback optimistic update
        removeOptimisticMove(x, y)
        setMoveError(data.error)
        setTimeout(() => setMoveError(null), 3000)
      } else {
        // Fetch actual state and broadcast update
        const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
        if (updated.game) {
          setGameState(updated.game, updated.moves)
          sendGameUpdate(updated.game, updated.moves)
        }
      }
    } catch (e) {
      // Rollback optimistic update
      removeOptimisticMove(x, y)
      setMoveError('Failed to make move')
      setTimeout(() => setMoveError(null), 3000)
    }
  }

  const handleCursorMove = useCallback(
    (x: number, y: number, isDragging: boolean) => {
      if (playerColor) {
        sendCursor(x, y, playerColor, isDragging)
      }
    },
    [playerColor, sendCursor]
  )

  const handlePass = async () => {
    if (!playerId || !game) return

    try {
      await fetch(`/api/games/${code}/pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
      // Refetch and broadcast
      const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
      if (updated.game) {
        setGameState(updated.game, updated.moves)
        sendGameUpdate(updated.game, updated.moves)
      }
    } catch (e) {
      console.error('Failed to pass:', e)
    }
  }

  const handleResign = async () => {
    if (!playerId || !game) return

    try {
      await fetch(`/api/games/${code}/resign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
      // Refetch and broadcast
      const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
      if (updated.game) {
        setGameState(updated.game, updated.moves)
        sendGameUpdate(updated.game, updated.moves)
      }
    } catch (e) {
      console.error('Failed to resign:', e)
    }
  }

  if (loading || !playerId) {
    return (
      <main className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </main>
    )
  }

  if (error || !game) {
    return (
      <main className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error || 'Game not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded"
          >
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            &larr; Back
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-stone-100">Go4Two</h1>
            {connected && (
              <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
            )}
          </div>
          <div className="w-16" />
        </div>

        {/* Game info */}
        <GameInfo game={game} playerColor={playerColor} isMyTurn={isMyTurn} />

        {/* Share link (when waiting) */}
        {game.status === 'waiting' && <ShareLink gameCode={code} />}

        {/* Error message */}
        {moveError && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-2 rounded">
            {moveError}
          </div>
        )}

        {/* Board */}
        <div className="flex justify-center">
          <DroppableBoard
            size={game.board_size}
            moves={moves}
            playerColor={playerColor}
            isMyTurn={isMyTurn}
            opponentCursor={opponentCursor}
            onMove={handleMove}
            onCursorMove={handleCursorMove}
          />
        </div>

        {/* Controls */}
        {playerColor && (
          <div className="flex justify-center">
            <GameControls
              gameCode={code}
              playerId={playerId}
              isMyTurn={isMyTurn}
              isActive={game.status === 'active'}
              onPass={handlePass}
              onResign={handleResign}
            />
          </div>
        )}

        {/* Game finished message */}
        {game.status === 'finished' && (
          <div className="text-center space-y-4">
            <p className="text-amber-400 text-lg">Game Over</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded"
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
