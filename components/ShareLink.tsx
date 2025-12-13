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
    <div className="bg-stone-800 rounded-lg p-4 space-y-2">
      <p className="text-stone-400 text-sm">Share this link with your opponent:</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-stone-900 text-stone-300 rounded text-sm font-mono"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-stone-500 text-xs">
        Game code: <span className="font-mono text-stone-400">{gameCode}</span>
      </p>
    </div>
  )
}
