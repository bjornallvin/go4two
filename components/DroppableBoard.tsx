'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Board } from './Board'
import { Stone } from './Stone'
import { movesToBoardState } from '@/lib/types'
import type { Move, PlayerColor } from '@/lib/types'
import type { CursorPosition } from '@/lib/hooks/usePartySocket'

interface DroppableBoardProps {
  size: number
  moves: Move[]
  playerColor: PlayerColor | null
  isMyTurn: boolean
  myLastMove?: { x: number; y: number } | null
  opponentCursor: CursorPosition | null
  onMove: (x: number, y: number) => void
  onCursorMove: (x: number, y: number, isDragging: boolean) => void
  overlay?: React.ReactNode
  recentCaptures?: { x: number; y: number; color: PlayerColor }[]
  territories?: { x: number; y: number; color: PlayerColor }[]
  territoryFading?: boolean
  gameFinished?: boolean
  gameWaiting?: boolean
}

const SNAP_THRESHOLD = 0.4 // Snap when within 40% of cell size

export function DroppableBoard({
  size,
  moves,
  playerColor,
  isMyTurn,
  myLastMove,
  opponentCursor,
  onMove,
  onCursorMove,
  overlay,
  recentCaptures = [],
  territories = [],
  territoryFading = false,
  gameFinished = false,
  gameWaiting = false,
}: DroppableBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<{ boardX: number; boardY: number } | null>(null)
  const [snapPosition, setSnapPosition] = useState<{ x: number; y: number } | null>(null)
  const [scale, setScale] = useState(1)

  // Calculate cell size and padding (must match Board component)
  const cellSize = size === 19 ? 28 : size === 13 ? 36 : 44
  const padding = cellSize
  const boardPx = cellSize * (size - 1)
  const totalBoardSize = boardPx + padding * 2

  // Calculate scale based on available width
  useEffect(() => {
    const updateScale = () => {
      const maxWidth = window.innerWidth - 32 // 16px padding on each side
      const newScale = Math.min(1, maxWidth / totalBoardSize)
      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [totalBoardSize])

  // Get board-relative position from mouse/touch event
  const getBoardPosition = useCallback(
    (clientX: number, clientY: number): { boardX: number; boardY: number } | null => {
      if (!boardRef.current) return null

      const rect = boardRef.current.getBoundingClientRect()
      // Account for CSS transform scale
      const boardX = (clientX - rect.left) / scale - padding
      const boardY = (clientY - rect.top) / scale - padding

      return { boardX, boardY }
    },
    [padding, scale]
  )

  // Get intersection from board position (only if close enough)
  const getSnapIntersection = useCallback(
    (boardX: number, boardY: number): { x: number; y: number } | null => {
      const gridX = boardX / cellSize
      const gridY = boardY / cellSize

      const nearestX = Math.round(gridX)
      const nearestY = Math.round(gridY)

      // Check if within snap threshold
      const distX = Math.abs(gridX - nearestX)
      const distY = Math.abs(gridY - nearestY)

      if (distX <= SNAP_THRESHOLD && distY <= SNAP_THRESHOLD) {
        if (nearestX >= 0 && nearestX < size && nearestY >= 0 && nearestY < size) {
          return { x: nearestX, y: nearestY }
        }
      }

      return null
    },
    [cellSize, size]
  )

  // Check if position is occupied (accounts for captures)
  const isOccupied = useCallback(
    (x: number, y: number): boolean => {
      const boardState = movesToBoardState(moves)
      return boardState.has(`${x},${y}`)
    },
    [moves]
  )

  // Handle drag start FROM THE STONE SUPPLY
  const handleStonePickup = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMyTurn || !playerColor) return

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      // Start with position relative to board
      const pos = getBoardPosition(clientX, clientY)
      if (pos) {
        setDragPosition(pos)
        const snap = getSnapIntersection(pos.boardX, pos.boardY)
        setSnapPosition(snap && !isOccupied(snap.x, snap.y) ? snap : null)
        onCursorMove(pos.boardX, pos.boardY, true)
      } else {
        // If not over board yet, just start dragging
        setDragPosition({ boardX: 0, boardY: 0 })
      }
    },
    [isMyTurn, playerColor, getBoardPosition, getSnapIntersection, isOccupied, onCursorMove]
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return

      // Prevent scrolling on touch devices
      if ('touches' in e) {
        e.preventDefault()
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const pos = getBoardPosition(clientX, clientY)
      if (pos) {
        setDragPosition(pos)
        const snap = getSnapIntersection(pos.boardX, pos.boardY)
        setSnapPosition(snap && !isOccupied(snap.x, snap.y) ? snap : null)
        onCursorMove(pos.boardX, pos.boardY, true)
      } else {
        // Outside board
        setSnapPosition(null)
      }
    },
    [isDragging, getBoardPosition, getSnapIntersection, isOccupied, onCursorMove]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return

    if (snapPosition && !isOccupied(snapPosition.x, snapPosition.y)) {
      onMove(snapPosition.x, snapPosition.y)
    }

    setIsDragging(false)
    setDragPosition(null)
    setSnapPosition(null)
    onCursorMove(-1, -1, false)
  }, [isDragging, snapPosition, isOccupied, onMove, onCursorMove])

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove, { passive: false })
      window.addEventListener('touchend', handleDragEnd)

      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleDragMove)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Handle click on board (alternative to drag)
  const handleBoardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || !isMyTurn || !playerColor) return

      const pos = getBoardPosition(e.clientX, e.clientY)
      if (!pos) return

      const gridX = Math.round(pos.boardX / cellSize)
      const gridY = Math.round(pos.boardY / cellSize)

      if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
        if (!isOccupied(gridX, gridY)) {
          onMove(gridX, gridY)
        }
      }
    },
    [isDragging, isMyTurn, playerColor, getBoardPosition, cellSize, size, isOccupied, onMove]
  )

  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null

  // Convert opponent cursor position to snap position if close enough
  const opponentSnapPosition = opponentCursor?.isDragging
    ? getSnapIntersection(opponentCursor.x, opponentCursor.y)
    : null

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Board container for scaling */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: totalBoardSize * scale,
          height: totalBoardSize * scale,
        }}
      >
        {overlay}
        {/* Board wrapper */}
        <div
          ref={boardRef}
          className="relative select-none touch-none"
          style={{
            cursor: isMyTurn ? 'pointer' : 'default',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          onClick={handleBoardClick}
        >
        <Board
          size={size}
          moves={moves}
          lastMove={lastMove}
          myLastMove={myLastMove}
          ghostPosition={
            snapPosition && playerColor
              ? { x: snapPosition.x, y: snapPosition.y, color: playerColor }
              : null
          }
          playerColor={playerColor}
          recentCaptures={recentCaptures}
          territories={territories}
          territoryFading={territoryFading}
        />

        {/* Dragging stone that follows cursor */}
        {isDragging && dragPosition && playerColor && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: padding + dragPosition.boardX - (cellSize - 4) / 2,
              top: padding + dragPosition.boardY - (cellSize - 4) / 2,
            }}
          >
            <Stone color={playerColor} size={cellSize - 4} className="opacity-90 shadow-lg" />
          </div>
        )}

        {/* Opponent's cursor/dragging stone */}
        {opponentCursor?.isDragging && (
          <>
            {/* Ghost at snap position */}
            {opponentSnapPosition && !isOccupied(opponentSnapPosition.x, opponentSnapPosition.y) && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: padding + opponentSnapPosition.x * cellSize - (cellSize - 4) / 2,
                  top: padding + opponentSnapPosition.y * cellSize - (cellSize - 4) / 2,
                }}
              >
                <Stone color={opponentCursor.color} size={cellSize - 4} isGhost />
              </div>
            )}
            {/* Opponent's dragging stone following their cursor */}
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: padding + opponentCursor.x - (cellSize - 4) / 2,
                top: padding + opponentCursor.y - (cellSize - 4) / 2,
              }}
            >
              <Stone color={opponentCursor.color} size={cellSize - 4} className="opacity-70" />
            </div>
          </>
        )}
        </div>
      </div>

      {/* Stone supply - drag from here */}
      {playerColor && !gameFinished && !gameWaiting && (
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-stone-800/30 px-6 py-4 rounded-2xl border border-stone-700/30">
          <span className="text-stone-400 text-sm text-center">
            {isMyTurn ? 'Your turn — drag or tap to place' : "Your friend is thinking..."}
          </span>
          <div
            onMouseDown={handleStonePickup}
            onTouchStart={handleStonePickup}
            className={`touch-none p-2 rounded-full ${
              isMyTurn
                ? 'cursor-grab active:cursor-grabbing hover:scale-110 hover:bg-stone-700/30 transition-all'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Stone color={playerColor} size={48} />
          </div>
        </div>
      )}
    </div>
  )
}
