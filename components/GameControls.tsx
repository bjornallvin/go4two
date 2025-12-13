'use client'

import { useState } from 'react'

interface GameControlsProps {
  gameCode: string
  playerId: string
  isMyTurn: boolean
  isActive: boolean
  onPass: () => void
  onResign: () => void
}

export function GameControls({
  gameCode,
  playerId,
  isMyTurn,
  isActive,
  onPass,
  onResign,
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
    <div className="flex gap-2">
      <button
        onClick={onPass}
        disabled={!isMyTurn}
        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 disabled:bg-stone-800 disabled:text-stone-600 text-stone-100 rounded transition-colors"
      >
        Pass
      </button>
      <button
        onClick={handleResignClick}
        className={`px-4 py-2 rounded transition-colors ${
          confirmResign
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-stone-700 hover:bg-stone-600 text-stone-100'
        }`}
      >
        {confirmResign ? 'Confirm Resign' : 'Resign'}
      </button>
    </div>
  )
}
