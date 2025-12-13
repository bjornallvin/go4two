'use client'

import type { Game, PlayerColor } from '@/lib/types'
import { Stone } from './Stone'

interface GameInfoProps {
  game: Game
  playerColor: PlayerColor | null
  isMyTurn: boolean
}

export function GameInfo({ game, playerColor, isMyTurn }: GameInfoProps) {
  return (
    <div className="bg-stone-800 rounded-lg p-4 space-y-3">
      {/* Player info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-sm">You are:</span>
          {playerColor ? (
            <div className="flex items-center gap-2">
              <Stone color={playerColor} size={20} />
              <span className="text-stone-100 font-medium capitalize">{playerColor}</span>
            </div>
          ) : (
            <span className="text-stone-500">Spectating</span>
          )}
        </div>
        <div className="text-stone-500 text-sm">
          {game.board_size}×{game.board_size}
        </div>
      </div>

      {/* Turn indicator */}
      <div className="flex items-center gap-2">
        <span className="text-stone-400 text-sm">Turn:</span>
        <div className="flex items-center gap-2">
          <Stone color={game.current_turn} size={20} />
          <span className={`font-medium capitalize ${isMyTurn ? 'text-amber-400' : 'text-stone-300'}`}>
            {game.current_turn}
            {isMyTurn && ' (Your turn)'}
          </span>
        </div>
      </div>

      {/* Game status */}
      {game.status !== 'active' && (
        <div className={`text-sm font-medium ${
          game.status === 'waiting' ? 'text-amber-400' : 'text-stone-400'
        }`}>
          {game.status === 'waiting' && 'Waiting for opponent...'}
          {game.status === 'finished' && 'Game finished'}
        </div>
      )}
    </div>
  )
}
