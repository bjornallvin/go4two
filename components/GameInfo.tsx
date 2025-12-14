'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Game, PlayerColor } from '@/lib/types'
import { Stone } from './Stone'

interface TerritoryData {
  black: { territory: number; captures: number; total: number }
  white: { territory: number; captures: number; total: number }
  winner: PlayerColor | 'tie' | null
}

interface GameInfoProps {
  game: Game
  playerColor: PlayerColor | null
  isMyTurn: boolean
  territoryData?: TerritoryData | null
}

function ScoreTooltip({ color, data, show, anchorRef, onMouseEnter, onMouseLeave }: { color: 'black' | 'white'; data: { territory: number; captures: number; total: number }; show: boolean; anchorRef: React.RefObject<HTMLButtonElement | null>; onMouseEnter: () => void; onMouseLeave: () => void }) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      })
    }
  }, [show, anchorRef])

  if (!show || !mounted) return null

  return createPortal(
    <div
      className="fixed z-[9999] w-48 p-3 bg-stone-900 border border-stone-700 rounded-xl shadow-xl text-xs -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Arrow */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-stone-900" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-stone-400">Territory</span>
          <span className="text-stone-200 font-medium">{data.territory}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-400">Captures</span>
          <span className="text-stone-200 font-medium">{data.captures}</span>
        </div>
        {color === 'white' && (
          <div className="flex justify-between">
            <span className="text-stone-400">Komi</span>
            <span className="text-stone-200 font-medium">6.5</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-stone-700">
          <span className="text-stone-300 font-medium">Total</span>
          <span className="text-stone-100 font-bold">{data.total}</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-stone-700 text-stone-500 space-y-1">
        <p><span className="text-stone-400">Territory:</span> Empty points you control</p>
        <p><span className="text-stone-400">Captures:</span> Opponent stones removed</p>
        {color === 'white' && (
          <p><span className="text-stone-400">Komi:</span> Compensation for black playing first</p>
        )}
      </div>
    </div>,
    document.body
  )
}

export function GameInfo({ game, playerColor, isMyTurn, territoryData }: GameInfoProps) {
  const [showBlackTooltip, setShowBlackTooltip] = useState(false)
  const [showWhiteTooltip, setShowWhiteTooltip] = useState(false)
  const blackButtonRef = useRef<HTMLButtonElement>(null)
  const whiteButtonRef = useRef<HTMLButtonElement>(null)
  const blackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const whiteTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleBlackEnter = () => {
    if (blackTimeoutRef.current) clearTimeout(blackTimeoutRef.current)
    setShowBlackTooltip(true)
  }

  const handleBlackLeave = () => {
    blackTimeoutRef.current = setTimeout(() => setShowBlackTooltip(false), 150)
  }

  const handleWhiteEnter = () => {
    if (whiteTimeoutRef.current) clearTimeout(whiteTimeoutRef.current)
    setShowWhiteTooltip(true)
  }

  const handleWhiteLeave = () => {
    whiteTimeoutRef.current = setTimeout(() => setShowWhiteTooltip(false), 150)
  }

  return (
    <div className="bg-stone-800/50 backdrop-blur rounded-2xl p-5 border border-stone-700/50 shadow-lg overflow-visible">
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

      </div>

      {/* Score display */}
      {game.status !== 'waiting' && territoryData && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 overflow-visible">
          <button
            ref={blackButtonRef}
            onMouseEnter={handleBlackEnter}
            onMouseLeave={handleBlackLeave}
            onClick={() => setShowBlackTooltip(!showBlackTooltip)}
            className="relative flex items-center gap-2 text-stone-300 hover:text-stone-100 transition-colors"
          >
            <Stone color="black" size={18} />
            <span className="font-bold">{territoryData.black.total}</span>
            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <ScoreTooltip color="black" data={territoryData.black} show={showBlackTooltip} anchorRef={blackButtonRef} onMouseEnter={handleBlackEnter} onMouseLeave={handleBlackLeave} />
          <div className="w-px h-4 bg-stone-600" />
          <button
            ref={whiteButtonRef}
            onMouseEnter={handleWhiteEnter}
            onMouseLeave={handleWhiteLeave}
            onClick={() => setShowWhiteTooltip(!showWhiteTooltip)}
            className="relative flex items-center gap-2 text-stone-300 hover:text-stone-100 transition-colors"
          >
            <Stone color="white" size={18} />
            <span className="font-bold">{territoryData.white.total}</span>
            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <ScoreTooltip color="white" data={territoryData.white} show={showWhiteTooltip} anchorRef={whiteButtonRef} onMouseEnter={handleWhiteEnter} onMouseLeave={handleWhiteLeave} />
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
