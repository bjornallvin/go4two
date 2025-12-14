'use client'

import useSound from 'use-sound'
import { useLocalStorage } from './useLocalStorage'

export function useGameSounds() {
  const [muted, setMuted] = useLocalStorage('go4two-sound-muted', false)

  const soundOptions = { soundEnabled: !muted, volume: 0.5 }

  const [playPlace] = useSound('/sounds/place.mp3', soundOptions)
  const [playCapture] = useSound('/sounds/capture.mp3', soundOptions)
  const [playTurn] = useSound('/sounds/turn.mp3', { ...soundOptions, volume: 0.3 })
  const [playError] = useSound('/sounds/error.mp3', { ...soundOptions, volume: 0.4 })

  const toggleMute = () => setMuted(!muted)

  return {
    playPlace,
    playCapture,
    playTurn,
    playError,
    muted,
    toggleMute,
  }
}
