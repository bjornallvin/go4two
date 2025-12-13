'use client'

import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'

const PLAYER_ID_KEY = 'go4two_player_id'

export function usePlayerId(): string | null {
  const [playerId, setPlayerId] = useState<string | null>(null)

  useEffect(() => {
    // Check if we already have a player ID
    let id = localStorage.getItem(PLAYER_ID_KEY)

    if (!id) {
      // Generate a new one
      id = nanoid(16)
      localStorage.setItem(PLAYER_ID_KEY, id)
    }

    setPlayerId(id)
  }, [])

  return playerId
}
