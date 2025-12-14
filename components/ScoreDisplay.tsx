'use client'

import { Stone } from './Stone'
import type { PlayerColor } from '@/lib/types'

interface ScoreData {
  black: {
    territory: number
    captures: number
    total: number
  }
  white: {
    territory: number
    captures: number
    total: number
  }
  winner: PlayerColor | 'tie' | null
}

interface ScoreDisplayProps {
  score: ScoreData
  playerColor?: PlayerColor | null
}

export function ScoreDisplay({ score, playerColor }: ScoreDisplayProps) {
  const isWinner = (color: PlayerColor) => score.winner === color
  const youWon = playerColor && score.winner === playerColor
  const youLost = playerColor && score.winner && score.winner !== 'tie' && score.winner !== playerColor

  return (
    <div className="bg-stone-800/50 rounded-2xl p-6 border border-stone-700/50">
      {/* Winner announcement */}
      <div className="text-center mb-6">
        {score.winner === 'tie' ? (
          <p className="text-2xl font-bold text-amber-400">It's a tie!</p>
        ) : youWon ? (
          <p className="text-2xl font-bold text-green-400">You won!</p>
        ) : youLost ? (
          <p className="text-2xl font-bold text-red-400">You lost</p>
        ) : (
          <p className="text-2xl font-bold text-amber-400">
            {score.winner === 'black' ? 'Black' : 'White'} wins!
          </p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Black score */}
        <div
          className={`p-4 rounded-xl ${
            isWinner('black') ? 'bg-stone-700/50 ring-2 ring-amber-500/50' : 'bg-stone-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Stone color="black" size={24} />
            <span className="font-semibold text-stone-200">Black</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-stone-400">
              <span>Territory</span>
              <span className="text-stone-200">{score.black.territory}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Captures</span>
              <span className="text-stone-200">{score.black.captures}</span>
            </div>
            <div className="flex justify-between font-semibold text-stone-200 pt-2 border-t border-stone-700">
              <span>Total</span>
              <span>{score.black.total}</span>
            </div>
          </div>
        </div>

        {/* White score */}
        <div
          className={`p-4 rounded-xl ${
            isWinner('white') ? 'bg-stone-700/50 ring-2 ring-amber-500/50' : 'bg-stone-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Stone color="white" size={24} />
            <span className="font-semibold text-stone-200">White</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-stone-400">
              <span>Territory</span>
              <span className="text-stone-200">{score.white.territory}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Captures</span>
              <span className="text-stone-200">{score.white.captures}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Komi</span>
              <span className="text-stone-200">6.5</span>
            </div>
            <div className="flex justify-between font-semibold text-stone-200 pt-2 border-t border-stone-700">
              <span>Total</span>
              <span>{score.white.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
