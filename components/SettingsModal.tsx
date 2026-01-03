'use client'

import { useState } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  primaryId: string | null
  allIds: string[]
  addId: (id: string) => { success: boolean; error?: string }
  removeId: (id: string) => { success: boolean; error?: string }
  onImportGames?: (playerId: string) => Promise<number>
  onSyncAllGames?: () => Promise<number>
}

export function SettingsModal({ isOpen, onClose, primaryId, allIds, addId, removeId, onImportGames, onSyncAllGames }: SettingsModalProps) {
  const [newId, setNewId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    if (!primaryId) return
    try {
      await navigator.clipboard.writeText(primaryId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const handleAddId = async () => {
    if (!newId.trim()) return
    const result = addId(newId)
    if (result.success) {
      const addedId = newId.trim()
      setNewId('')
      setError(null)

      // Import games for the new ID
      if (onImportGames) {
        setImporting(true)
        setImportResult(null)
        try {
          const count = await onImportGames(addedId)
          if (count > 0) {
            setImportResult(`Imported ${count} game${count > 1 ? 's' : ''}`)
          } else {
            setImportResult('No games found for this ID')
          }
          setTimeout(() => setImportResult(null), 3000)
        } catch (e) {
          console.error('Failed to import games:', e)
        } finally {
          setImporting(false)
        }
      }
    } else {
      setError(result.error || 'Failed to add ID')
    }
  }

  const handleRemoveId = (id: string) => {
    const result = removeId(id)
    if (!result.success) {
      setError(result.error || 'Failed to remove ID')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleSyncGames = async () => {
    if (!onSyncAllGames) return
    setSyncing(true)
    setImportResult(null)
    try {
      const count = await onSyncAllGames()
      if (count > 0) {
        setImportResult(`Synced ${count} game${count > 1 ? 's' : ''}`)
      } else {
        setImportResult('All games already synced')
      }
      setTimeout(() => setImportResult(null), 3000)
    } catch (e) {
      console.error('Failed to sync games:', e)
      setError('Failed to sync games')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-700">
          <h2 className="text-xl font-bold text-stone-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Primary ID Section */}
          <div>
            <h3 className="text-amber-400 font-semibold mb-2">Your Player ID</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-stone-800 text-stone-200 px-3 py-2 rounded-lg font-mono text-sm border border-stone-700">
                {primaryId || '...'}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-stone-500 text-sm mt-2">
              Share this ID to access your games from another device.
            </p>
          </div>

          {/* All IDs Section */}
          {allIds.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-amber-400 font-semibold">Linked IDs ({allIds.length})</h3>
                {onSyncAllGames && (
                  <button
                    onClick={handleSyncGames}
                    disabled={syncing}
                    className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 disabled:bg-stone-800 text-stone-300 disabled:text-stone-500 rounded transition-colors"
                  >
                    {syncing ? 'Syncing...' : 'Sync Games'}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {allIds.map((id, index) => (
                  <div key={id} className="flex items-center gap-2 bg-stone-800/50 px-3 py-2 rounded-lg border border-stone-700/50">
                    <code className="flex-1 font-mono text-sm text-stone-300 truncate">
                      {id}
                    </code>
                    {index === 0 ? (
                      <span className="text-xs text-amber-500/70 px-2 py-0.5 bg-amber-500/10 rounded">
                        primary
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemoveId(id)}
                        className="text-stone-500 hover:text-red-400 transition-colors p-1"
                        title="Remove this ID"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add ID Section */}
          <div>
            <h3 className="text-amber-400 font-semibold mb-2">Add ID from another device</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newId}
                onChange={(e) => {
                  setNewId(e.target.value)
                  setError(null)
                }}
                placeholder="Paste ID here..."
                className="flex-1 bg-stone-800 text-stone-200 px-3 py-2 rounded-lg border border-stone-700 focus:border-amber-500/50 focus:outline-none text-sm font-mono placeholder:text-stone-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddId()
                }}
                disabled={importing}
              />
              <button
                onClick={handleAddId}
                disabled={!newId.trim() || importing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {importing ? 'Adding...' : 'Add'}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            {importResult && (
              <p className="text-green-400 text-sm mt-2">{importResult}</p>
            )}
            <p className="text-stone-500 text-sm mt-2">
              Add an ID to access games from another browser.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 bg-stone-800/50">
          <p className="text-stone-500 text-xs text-center">
            Player IDs are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  )
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-stone-400 hover:text-amber-400 transition-colors p-2"
      title="Settings"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  )
}
