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

export type ChatMessageData = {
  id: string
  playerId: string
  message: string
  timestamp: number
  isOwn: boolean
}

export type ActiveReaction = {
  emoji: string
  playerId: string
  timestamp: number
}

type PartyMessage =
  | { type: 'cursor'; playerId: string; x: number; y: number; color: PlayerColor; isDragging: boolean }
  | { type: 'game_update'; game: unknown; moves: unknown[] }
  | { type: 'player_joined'; playerId: string }
  | { type: 'player_left'; playerId: string }
  | { type: 'chat'; playerId: string; message: string; timestamp: number }
  | { type: 'reaction'; playerId: string; emoji: string; timestamp: number }
  | { type: 'peer_id'; playerId: string; peerId: string }

interface UsePartySocketOptions {
  gameCode: string
  playerId: string | null
  onGameUpdate?: (game: unknown, moves: unknown[]) => void
  loadChatHistory?: boolean
}

interface UsePartySocketResult {
  connected: boolean
  opponentCursor: CursorPosition | null
  chatMessages: ChatMessageData[]
  activeReaction: ActiveReaction | null
  opponentPeerId: string | null
  sendCursor: (x: number, y: number, color: PlayerColor, isDragging: boolean) => void
  sendGameUpdate: (game: unknown, moves: unknown[]) => void
  sendChat: (message: string) => void
  sendReaction: (emoji: string) => void
  clearReaction: () => void
  sendPeerId: (peerId: string) => void
}

export function usePartySocket({
  gameCode,
  playerId,
  onGameUpdate,
  loadChatHistory = true,
}: UsePartySocketOptions): UsePartySocketResult {
  const socketRef = useRef<PartySocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [opponentCursor, setOpponentCursor] = useState<CursorPosition | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([])
  const [activeReaction, setActiveReaction] = useState<ActiveReaction | null>(null)
  const [opponentPeerId, setOpponentPeerId] = useState<string | null>(null)
  const chatHistoryLoaded = useRef(false)

  // Load chat history from database
  useEffect(() => {
    if (!gameCode || !playerId || !loadChatHistory || chatHistoryLoaded.current) return

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/games/${gameCode}/chat`)
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          setChatMessages(
            data.messages.map((msg: { id: string; player_id: string; message: string; created_at: string }) => ({
              id: msg.id,
              playerId: msg.player_id,
              message: msg.message,
              timestamp: new Date(msg.created_at).getTime(),
              isOwn: msg.player_id === playerId,
            }))
          )
        }
        chatHistoryLoaded.current = true
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }

    loadHistory()
  }, [gameCode, playerId, loadChatHistory])

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

          case 'chat':
            // Add incoming chat message (from other player)
            setChatMessages((prev) => {
              const newMessage: ChatMessageData = {
                id: `${data.playerId}-${data.timestamp}`,
                playerId: data.playerId,
                message: data.message,
                timestamp: data.timestamp,
                isOwn: false,
              }
              // Keep max 100 messages
              const updated = [...prev, newMessage]
              return updated.slice(-100)
            })
            break

          case 'reaction':
            // Show incoming reaction
            setActiveReaction({
              emoji: data.emoji,
              playerId: data.playerId,
              timestamp: data.timestamp,
            })
            break

          case 'peer_id':
            // Store opponent's peer ID for voice chat
            if (data.playerId !== playerId) {
              setOpponentPeerId(data.peerId)
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

  const sendChat = useCallback(
    (message: string) => {
      if (!socketRef.current || !playerId || !gameCode) return
      const trimmed = message.trim().slice(0, 500) // Max 500 chars
      if (!trimmed) return

      const timestamp = Date.now()
      // Add to local messages immediately
      setChatMessages((prev) => {
        const newMessage: ChatMessageData = {
          id: `${playerId}-${timestamp}`,
          playerId,
          message: trimmed,
          timestamp,
          isOwn: true,
        }
        const updated = [...prev, newMessage]
        return updated.slice(-100)
      })

      // Send to other players via WebSocket
      socketRef.current.send(
        JSON.stringify({
          type: 'chat',
          playerId,
          message: trimmed,
          timestamp,
        })
      )

      // Save to database (fire and forget)
      fetch(`/api/games/${gameCode}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, message: trimmed }),
      }).catch((e) => console.error('Failed to save chat message:', e))
    },
    [playerId, gameCode]
  )

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!socketRef.current || !playerId) return
      const timestamp = Date.now()

      // Show locally immediately
      setActiveReaction({
        emoji,
        playerId,
        timestamp,
      })

      // Send to other players
      socketRef.current.send(
        JSON.stringify({
          type: 'reaction',
          playerId,
          emoji,
          timestamp,
        })
      )
    },
    [playerId]
  )

  const clearReaction = useCallback(() => {
    setActiveReaction(null)
  }, [])

  const sendPeerId = useCallback(
    (peerId: string) => {
      if (!socketRef.current || !playerId) return
      socketRef.current.send(
        JSON.stringify({
          type: 'peer_id',
          playerId,
          peerId,
        })
      )
    },
    [playerId]
  )

  return {
    connected,
    opponentCursor,
    chatMessages,
    activeReaction,
    opponentPeerId,
    sendCursor,
    sendGameUpdate,
    sendChat,
    sendReaction,
    clearReaction,
    sendPeerId,
  }
}
