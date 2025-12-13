import { NextRequest, NextResponse } from 'next/server'
import { joinGame } from '@/lib/game/actions'

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

    const { game, playerColor, error } = await joinGame(code, playerId)

    if (error || !game) {
      return NextResponse.json(
        { error: error || 'Failed to join game' },
        { status: 400 }
      )
    }

    return NextResponse.json({ game, playerColor })
  } catch (e) {
    console.error('Error joining game:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
