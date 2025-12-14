'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Peer, { MediaConnection } from 'peerjs'

export type VoiceChatState = 'idle' | 'connecting' | 'connected' | 'error'

interface UseVoiceChatOptions {
  gameCode: string
  playerId: string | null
  opponentPeerId: string | null
  onPeerIdReady: (peerId: string) => void
}

interface UseVoiceChatResult {
  callState: VoiceChatState
  isMicMuted: boolean
  isSupported: boolean
  errorMessage: string | null
  toggleMic: () => void
}

// Create a PeerJS-safe ID (alphanumeric only)
function sanitizePeerId(gameCode: string, playerId: string): string {
  // Remove any non-alphanumeric characters and create a unique ID
  const safeGame = gameCode.replace(/[^a-zA-Z0-9]/g, '')
  const safePlayer = playerId.replace(/[^a-zA-Z0-9]/g, '')
  return `go4two${safeGame}${safePlayer}`
}

export function useVoiceChat({
  gameCode,
  playerId,
  opponentPeerId,
  onPeerIdReady,
}: UseVoiceChatOptions): UseVoiceChatResult {
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInitialized = useRef(false)

  const [callState, setCallState] = useState<VoiceChatState>('idle')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  })

  // Create audio element for remote stream
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = document.createElement('audio')
    audio.autoplay = true
    audioRef.current = audio
    return () => {
      audio.srcObject = null
    }
  }, [])

  // Initialize PeerJS and get microphone
  useEffect(() => {
    if (!isSupported || !playerId || !gameCode) return
    if (hasInitialized.current) return
    hasInitialized.current = true

    let mounted = true
    const peerId = sanitizePeerId(gameCode, playerId)
    console.log('[VoiceChat] Initializing with peer ID:', peerId)

    const initPeer = async () => {
      try {
        // Request microphone access
        console.log('[VoiceChat] Requesting microphone access...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localStreamRef.current = stream
        console.log('[VoiceChat] Microphone access granted')

        // Create peer with explicit config
        console.log('[VoiceChat] Creating PeerJS connection...')
        const peer = new Peer(peerId, {
          debug: 2, // Log warnings and errors
        })
        peerRef.current = peer

        peer.on('open', (id) => {
          console.log('[VoiceChat] Peer connection open, ID:', id)
          if (mounted) {
            setCallState('idle')
            onPeerIdReady(id)
          }
        })

        peer.on('call', (call) => {
          console.log('[VoiceChat] Incoming call from:', call.peer)
          if (!mounted) return
          // Answer incoming call with our stream
          call.answer(localStreamRef.current!)
          callRef.current = call
          setCallState('connecting')

          call.on('stream', (remoteStream) => {
            console.log('[VoiceChat] Received remote stream')
            if (audioRef.current) {
              audioRef.current.srcObject = remoteStream
            }
            setCallState('connected')
          })

          call.on('close', () => {
            console.log('[VoiceChat] Call closed')
            setCallState('idle')
            callRef.current = null
          })

          call.on('error', (err) => {
            console.error('[VoiceChat] Call error:', err)
            setCallState('error')
            setErrorMessage('Call failed')
          })
        })

        peer.on('error', (err) => {
          console.error('[VoiceChat] Peer error:', err.type, err.message)
          // Don't show error for "peer unavailable" as that's expected if opponent isn't ready
          if (err.type !== 'peer-unavailable') {
            setErrorMessage(err.message || 'Connection error')
            setCallState('error')
          }
        })

        peer.on('disconnected', () => {
          console.log('[VoiceChat] Peer disconnected, attempting reconnect...')
          peer.reconnect()
        })
      } catch (err) {
        if (!mounted) return
        console.error('[VoiceChat] Failed to initialize:', err)
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setErrorMessage('Microphone access denied')
          } else {
            setErrorMessage(err.message)
          }
        }
        setCallState('error')
      }
    }

    initPeer()

    return () => {
      mounted = false
      if (callRef.current) {
        callRef.current.close()
        callRef.current = null
      }
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      hasInitialized.current = false
    }
  }, [isSupported, playerId, gameCode, onPeerIdReady])

  // Initiate call when we have opponent's peer ID
  useEffect(() => {
    if (!opponentPeerId || !peerRef.current || !localStreamRef.current) return
    if (callRef.current) return // Already in a call
    if (callState === 'connected' || callState === 'connecting') return

    // Small delay to ensure peer is ready
    const timer = setTimeout(() => {
      if (!peerRef.current || !localStreamRef.current) return

      setCallState('connecting')
      const call = peerRef.current.call(opponentPeerId, localStreamRef.current)
      callRef.current = call

      call.on('stream', (remoteStream) => {
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream
        }
        setCallState('connected')
      })

      call.on('close', () => {
        setCallState('idle')
        callRef.current = null
      })

      call.on('error', (err) => {
        console.error('Call error:', err)
        setCallState('error')
        setErrorMessage('Call failed')
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [opponentPeerId, callState])

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        setIsMicMuted(!track.enabled)
      }
    }
  }, [])

  return {
    callState,
    isMicMuted,
    isSupported,
    errorMessage,
    toggleMic,
  }
}
