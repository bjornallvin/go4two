import { NextRequest, NextResponse } from 'next/server'
import { makeMove, getGameByCode } from '@/lib/game/actions'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const body = await request.json()
    const { playerId, x, y } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      )
    }

    if (typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json(
        { error: 'Invalid position' },
        { status: 400 }
      )
    }

    // Get game ID from code
    const { game, error: gameError } = await getGameByCode(code)

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const { move, captures, error } = await makeMove(game.id, playerId, x, y)

    if (error || !move) {
      return NextResponse.json(
        { error: error || 'Failed to make move' },
        { status: 400 }
      )
    }

    return NextResponse.json({ move, captures })
  } catch (e) {
    console.error('Error making move:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
