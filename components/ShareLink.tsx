'use client'

import { useState } from 'react'

interface ShareLinkProps {
  gameCode: string
}

export function ShareLink({ gameCode }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/game/${gameCode}`
    : `/game/${gameCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 rounded-2xl p-5 border border-amber-700/30 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🎮</div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-amber-200 font-medium">Invite your friend!</p>
            <p className="text-stone-400 text-sm">Send them this link to start playing</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-stone-900/50 text-stone-300 rounded-xl text-sm font-mono border border-stone-700/50"
            />
            <button
              onClick={handleCopy}
              className={`px-5 py-3 rounded-xl transition-all text-sm font-semibold ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-600/20'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-stone-500 text-xs">
            Or share the code: <span className="font-mono text-amber-400/80 bg-stone-800/50 px-2 py-0.5 rounded">{gameCode}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
