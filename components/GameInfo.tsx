'use client'

import { useMemo } from 'react'
import type { Game, Move, PlayerColor } from '@/lib/types'
import { Stone } from './Stone'

interface GameInfoProps {
  game: Game
  moves: Move[]
  playerColor: PlayerColor | null
  isMyTurn: boolean
}

export function GameInfo({ game, moves, playerColor, isMyTurn }: GameInfoProps) {
  // Calculate captured stones
  const captures = useMemo(() => {
    let black = 0 // Stones captured BY black (white stones removed)
    let white = 0 // Stones captured BY white (black stones removed)
    for (const move of moves) {
      if (move.move_type === 'captured') {
        if (move.player_color === 'white') {
          black++ // White stone was captured (by black)
        } else {
          white++ // Black stone was captured (by white)
        }
      }
    }
    return { black, white }
  }, [moves])

  return (
    <div className="bg-stone-800/50 backdrop-blur rounded-2xl p-5 border border-stone-700/50 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Player info */}
        <div className="flex items-center gap-3">
          {playerColor ? (
            <div className="flex items-center gap-3">
              <Stone color={playerColor} size={28} />
              <div>
                <p className="text-stone-400 text-xs">Playing as</p>
                <p className="text-stone-100 font-semibold capitalize">{playerColor}</p>
              </div>
            </div>
          ) : (
            <span className="text-stone-500">Watching the game</span>
          )}
        </div>

        {/* Turn indicator */}
        {game.status === 'active' && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
            isMyTurn
              ? 'bg-amber-500/20 border border-amber-500/30'
              : 'bg-stone-700/30 border border-stone-600/30'
          }`}>
            <Stone color={game.current_turn} size={24} />
            <div>
              <p className={`text-xs ${isMyTurn ? 'text-amber-400' : 'text-stone-500'}`}>
                {isMyTurn ? 'Your move!' : 'Waiting...'}
              </p>
              <p className={`font-semibold capitalize ${isMyTurn ? 'text-amber-300' : 'text-stone-400'}`}>
                {game.current_turn}
              </p>
            </div>
          </div>
        )}

        {/* Board size badge */}
        <div className="text-stone-500 text-sm bg-stone-700/30 px-3 py-1 rounded-lg">
          {game.board_size}×{game.board_size}
        </div>
      </div>

      {/* Captures display */}
      {game.status !== 'waiting' && (
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-stone-300">
            <Stone color="black" size={18} />
            <span className="text-sm">captures:</span>
            <span className="font-semibold">{captures.black}</span>
          </div>
          <div className="w-px h-4 bg-stone-600" />
          <div className="flex items-center gap-2 text-stone-300">
            <Stone color="white" size={18} />
            <span className="text-sm">captures:</span>
            <span className="font-semibold">{captures.white}</span>
          </div>
        </div>
      )}

      {/* Game status messages */}
      {game.status === 'waiting' && (
        <div className="mt-4 text-center">
          <p className="text-amber-400 font-medium animate-pulse">
            Waiting for your friend to join...
          </p>
        </div>
      )}
    </div>
  )
}
