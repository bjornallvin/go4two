import { NextRequest, NextResponse } from 'next/server'
import { getGameWithMoves, makeMoveByCode, passTurnByCode } from '@/lib/game/actions'
import { generateAIMove } from '@/lib/game/ai'
import { isGameOver } from '@/lib/game/engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    // Get current game state
    const { game, moves, error } = await getGameWithMoves(code)

    if (error || !game) {
      return NextResponse.json({ error: error || 'Game not found' }, { status: 404 })
    }

    if (game.status !== 'active') {
      return NextResponse.json({ error: 'Game is not active' }, { status: 400 })
    }

    // Check if this is a single-player game (AI player ID starts with 'ai_')
    const aiPlayerId = game.white_player_id
    if (!aiPlayerId || !aiPlayerId.startsWith('ai_')) {
      return NextResponse.json({ error: 'Not a single-player game' }, { status: 400 })
    }

    // Determine AI color (AI is always white in single-player)
    const aiColor = 'white' as const

    // Check if it's AI's turn
    if (game.current_turn !== aiColor) {
      return NextResponse.json({ error: 'Not AI turn' }, { status: 400 })
    }

    // Check if game is already over (two consecutive passes)
    if (isGameOver(game.board_size, moves)) {
      return NextResponse.json({ error: 'Game is already over', gameOver: true }, { status: 400 })
    }

    // Generate AI move
    const aiMove = generateAIMove(game.board_size, moves, aiColor)

    if (aiMove === 'pass') {
      // AI passes
      const result = await passTurnByCode(code, aiPlayerId)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        move: { type: 'pass' },
        gameOver: result.gameOver,
        game: result.game,
      })
    } else {
      // AI places a stone
      const result = await makeMoveByCode(code, aiPlayerId, aiMove.x, aiMove.y)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        move: { type: 'place', x: aiMove.x, y: aiMove.y },
        captures: result.captures,
        game: result.game,
      })
    }
  } catch (e) {
    console.error('AI move error:', e)
    return NextResponse.json({ error: 'Failed to generate AI move' }, { status: 500 })
  }
}
