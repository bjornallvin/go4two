'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessageData } from '@/lib/hooks/usePartySocket'
import type { PlayerColor } from '@/lib/types'
import { Stone } from './Stone'

interface ChatPanelProps {
  messages: ChatMessageData[]
  playerId: string | null
  playerColor: PlayerColor | null
  onSendMessage: (message: string) => void
  isOpen: boolean
  onToggle: () => void
  unreadCount: number
}

export function ChatPanel({
  messages,
  playerId,
  playerColor,
  onSendMessage,
  isOpen,
  onToggle,
  unreadCount,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onToggle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Determine opponent color
  const getMessageColor = (msg: ChatMessageData): PlayerColor => {
    if (msg.isOwn) return playerColor || 'black'
    return playerColor === 'black' ? 'white' : 'black'
  }

  return (
    <>
      {/* Mobile: Floating chat button (hidden when chat is open) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="md:hidden fixed bottom-4 right-4 z-30 w-14 h-14 bg-stone-700 hover:bg-stone-600 rounded-full shadow-lg flex items-center justify-center transition-all"
        >
          <svg className="w-6 h-6 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile: Chat overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-stone-900/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-stone-700">
            <h2 className="text-stone-100 font-semibold">Chat</h2>
            <button onClick={onToggle} className="text-stone-400 hover:text-stone-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-stone-500 text-center text-sm">No messages yet. Say hello!</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Stone color={getMessageColor(msg)} size={24} />
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 ${
                    msg.isOwn
                      ? 'bg-amber-600/30 text-stone-100'
                      : 'bg-stone-700/50 text-stone-200'
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                  <p className="text-xs text-stone-500 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t border-stone-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                className="flex-1 bg-stone-800 border border-stone-600 rounded-xl px-4 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop: Side panel */}
      <div className={`hidden md:flex fixed right-4 top-4 bottom-4 w-80 bg-stone-800/95 backdrop-blur rounded-2xl border border-stone-700/50 shadow-xl flex-col z-10 transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`}>
        <div className="p-4 border-b border-stone-700/50 flex items-center justify-between">
          <h2 className="text-stone-100 font-semibold">Chat</h2>
          <button onClick={onToggle} className="text-stone-400 hover:text-stone-200 transition-colors" title="Close chat">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-stone-500 text-center text-sm">No messages yet. Say hello!</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
            >
              <Stone color={getMessageColor(msg)} size={20} />
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.isOwn
                    ? 'bg-amber-600/30 text-stone-100'
                    : 'bg-stone-700/50 text-stone-200'
                }`}
              >
                <p className="break-words text-sm">{msg.message}</p>
                <p className="text-xs text-stone-500 mt-1">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-stone-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 bg-stone-700/50 border border-stone-600/50 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl transition-colors text-sm"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
