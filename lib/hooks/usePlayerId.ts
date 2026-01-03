'use client'

import { useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'

const PLAYER_ID_KEY = 'go4two_player_id'
const MAX_IDS = 10

interface PlayerIdStorage {
  version: 2
  ids: string[]
}

export interface UsePlayerIdResult {
  primaryId: string | null
  allIds: string[]
  addId: (id: string) => { success: boolean; error?: string }
  removeId: (id: string) => { success: boolean; error?: string }
  isMyId: (id: string | null) => boolean
  loaded: boolean
}

// Validate ID format: 8-21 alphanumeric chars (covers old 16-char and new 8-char)
function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{8,21}$/.test(id)
}

function loadStorage(): PlayerIdStorage | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(PLAYER_ID_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (parsed.version === 2 && Array.isArray(parsed.ids)) {
      return parsed as PlayerIdStorage
    }
  } catch {
    // Plain string (legacy format) - migrate it
    if (isValidId(stored)) {
      return { version: 2, ids: [stored] }
    }
  }

  return null
}

function saveStorage(data: PlayerIdStorage): void {
  localStorage.setItem(PLAYER_ID_KEY, JSON.stringify(data))
}

export function usePlayerId(): UsePlayerIdResult {
  const [ids, setIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let storage = loadStorage()

    if (!storage) {
      // New user - generate first ID (8 chars)
      const newId = nanoid(8)
      storage = { version: 2, ids: [newId] }
      saveStorage(storage)
    } else {
      // Ensure storage is persisted (handles migration)
      saveStorage(storage)
    }

    setIds(storage.ids)
    setLoaded(true)
  }, [])

  const addId = useCallback((id: string): { success: boolean; error?: string } => {
    const trimmed = id.trim()

    if (!isValidId(trimmed)) {
      return { success: false, error: 'Invalid ID format (must be 8-21 alphanumeric characters)' }
    }

    if (ids.includes(trimmed)) {
      return { success: false, error: 'This ID is already added' }
    }

    if (ids.length >= MAX_IDS) {
      return { success: false, error: `Maximum ${MAX_IDS} IDs allowed` }
    }

    const newIds = [...ids, trimmed]
    setIds(newIds)
    saveStorage({ version: 2, ids: newIds })
    return { success: true }
  }, [ids])

  const removeId = useCallback((id: string): { success: boolean; error?: string } => {
    if (ids.length <= 1) {
      return { success: false, error: 'Cannot remove your only ID' }
    }

    if (ids[0] === id) {
      return { success: false, error: 'Cannot remove your primary ID' }
    }

    const newIds = ids.filter(i => i !== id)
    setIds(newIds)
    saveStorage({ version: 2, ids: newIds })
    return { success: true }
  }, [ids])

  const isMyId = useCallback((id: string | null): boolean => {
    if (!id) return false
    return ids.includes(id)
  }, [ids])

  return {
    primaryId: ids[0] ?? null,
    allIds: ids,
    addId,
    removeId,
    isMyId,
    loaded,
  }
}
