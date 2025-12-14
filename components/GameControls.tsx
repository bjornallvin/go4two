'use client'

import { useState } from 'react'

interface GameControlsProps {
  gameCode: string
  playerId: string
  isMyTurn: boolean
  isActive: boolean
  onPass: () => void
  onResign: () => void
  onEstimateScore?: () => void
  isEstimating?: boolean
}

export function GameControls({
  gameCode,
  playerId,
  isMyTurn,
  isActive,
  onPass,
  onResign,
  onEstimateScore,
  isEstimating = false,
}: GameControlsProps) {
  const [confirmResign, setConfirmResign] = useState(false)

  const handleResignClick = () => {
    if (confirmResign) {
      onResign()
      setConfirmResign(false)
    } else {
      setConfirmResign(true)
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmResign(false), 3000)
    }
  }

  if (!isActive) return null

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button
        onClick={onPass}
        disabled={!isMyTurn}
        className="px-6 py-3 bg-stone-700/50 hover:bg-stone-600/50 disabled:bg-stone-800/30 disabled:text-stone-600 text-stone-100 rounded-xl transition-all border border-stone-600/50 hover:border-stone-500/50 font-medium"
      >
        Pass Turn
      </button>
      {onEstimateScore && (
        <button
          onClick={onEstimateScore}
          disabled={isEstimating}
          className="px-6 py-3 bg-amber-600/50 hover:bg-amber-500/50 disabled:bg-amber-700/30 disabled:text-amber-300/50 text-stone-100 rounded-xl transition-all border border-amber-500/50 hover:border-amber-400/50 font-medium"
        >
          {isEstimating ? 'Showing...' : 'Show Territory'}
        </button>
      )}
      <button
        onClick={handleResignClick}
        className={`px-6 py-3 rounded-xl transition-all font-medium ${
          confirmResign
            ? 'bg-red-500/80 hover:bg-red-500 text-white border border-red-400/50'
            : 'bg-stone-700/50 hover:bg-stone-600/50 text-stone-300 border border-stone-600/50 hover:border-stone-500/50'
        }`}
      >
        {confirmResign ? 'Yes, Resign' : 'Resign'}
      </button>
    </div>
  )
}
