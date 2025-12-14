'use client'

import { useVoiceChat } from '@/lib/hooks/useVoiceChat'

interface VoiceChatProps {
  gameCode: string
  playerId: string | null
  opponentPeerId: string | null
  onPeerIdReady: (peerId: string) => void
}

export function VoiceChat({ gameCode, playerId, opponentPeerId, onPeerIdReady }: VoiceChatProps) {
  const { callState, isMicMuted, isSupported, errorMessage, toggleMic } = useVoiceChat({
    gameCode,
    playerId,
    opponentPeerId,
    onPeerIdReady,
  })

  if (!isSupported) {
    return null // Don't show anything if voice chat not supported
  }

  const getStatusColor = () => {
    switch (callState) {
      case 'connected':
        return isMicMuted ? 'text-red-400' : 'text-green-400'
      case 'connecting':
        return 'text-amber-400 animate-pulse'
      case 'error':
        return 'text-red-400'
      case 'idle':
      default:
        // Idle but waiting for opponent - show subtle amber
        return opponentPeerId ? 'text-amber-400' : 'text-stone-500'
    }
  }

  const getTitle = () => {
    if (errorMessage) return `Error: ${errorMessage}`
    switch (callState) {
      case 'connected':
        return isMicMuted ? 'Microphone muted (click to unmute)' : 'Voice chat active (click to mute)'
      case 'connecting':
        return 'Connecting voice chat...'
      case 'error':
        return 'Voice chat error'
      case 'idle':
      default:
        return opponentPeerId ? 'Waiting to connect...' : 'Waiting for opponent...'
    }
  }

  return (
    <button
      onClick={toggleMic}
      disabled={callState !== 'connected'}
      className={`p-2 transition-colors ${getStatusColor()} ${
        callState === 'connected' ? 'hover:text-amber-400' : 'opacity-50 cursor-default'
      }`}
      title={getTitle()}
    >
      {/* Mic icon with dynamic state */}
      <div className="relative">
        {isMicMuted || callState !== 'connected' ? (
          // Mic off icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          // Mic on icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
        {/* Connection status indicator */}
        {callState === 'connected' && !isMicMuted && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
        {callState === 'connecting' && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </div>
    </button>
  )
}
