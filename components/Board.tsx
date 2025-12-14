'use client'

import { useMemo } from 'react'
import { Stone } from './Stone'
import { TerritoryOverlay } from './TerritoryOverlay'
import { movesToBoardState } from '@/lib/types'
import type { Move, PlayerColor } from '@/lib/types'

interface BoardProps {
  size: number
  moves: Move[]
  lastMove?: Move | null
  myLastMove?: { x: number; y: number } | null
  ghostPosition?: { x: number; y: number; color: PlayerColor } | null
  onIntersectionClick?: (x: number, y: number) => void
  playerColor?: PlayerColor | null
  recentCaptures?: { x: number; y: number; color: PlayerColor }[]
  territories?: { x: number; y: number; color: PlayerColor }[]
  territoryFading?: boolean
}

// Star point (hoshi) positions for different board sizes
const STAR_POINTS: Record<number, [number, number][]> = {
  9: [
    [2, 2], [2, 6], [4, 4], [6, 2], [6, 6],
  ],
  13: [
    [3, 3], [3, 9], [6, 6], [9, 3], [9, 9],
  ],
  19: [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15],
  ],
}

export function Board({ size, moves, lastMove, myLastMove, ghostPosition, onIntersectionClick, playerColor, recentCaptures = [], territories = [], territoryFading = false }: BoardProps) {
  // Build board state from moves (handles captures)
  const boardState = useMemo(() => movesToBoardState(moves), [moves])

  const starPoints = STAR_POINTS[size] || []

  // Calculate cell size based on board size
  const cellSize = size === 19 ? 28 : size === 13 ? 36 : 44
  const boardPx = cellSize * (size - 1)
  const padding = cellSize

  return (
    <div
      className="relative bg-amber-200 rounded-lg shadow-xl"
      style={{
        width: boardPx + padding * 2,
        height: boardPx + padding * 2,
        backgroundImage: 'linear-gradient(135deg, #deb887 0%, #d2a679 50%, #c49a6c 100%)',
      }}
    >
      {/* Grid container */}
      <div
        className="absolute"
        style={{
          top: padding,
          left: padding,
          width: boardPx,
          height: boardPx,
        }}
      >
        {/* Horizontal lines */}
        {Array.from({ length: size }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute bg-black"
            style={{
              left: 0,
              top: i * cellSize,
              width: boardPx,
              height: 1,
            }}
          />
        ))}

        {/* Vertical lines */}
        {Array.from({ length: size }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute bg-black"
            style={{
              top: 0,
              left: i * cellSize,
              width: 1,
              height: boardPx,
            }}
          />
        ))}

        {/* Star points */}
        {starPoints.map(([x, y]) => (
          <div
            key={`star-${x}-${y}`}
            className="absolute bg-black rounded-full"
            style={{
              left: x * cellSize - 4,
              top: y * cellSize - 4,
              width: 8,
              height: 8,
            }}
          />
        ))}

        {/* Clickable intersections */}
        {Array.from({ length: size }).map((_, y) =>
          Array.from({ length: size }).map((_, x) => {
            const hasStone = boardState.has(`${x},${y}`)
            const isLastMove = lastMove?.x === x && lastMove?.y === y && lastMove?.move_type === 'place'
            const isMyLastMove = myLastMove?.x === x && myLastMove?.y === y && hasStone && !isLastMove
            const isOpponentLastMove = isLastMove && playerColor && lastMove?.player_color !== playerColor

            return (
              <div
                key={`int-${x}-${y}`}
                className={`absolute cursor-pointer ${!hasStone ? 'hover:bg-black/10' : ''}`}
                style={{
                  left: x * cellSize - cellSize / 2,
                  top: y * cellSize - cellSize / 2,
                  width: cellSize,
                  height: cellSize,
                }}
                onClick={() => !hasStone && onIntersectionClick?.(x, y)}
              >
                {/* Stone at this position */}
                {boardState.has(`${x},${y}`) && (
                  <div className={`absolute inset-0 flex items-center justify-center ${isOpponentLastMove ? 'animate-stone-in' : ''}`}>
                    <Stone
                      color={boardState.get(`${x},${y}`)!}
                      size={cellSize - 4}
                    />
                    {isLastMove && (
                      <div
                        className="absolute rounded-full border-2"
                        style={{
                          width: cellSize / 3,
                          height: cellSize / 3,
                          borderColor: boardState.get(`${x},${y}`) === 'black' ? 'white' : 'black',
                        }}
                      />
                    )}
                    {isMyLastMove && (
                      <div
                        className="absolute rounded-full border-2 border-amber-400 animate-pulse"
                        style={{
                          width: cellSize / 2.5,
                          height: cellSize / 2.5,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Ghost stone for drag preview */}
        {ghostPosition && !boardState.has(`${ghostPosition.x},${ghostPosition.y}`) && (
          <div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: ghostPosition.x * cellSize - cellSize / 2,
              top: ghostPosition.y * cellSize - cellSize / 2,
              width: cellSize,
              height: cellSize,
            }}
          >
            <Stone
              color={ghostPosition.color}
              size={cellSize - 4}
              isGhost
            />
          </div>
        )}

        {/* Captured stones fading out */}
        {recentCaptures.map((capture, i) => (
          <div
            key={`capture-${capture.x}-${capture.y}-${i}`}
            className="absolute pointer-events-none flex items-center justify-center animate-stone-out"
            style={{
              left: capture.x * cellSize - cellSize / 2,
              top: capture.y * cellSize - cellSize / 2,
              width: cellSize,
              height: cellSize,
            }}
          >
            <Stone
              color={capture.color}
              size={cellSize - 4}
            />
          </div>
        ))}

        {/* Territory overlay */}
        {territories.length > 0 && (
          <TerritoryOverlay
            territories={territories}
            cellSize={cellSize}
            fading={territoryFading}
          />
        )}
      </div>
    </div>
  )
}
