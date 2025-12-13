import { NextRequest, NextResponse } from 'next/server'
import { passTurn, getGameByCode } from '@/lib/game/actions'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      )
    }

    const { game, error: gameError } = await getGameByCode(code)

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const { success, error } = await passTurn(game.id, playerId)

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to pass' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error passing turn:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
