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
