'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import PartySocket from 'partysocket'
import type { PlayerColor } from '@/lib/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999'

export type CursorPosition = {
  playerId: string
  x: number
  y: number
  color: PlayerColor
  isDragging: boolean
}

type PartyMessage =
  | { type: 'cursor'; playerId: string; x: number; y: number; color: PlayerColor; isDragging: boolean }
  | { type: 'game_update'; game: unknown; moves: unknown[] }
  | { type: 'player_joined'; playerId: string }
  | { type: 'player_left'; playerId: string }

interface UsePartySocketOptions {
  gameCode: string
  playerId: string | null
  onGameUpdate?: (game: unknown, moves: unknown[]) => void
}

interface UsePartySocketResult {
  connected: boolean
  opponentCursor: CursorPosition | null
  sendCursor: (x: number, y: number, color: PlayerColor, isDragging: boolean) => void
  sendGameUpdate: (game: unknown, moves: unknown[]) => void
}

export function usePartySocket({
  gameCode,
  playerId,
  onGameUpdate,
}: UsePartySocketOptions): UsePartySocketResult {
  const socketRef = useRef<PartySocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [opponentCursor, setOpponentCursor] = useState<CursorPosition | null>(null)

  useEffect(() => {
    if (!playerId || !gameCode) return

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: gameCode,
    })

    socketRef.current = socket

    socket.addEventListener('open', () => {
      setConnected(true)
      // Send join message
      socket.send(JSON.stringify({ type: 'join', playerId }))
    })

    socket.addEventListener('close', () => {
      setConnected(false)
    })

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as PartyMessage

        switch (data.type) {
          case 'cursor':
            // Only show cursor if it's from a different player
            if (data.playerId !== playerId) {
              setOpponentCursor({
                playerId: data.playerId,
                x: data.x,
                y: data.y,
                color: data.color,
                isDragging: data.isDragging,
              })
            }
            break

          case 'game_update':
            onGameUpdate?.(data.game, data.moves)
            break

          case 'player_left':
            if (data.playerId !== playerId) {
              setOpponentCursor(null)
            }
            break
        }
      } catch (e) {
        console.error('Failed to parse party message:', e)
      }
    })

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [gameCode, playerId, onGameUpdate])

  const sendCursor = useCallback(
    (x: number, y: number, color: PlayerColor, isDragging: boolean) => {
      if (!socketRef.current || !playerId) return
      socketRef.current.send(
        JSON.stringify({
          type: 'cursor',
          playerId,
          x,
          y,
          color,
          isDragging,
        })
      )
    },
    [playerId]
  )

  const sendGameUpdate = useCallback(
    (game: unknown, moves: unknown[]) => {
      if (!socketRef.current) return
      socketRef.current.send(
        JSON.stringify({
          type: 'game_update',
          game,
          moves,
        })
      )
    },
    []
  )

  return {
    connected,
    opponentCursor,
    sendCursor,
    sendGameUpdate,
  }
}
