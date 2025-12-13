'use client'

import type { PlayerColor } from '@/lib/types'

interface StoneProps {
  color: PlayerColor
  size?: number
  className?: string
  isGhost?: boolean
}

export function Stone({ color, size = 32, className = '', isGhost = false }: StoneProps) {
  const baseClasses = 'rounded-full'
  const colorClasses = color === 'black'
    ? 'bg-gradient-to-br from-gray-700 via-gray-900 to-black shadow-lg'
    : 'bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-lg border border-gray-300'

  const ghostOpacity = isGhost ? 'opacity-50' : ''

  return (
    <div
      className={`${baseClasses} ${colorClasses} ${ghostOpacity} ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: isGhost ? 'none' : '2px 2px 4px rgba(0,0,0,0.3)',
      }}
    />
  )
}
