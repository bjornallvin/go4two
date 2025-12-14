'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePlayerId } from '@/lib/hooks/usePlayerId'
import { useGame } from '@/lib/hooks/useGame'
import { usePartySocket } from '@/lib/hooks/usePartySocket'
import { useGameSounds } from '@/lib/hooks/useGameSounds'
import { useGameHistory } from '@/lib/hooks/useGameHistory'
import { DroppableBoard } from '@/components/DroppableBoard'
import { GameInfo } from '@/components/GameInfo'
import { GameControls } from '@/components/GameControls'
import { ShareLink } from '@/components/ShareLink'
import { ReactionOverlay } from '@/components/ReactionOverlay'
import { ReactionPicker } from '@/components/ReactionPicker'
import { ChatPanel } from '@/components/ChatPanel'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { VoiceChat } from '@/components/VoiceChat'
import { RulesModal } from '@/components/RulesModal'
import { GameSelector } from '@/components/GameSelector'
import type { Game, Move, PlayerColor } from '@/lib/types'

interface TerritoryData {
  black: { territory: number; captures: number; total: number }
  white: { territory: number; captures: number; total: number }
  territories: { x: number; y: number; color: PlayerColor }[]
  winner: PlayerColor | 'tie' | null
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const playerId = usePlayerId()

  const { game, moves, playerColor, isMyTurn, loading, error, refetch, setGameState, addOptimisticMove, removeOptimisticMove } = useGame(
    code,
    playerId
  )

  const { games: gameHistory, saveGame } = useGameHistory()

  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [aiThinking, setAiThinking] = useState(false)

  // Detect single-player game (AI player ID starts with 'ai_')
  const isSinglePlayer = game?.white_player_id?.startsWith('ai_') ?? false

  // Sound effects
  const { playPlace, playCapture, playTurn, playError, muted, toggleMute } = useGameSounds()
  const prevIsMyTurn = useRef<boolean | null>(null)

  // Track recent captures for fade-out animation
  const [recentCaptures, setRecentCaptures] = useState<{ x: number; y: number; color: PlayerColor }[]>([])
  const prevMovesLength = useRef(0)

  // Detect new captures when moves change
  useEffect(() => {
    if (moves.length > prevMovesLength.current) {
      // Find new captured moves
      const newMoves = moves.slice(prevMovesLength.current)
      const newCaptures = newMoves
        .filter((m) => m.move_type === 'captured')
        .map((m) => ({ x: m.x, y: m.y, color: m.player_color }))

      if (newCaptures.length > 0) {
        setRecentCaptures(newCaptures)
        // Clear after animation completes
        setTimeout(() => setRecentCaptures([]), 900)
      }
    }
    prevMovesLength.current = moves.length
  }, [moves])

  // Territory scoring state
  const [territoryData, setTerritoryData] = useState<TerritoryData | null>(null)
  const [showTerritoryMarkers, setShowTerritoryMarkers] = useState(false)
  const [territoryFading, setTerritoryFading] = useState(false)

