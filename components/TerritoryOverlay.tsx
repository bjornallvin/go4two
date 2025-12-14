'use client'

import type { PlayerColor } from '@/lib/types'

interface TerritoryPosition {
  x: number
  y: number
  color: PlayerColor
}

interface TerritoryOverlayProps {
  territories: TerritoryPosition[]
  cellSize: number
  fading?: boolean
}

export function TerritoryOverlay({ territories, cellSize, fading = false }: TerritoryOverlayProps) {
  if (territories.length === 0) return null

  const markerSize = cellSize * 0.4

  return (
    <>
      {territories.map((territory, i) => (
        <div
          key={`territory-${territory.x}-${territory.y}-${i}`}
          className={`absolute pointer-events-none flex items-center justify-center ${
            fading ? 'animate-territory-fade' : ''
          }`}
          style={{
            left: territory.x * cellSize - cellSize / 2,
            top: territory.y * cellSize - cellSize / 2,
            width: cellSize,
            height: cellSize,
          }}
        >
          <div
            className={`rounded-sm ${
              territory.color === 'black'
                ? 'bg-gray-900/60 border border-gray-700'
                : 'bg-white/60 border border-gray-300'
            }`}
            style={{
              width: markerSize,
              height: markerSize,
            }}
          />
        </div>
      ))}
    </>
  )
}
