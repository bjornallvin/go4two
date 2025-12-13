'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [boardSize, setBoardSize] = useState(19)
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const createGame = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardSize }),
      })
      const data = await res.json()
      if (data.code) {
        router.push(`/game/${data.code}`)
      } else {
        setError(data.error || 'Failed to create game')
      }
    } catch (e) {
      setError('Failed to create game')
    } finally {
      setCreating(false)
    }
  }

  const joinGame = () => {
    if (joinCode.trim()) {
      router.push(`/game/${joinCode.trim().toLowerCase()}`)
    }
  }

  return (
    <main className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-100">Go4Two</h1>
          <p className="mt-2 text-stone-400">Play Go with a friend</p>
        </div>

        {/* Create Game */}
        <div className="bg-stone-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-stone-100">Create Game</h2>

          <div>
            <label className="block text-sm text-stone-400 mb-2">Board Size</label>
            <div className="flex gap-2">
              {[9, 13, 19].map((size) => (
                <button
                  key={size}
                  onClick={() => setBoardSize(size)}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                    boardSize === size
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createGame}
            disabled={creating}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-600 text-white font-semibold rounded transition-colors"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        {/* Join Game */}
        <div className="bg-stone-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-stone-100">Join Game</h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              placeholder="Enter game code"
              className="flex-1 px-4 py-2 bg-stone-700 text-stone-100 rounded placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <button
              onClick={joinGame}
              disabled={!joinCode.trim()}
              className="px-6 py-2 bg-stone-600 hover:bg-stone-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-medium rounded transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-center">{error}</p>
        )}
      </div>
    </main>
  )
}
