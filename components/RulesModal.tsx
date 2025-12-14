'use client'

import { useState } from 'react'
import { Stone } from './Stone'

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'captures' | 'scoring' | 'strategy'>('basics')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-700">
          <h2 className="text-xl font-bold text-stone-100">How to Play Go</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-700">
          {[
            { id: 'basics', label: 'Basics' },
            { id: 'captures', label: 'Captures' },
            { id: 'scoring', label: 'Scoring' },
            { id: 'strategy', label: 'Strategy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-stone-800/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[50vh] text-stone-300 space-y-4">
          {activeTab === 'basics' && (
            <>
              <Section title="The Goal">
                <p>Control more territory than your opponent. Territory is empty space surrounded by your stones.</p>
              </Section>

              <Section title="Taking Turns">
                <div className="flex items-center gap-2 mb-2">
                  <Stone color="black" size={20} />
                  <span>Black always plays first</span>
                </div>
                <p>Players alternate placing one stone per turn on any empty intersection.</p>
              </Section>

              <Section title="Placing Stones">
                <p>Tap any empty point on the board, or drag a stone from the supply. Once placed, stones don&apos;t move (unless captured).</p>
              </Section>

              <Section title="Passing">
                <p>You can pass your turn if you have no good moves. When both players pass consecutively, the game ends.</p>
              </Section>
            </>
          )}

          {activeTab === 'captures' && (
            <>
              <Section title="Liberties">
                <p>Every stone needs &quot;liberties&quot; (empty adjacent points) to survive. Liberties are the empty points directly up, down, left, or right of a stone.</p>
              </Section>

              <Section title="Capturing Stones">
                <p>When you fill an opponent&apos;s last liberty, their stone(s) are captured and removed from the board. Connected stones of the same color share liberties.</p>
              </Section>

              <Section title="Groups">
                <p>Stones of the same color that are connected horizontally or vertically form a group. The group lives or dies as one unit.</p>
              </Section>

              <Section title="Suicide Rule">
                <p>You cannot place a stone that would have zero liberties, unless doing so captures opponent stones first.</p>
              </Section>

              <Section title="Ko Rule">
                <p>You cannot immediately recapture a single stone that just captured yours (would create infinite loop). You must play elsewhere first.</p>
              </Section>
            </>
          )}

          {activeTab === 'scoring' && (
            <>
              <Section title="Territory">
                <p>Empty points completely surrounded by your stones count as your territory. Each point = 1 point.</p>
              </Section>

              <Section title="Captures">
                <p>Each stone you captured during the game = 1 point.</p>
              </Section>

              <Section title="Komi">
                <div className="flex items-center gap-2 mb-2">
                  <Stone color="white" size={20} />
                  <span>White receives 6.5 points</span>
                </div>
                <p>Since Black plays first and has an advantage, White gets 6.5 bonus points (komi). The half-point prevents ties.</p>
              </Section>

              <Section title="Final Score">
                <p className="font-medium">Territory + Captures + Komi (white only) = Final Score</p>
                <p className="text-stone-400 text-sm mt-2">Tap the score display during the game to see the breakdown.</p>
              </Section>
            </>
          )}

          {activeTab === 'strategy' && (
            <>
              <Section title="Corners First">
                <p>Corners are easiest to secure territory (two walls already). Then edges, then center.</p>
              </Section>

              <Section title="Stay Connected">
                <p>Keep your stones connected when possible. Isolated stones are easier to capture.</p>
              </Section>

              <Section title="Give Your Groups Space">
                <p>Groups need two separate &quot;eyes&quot; (enclosed empty points) to be permanently safe. One eye can be filled; two cannot.</p>
              </Section>

              <Section title="Don&apos;t Be Greedy">
                <p>Trying to surround too much territory too quickly leaves weaknesses. Balance expansion with defense.</p>
              </Section>

              <Section title="Learn to Let Go">
                <p>Sometimes stones aren&apos;t worth saving. Don&apos;t throw good stones after bad trying to save a lost group.</p>
              </Section>

              <Section title="Watch the Score">
                <p>Use &quot;Show Territory&quot; to visualize who&apos;s ahead. Knowing the score helps you decide when to play safe vs. take risks.</p>
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 bg-stone-800/50">
          <p className="text-stone-500 text-sm text-center">
            Go is simple to learn, takes a lifetime to master. Have fun!
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-amber-400 font-semibold mb-2">{title}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export function RulesButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-stone-700/50 hover:bg-stone-600/50 text-stone-300 rounded-xl transition-all border border-stone-600/50 hover:border-stone-500/50 text-sm"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Rules
    </button>
  )
}