  // Fetch territory score
  const fetchTerritory = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${code}/score`)
      const data = await res.json()
      if (!data.error) {
        setTerritoryData(data)
      }
    } catch (e) {
      console.error('Failed to fetch territory:', e)
    }
  }, [code])

  // Auto-fetch territory on every move change and on load
  useEffect(() => {
    if (game && moves.length > 0) {
      fetchTerritory()
    }
  }, [game, moves.length, fetchTerritory])

  // Handle show territory button - toggles visual markers with fade
  const handleShowTerritory = useCallback(() => {
    if (showTerritoryMarkers) return // Already showing

    setShowTerritoryMarkers(true)
    setTerritoryFading(true)

    // Hide after animation
    setTimeout(() => {
      setShowTerritoryMarkers(false)
      setTerritoryFading(false)
    }, 5000)
  }, [showTerritoryMarkers])

  // Handle game updates from PartySocket
  const handleGameUpdate = useCallback(
    (newGame: unknown, newMoves: unknown[]) => {
      setGameState(newGame as Game, newMoves as Move[])
    },
    [setGameState]
  )

  // PartySocket for real-time cursor, game updates, chat, reactions, and voice signaling
  const {
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
  } = usePartySocket({
    gameCode: code,
    playerId,
    onGameUpdate: handleGameUpdate,
  })

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [lastSeenOpponentMessageCount, setLastSeenOpponentMessageCount] = useState(0)

  // Rules modal state
  const [showRules, setShowRules] = useState(false)

  // Save game to history when game state updates
  useEffect(() => {
    if (game) {
      saveGame({
        code,
        boardSize: game.board_size,
        playerColor,
        status: game.status,
        createdAt: new Date(game.created_at).getTime(),
        isCreator: game.black_player_id === playerId && game.white_player_id === null,
      })
    }
  }, [game, code, playerColor, playerId, saveGame])

  // Count only opponent messages for unread badge
  const opponentMessageCount = chatMessages.filter((msg) => !msg.isOwn).length
  const unreadCount = isChatOpen ? 0 : Math.max(0, opponentMessageCount - lastSeenOpponentMessageCount)

  // Update last seen count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setLastSeenOpponentMessageCount(opponentMessageCount)
    }
  }, [isChatOpen, opponentMessageCount])

  // Play turn notification when it becomes my turn
  useEffect(() => {
    if (prevIsMyTurn.current === false && isMyTurn === true) {
      playTurn()
    }
    prevIsMyTurn.current = isMyTurn
  }, [isMyTurn, playTurn])

  // Trigger AI move in single-player games
  useEffect(() => {
    if (!isSinglePlayer || !game || game.status !== 'active' || aiThinking) return
    if (game.current_turn !== 'white') return // AI is always white

    const triggerAIMove = async () => {
      setAiThinking(true)
      try {
        // Small delay to make it feel more natural
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

        const res = await fetch(`/api/games/${code}/ai`, { method: 'POST' })
        const data = await res.json()

        if (data.success) {
          // Play sound based on result
          if (data.move.type === 'place') {
            if (data.captures && data.captures.length > 0) {
              playCapture()
            } else {
              playPlace()
            }
          }
          // Refetch game state
          await refetch()
        } else if (data.error) {
          console.error('AI move error:', data.error)
          // If game is over, refetch to get the final state
          if (data.gameOver) {
            await refetch()
          }
        }
      } catch (e) {
        console.error('Failed to trigger AI move:', e)
      } finally {
        setAiThinking(false)
      }
    }

    triggerAIMove()
  }, [isSinglePlayer, game, code, aiThinking, playCapture, playPlace, refetch])

  // Auto-join game when playerId is available
  useEffect(() => {
    if (!playerId || joined || joining) return

    const doJoin = async () => {
      setJoining(true)
      try {
        const res = await fetch(`/api/games/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        })
        const data = await res.json()
        if (data.error) {
          console.error('Join error:', data.error)
        } else if (data.game) {
          // Fetch full game state and broadcast to other players
          const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
          if (updated.game) {
            setGameState(updated.game, updated.moves)
            sendGameUpdate(updated.game, updated.moves)
          }
        }
        setJoined(true)
      } catch (e) {
        console.error('Failed to join:', e)
      } finally {
        setJoining(false)
      }
    }

    doJoin()
  }, [playerId, code, joined, joining, setGameState, sendGameUpdate])

  const handleMove = async (x: number, y: number) => {
    if (!playerId || !game || !playerColor) return

    setMoveError(null)

    // Optimistic update - immediately show the stone
    addOptimisticMove(x, y, playerColor)

    try {
      const res = await fetch(`/api/games/${code}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, x, y }),
      })
      const data = await res.json()
      if (data.error) {
        // Rollback optimistic update
        removeOptimisticMove(x, y)
        setMoveError(data.error)
        playError()
        setTimeout(() => setMoveError(null), 3000)
      } else {
        // Play sound based on result
        if (data.captures && data.captures.length > 0) {
          playCapture()
        } else {
          playPlace()
        }
        // Fetch actual state and broadcast update
        const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
        if (updated.game) {
          setGameState(updated.game, updated.moves)
          sendGameUpdate(updated.game, updated.moves)
        }
      }
    } catch (e) {
      // Rollback optimistic update
      removeOptimisticMove(x, y)
      setMoveError('Failed to make move')
      setTimeout(() => setMoveError(null), 3000)
    }
  }

  const handleCursorMove = useCallback(
    (x: number, y: number, isDragging: boolean) => {
      if (playerColor) {
        sendCursor(x, y, playerColor, isDragging)
      }
    },
    [playerColor, sendCursor]
  )

  // Calculate my last placed stone (shown when it's my turn)
  const myLastPlaceMove = useMemo(() => {
    if (!playerColor || !isMyTurn) return null
    // Find my most recent 'place' move
    for (let i = moves.length - 1; i >= 0; i--) {
      if (moves[i].move_type === 'place' && moves[i].player_color === playerColor) {
        return { x: moves[i].x, y: moves[i].y }
      }
    }
    return null
  }, [moves, playerColor, isMyTurn])

  const handlePass = async () => {
    if (!playerId || !game) return

    try {
      await fetch(`/api/games/${code}/pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
      // Refetch and broadcast
      const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
      if (updated.game) {
        setGameState(updated.game, updated.moves)
        sendGameUpdate(updated.game, updated.moves)
      }
    } catch (e) {
      console.error('Failed to pass:', e)
    }
  }

  const handleResign = async () => {
    if (!playerId || !game) return

    try {
      await fetch(`/api/games/${code}/resign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
      // Refetch and broadcast
      const updated = await fetch(`/api/games/${code}`).then((r) => r.json())
      if (updated.game) {
        setGameState(updated.game, updated.moves)
        sendGameUpdate(updated.game, updated.moves)
      }
    } catch (e) {
      console.error('Failed to resign:', e)
    }
  }

  if (loading || !playerId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-stone-400 animate-pulse">Setting up the board...</div>
      </main>
    )
  }

  if (error || !game) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4 bg-stone-800/50 rounded-2xl p-8 border border-stone-700/50">
          <p className="text-red-400">{error || 'Game not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-stone-700/50 hover:bg-stone-600/50 text-stone-100 rounded-xl transition-all border border-stone-600/50"
          >
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={`flex-1 flex flex-col p-4 transition-[padding] ${isChatOpen ? 'md:pr-[340px]' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-2"
          >
            <span>&larr;</span>
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-stone-800 to-black shadow" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-100 bg-clip-text text-transparent">
              Go4Two
            </h1>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-stone-100 to-stone-300 shadow" />
            {connected && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected" />
            )}
          </div>
          <div className="flex items-center">
            <GameSelector currentCode={code} games={gameHistory} />
            <button
              onClick={() => setShowRules(true)}
              className="text-stone-400 hover:text-amber-400 transition-colors p-2"
              title="How to play"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={toggleMute}
              className="text-stone-400 hover:text-amber-400 transition-colors p-2"
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            {/* Voice chat (only when game is active and multiplayer) */}
            {game.status !== 'waiting' && !isSinglePlayer && (
              <VoiceChat
                gameCode={code}
                playerId={playerId}
                opponentPeerId={opponentPeerId}
                onPeerIdReady={sendPeerId}
              />
            )}
            {/* Desktop chat toggle (only for multiplayer) */}
            {!isSinglePlayer && (
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="hidden md:block relative text-stone-400 hover:text-amber-400 transition-colors p-2"
                title={isChatOpen ? 'Close chat' : 'Open chat'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {!isChatOpen && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Game info */}
        <GameInfo game={game} playerColor={playerColor} isMyTurn={isMyTurn} territoryData={territoryData} isSinglePlayer={isSinglePlayer} aiThinking={aiThinking} />

        {/* Share link (when waiting) */}
        {game.status === 'waiting' && <ShareLink gameCode={code} />}

        {/* Error message */}
        {moveError && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-xl text-sm">
            {moveError}
          </div>
        )}

        {/* Board with reaction overlay */}
        <div className="flex justify-center">
          <DroppableBoard
            size={game.board_size}
            moves={moves}
            playerColor={playerColor}
            isMyTurn={isMyTurn}
            myLastMove={myLastPlaceMove}
            opponentCursor={opponentCursor}
            onMove={handleMove}
            onCursorMove={handleCursorMove}
            overlay={<ReactionOverlay reaction={activeReaction} onComplete={clearReaction} />}
            recentCaptures={recentCaptures}
            territories={(showTerritoryMarkers || game.status === 'finished') ? (territoryData?.territories || []) : []}
            territoryFading={territoryFading && game.status === 'active'}
            gameFinished={game.status === 'finished'}
            gameWaiting={game.status === 'waiting'}
          />
        </div>

        {/* Controls and reactions */}
        {playerColor && (
          <div className="flex flex-col items-center gap-4">
            <GameControls
              gameCode={code}
              playerId={playerId}
              isMyTurn={isMyTurn}
              isActive={game.status === 'active'}
              onPass={handlePass}
              onResign={handleResign}
              onEstimateScore={handleShowTerritory}
              isEstimating={showTerritoryMarkers}
            />
            {game.status === 'active' && !isSinglePlayer && (
              <ReactionPicker onReaction={sendReaction} />
            )}
          </div>
        )}

        {/* Game finished with score display */}
        {game.status === 'finished' && (
          <div className="space-y-6">
            {territoryData ? (
              <ScoreDisplay score={territoryData} playerColor={playerColor} />
            ) : (
              <div className="text-center bg-stone-800/50 rounded-2xl p-6 border border-stone-700/50">
                <p className="text-stone-400 animate-pulse">Calculating scores...</p>
              </div>
            )}
            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat panel (only for multiplayer) */}
      {!isSinglePlayer && (
        <ChatPanel
          messages={chatMessages}
          playerId={playerId}
          playerColor={playerColor}
          onSendMessage={sendChat}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          unreadCount={unreadCount}
        />
      )}

      {/* Footer */}
      <footer className="py-2 text-center space-y-1">
        <p className="text-stone-500 text-sm">
          Crafted with care by{' '}
          <a
            href="https://github.com/bjornallvin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 transition-colors"
          >
            Björn Allvin
          </a>
        </p>
        <p className="text-stone-600 text-sm">
          <a
            href="https://github.com/bjornallvin/go4two"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-400 transition-colors"
          >
            View on GitHub
          </a>
          {' · '}
          © {new Date().getFullYear()}
        </p>
      </footer>

      {/* Rules modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </main>
  )
}
