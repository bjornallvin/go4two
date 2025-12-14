'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameHistory } from '@/lib/hooks/useGameHistory'
import { GameHistory } from '@/components/GameHistory'

export default function Home() {
  const router = useRouter()
  const [boardSize, setBoardSize] = useState(19)
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const { games, loaded, saveGame, removeGame, updateGameStatus, clearAll } = useGameHistory()

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false))
  }, [])

  const authenticate = async () => {
    setAuthError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setAuthError(data.error || 'Authentication failed')
      }
    } catch {
      setAuthError('Authentication failed')
    }
  }

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
        // Save to game history
        saveGame({
          code: data.code,
          boardSize,
          playerColor: null,
          status: 'waiting',
          createdAt: Date.now(),
          isCreator: true,
        })
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
    const code = joinCode.trim().toLowerCase()
    if (code) {
      // Save to game history (will be updated with real data when game loads)
      saveGame({
        code,
        boardSize: 19, // Will be updated when game loads
        playerColor: null,
        status: 'active',
        createdAt: Date.now(),
        isCreator: false,
      })
      router.push(`/game/${code}`)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header with decorative stones */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-800 to-black shadow-lg" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
              Go4Two
            </h1>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-100 to-stone-300 shadow-lg" />
          </div>
          <p className="text-stone-400 text-lg">
            The ancient game of Go, made simple for two friends
          </p>
        </div>

        {/* Create Game */}
        <div className="bg-stone-800/50 backdrop-blur rounded-2xl p-6 space-y-5 border border-stone-700/50 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-xl font-semibold text-stone-100">Start a new game</h2>
          </div>

          {isAuthenticated === null ? (
            <div className="text-stone-400 text-center py-4">Loading...</div>
          ) : isAuthenticated ? (
            <>
              <div>
                <label className="block text-sm text-stone-400 mb-3">Choose your board</label>
                <div className="flex gap-3">
                  {[9, 13, 19].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBoardSize(size)}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                        boardSize === size
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-600/25 scale-105'
                          : 'bg-stone-700/50 text-stone-300 hover:bg-stone-600/50 hover:scale-102'
                      }`}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
                <p className="text-stone-500 text-xs mt-2 text-center">
                  {boardSize === 9 ? 'Quick game · ~15 min' : boardSize === 13 ? 'Medium game · ~30 min' : 'Full game · ~1 hour'}
                </p>
              </div>

              <button
                onClick={createGame}
                disabled={creating}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-stone-600 disabled:to-stone-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {creating ? 'Setting up the board...' : 'Create Game'}
              </button>
            </>
          ) : (
            <>
              <p className="text-stone-400 text-sm">Enter the password to create games</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && authenticate()}
                  placeholder="Password"
                  className="flex-1 px-4 py-3 bg-stone-700/50 text-stone-100 rounded-xl placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-stone-600/50"
                />
                <button
                  onClick={authenticate}
                  disabled={!password}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-stone-700 disabled:to-stone-700 disabled:text-stone-500 text-white font-medium rounded-xl transition-all"
                >
                  Unlock
                </button>
              </div>
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
            </>
          )}
        </div>

        {/* Join Game */}
        <div className="bg-stone-800/50 backdrop-blur rounded-2xl p-6 space-y-5 border border-stone-700/50 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-stone-400" />
            <h2 className="text-xl font-semibold text-stone-100">Join a friend</h2>
          </div>

          <p className="text-stone-400 text-sm">Got a game code? Enter it below to join</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              placeholder="e.g. abc123"
              className="flex-1 px-4 py-3 bg-stone-700/50 text-stone-100 rounded-xl placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-stone-600/50 font-mono tracking-wider"
            />
            <button
              onClick={joinGame}
              disabled={!joinCode.trim()}
              className="px-8 py-3 bg-stone-600/50 hover:bg-stone-500/50 disabled:bg-stone-700/30 disabled:text-stone-600 text-white font-medium rounded-xl transition-all border border-stone-500/30 hover:border-stone-400/30"
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
            <p className="text-red-300 text-center text-sm">{error}</p>
          </div>
        )}

        {/* Game History */}
        {loaded && games.length > 0 && (
          <GameHistory
            games={games}
            onRemove={removeGame}
            onClearAll={clearAll}
            onRefresh={updateGameStatus}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center space-y-2">
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
    </main>
  )
}
